/**
 * Heuristic Intent Scorer v1 — transparent, weighted, explainable.
 * Every weight is named and documented. No black box.
 *
 * AI_ARCHITECTURE.md §3.1: ships before ML, bootstraps labels.
 * CLAUDE.md §3.4: precision over recall. Conservative thresholds.
 *
 * Score = σ(weighted sum of features)
 * Spawn threshold: 0.75 (configurable)
 * Review band:    0.50–0.74 → ask user for correction label
 */
import { sql } from '../lib/db'
import { phantomService } from '../services/phantom.service'

// ─── Weights (named, auditable) ────────────────────────────────────────────────

const W = {
  ticket_opened:         2.5,   // strongest single signal
  size_entered:          1.8,   // showed intent to size
  stop_set:              1.6,   // risk defined = serious intent
  target_set:            0.8,   // less decisive alone
  hover_dwell_norm:      1.2,   // normalised hover time (0–1)
  drawing_at_level:      0.9,   // drew support/resistance near ticker
  alert_at_level:        0.7,   // set alert near price
  revisit_count_norm:    0.6,   // normalised revisit count (0–1, cap 5)
  user_base_rate_adj:    1.0,   // user's own execution rate history
  idle_decay:           -0.4,   // per 15 min of inactivity
  bias:                 -3.2,   // conservative: score starts below 0.5
}

const SPAWN_THRESHOLD  = 0.75
const REVIEW_THRESHOLD = 0.50

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x))
}

export type IntentFeatures = {
  ticket_opened: boolean
  size_entered: boolean
  stop_set: boolean
  target_set: boolean
  hover_dwell_ms: number      // total hover dwell on buy/sell buttons
  drawing_near_price: boolean // drawing within 0.5% of current price
  alert_set: boolean
  revisit_count: number
  user_execution_rate: number // historical rate: sessions → execution (0–1)
  idle_minutes: number        // minutes since last event in session
}

export type ScoringResult = {
  intent_score: number
  feature_snapshot: IntentFeatures
  signal: 'spawn' | 'review' | 'ignore'
  explanation: Record<string, number>  // feature → contribution
}

export function scoreIntent(features: IntentFeatures): ScoringResult {
  const contributions: Record<string, number> = {
    ticket_opened:      features.ticket_opened ? W.ticket_opened : 0,
    size_entered:       features.size_entered  ? W.size_entered  : 0,
    stop_set:           features.stop_set      ? W.stop_set      : 0,
    target_set:         features.target_set    ? W.target_set    : 0,
    hover_dwell:        Math.min(features.hover_dwell_ms / 3000, 1) * W.hover_dwell_norm,
    drawing_at_level:   features.drawing_near_price ? W.drawing_at_level : 0,
    alert_at_level:     features.alert_set     ? W.alert_at_level : 0,
    revisit_count:      Math.min(features.revisit_count / 5, 1) * W.revisit_count_norm,
    user_base_rate:     (features.user_execution_rate - 0.5) * W.user_base_rate_adj,
    idle_decay:         Math.floor(features.idle_minutes / 15) * W.idle_decay,
    bias:               W.bias,
  }

  const logit = Object.values(contributions).reduce((a, b) => a + b, 0)
  const intent_score = sigmoid(logit)

  const signal: ScoringResult['signal'] =
    intent_score >= SPAWN_THRESHOLD  ? 'spawn'  :
    intent_score >= REVIEW_THRESHOLD ? 'review' : 'ignore'

  return { intent_score: Math.round(intent_score * 10000) / 10000, feature_snapshot: features, signal, explanation: contributions }
}

// ─── Session processor ────────────────────────────────────────────────────────
// Called whenever a session is updated (new event arrives or session closes).

export async function processSession(sessionId: string): Promise<void> {
  const [session] = await sql<[{
    sessionId: string; userId: string; instrumentSymbol: string; instrumentVenue: string;
    assetClass: string; direction: string | null; inferredEntry: number | null;
    inferredStop: number | null; inferredTarget: number | null; inferredSize: number | null;
    endReason: string | null; startedAt: Date
  }]>`
    SELECT s.*, s.instrument_symbol, s.instrument_venue, s.asset_class
    FROM intent.sessions s WHERE s.session_id = ${sessionId} LIMIT 1
  `
  if (!session) return

  // Build feature vector from event counts in the session
  const events = await sql<Array<{ schema: string; payload: Record<string, unknown>; occurredAt: Date }>>`
    SELECT schema, payload, occurred_at FROM events.intent_events
    WHERE context->>'session_hint' = ${sessionId}
    ORDER BY occurred_at ASC
  `

  const features = buildFeatures(events, session)
  const result = scoreIntent(features)

  // Store score (append-only — full trajectory kept)
  await sql`
    INSERT INTO intent.scores (session_id, intent_score, model_id, feature_snapshot)
    VALUES (${sessionId}, ${result.intent_score}, 'heuristic@1.0', ${JSON.stringify(result.feature_snapshot)})
  `

  // Spawn abandoned-entry phantom if session ended without execution and score qualifies
  if (session.endReason === 'abandoned' || session.endReason === 'timeout') {
    if (result.signal === 'spawn' && session.inferredEntry && session.inferredStop) {
      await phantomService.maybeSpawnAbandonedEntry({
        userId: session.userId,
        sessionId,
        instrument: {
          symbol: session.instrumentSymbol,
          venue: session.instrumentVenue,
          asset_class: session.assetClass as 'equity' | 'futures' | 'fx' | 'crypto' | 'option',
        },
        direction: (session.direction ?? 'long') as 'long' | 'short',
        inferredEntry: session.inferredEntry,
        inferredStop: session.inferredStop,
        inferredTarget: session.inferredTarget ?? null,
        inferredSize: session.inferredSize ?? 1,
        intentScore: result.intent_score,
        decisionTime: session.startedAt.toISOString(),
      })
    }
  }
}

function buildFeatures(
  events: Array<{ schema: string; payload: Record<string, unknown>; occurredAt: Date }>,
  session: { startedAt: Date }
): IntentFeatures {
  const schemas = events.map(e => e.schema)
  const lastEvent = events.at(-1)
  const idleMinutes = lastEvent
    ? (Date.now() - lastEvent.occurredAt.getTime()) / 60000
    : 999

  const totalHoverMs = events
    .filter(e => e.schema === 'intent.ticket.hover')
    .reduce((sum, e) => sum + ((e.payload['dwell_ms'] as number) ?? 0), 0)

  return {
    ticket_opened:       schemas.includes('intent.ticket.opened'),
    size_entered:        schemas.includes('intent.ticket.size_entered'),
    stop_set:            schemas.includes('intent.ticket.stop_modified'),
    target_set:          schemas.includes('intent.ticket.target_modified'),
    hover_dwell_ms:      totalHoverMs,
    drawing_near_price:  schemas.includes('intent.drawing.created'),
    alert_set:           schemas.includes('intent.alert.created'),
    revisit_count:       schemas.filter(s => s === 'intent.chart.opened').length,
    user_execution_rate: 0.4,   // cold-start prior; updated when we have history
    idle_minutes:        idleMinutes,
  }
}
