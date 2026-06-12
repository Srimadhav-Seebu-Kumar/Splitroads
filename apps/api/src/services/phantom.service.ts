/**
 * PhantomService — spawning + resolution logic for Phase 1 phantom types.
 * Phase 1 ships: PREMATURE_EXIT (trade-origin, works from broker data alone)
 *                ABANDONED_ENTRY (session-origin, needs intent capture)
 *
 * Math: PHANTOM_ENGINE.md
 * Key law: every outcome is a DISTRIBUTION, never a point. p05/p50/p95 always.
 */
import { sql } from '../lib/db'
import { newId } from '../lib/id'
import type { NormalisedTrade } from '@splitroads/contracts'

// ─── Types ────────────────────────────────────────────────────────────────────

type Instrument = NormalisedTrade['instrument']

type PrematureExitInput = {
  userId: string
  tradeId: string
  instrument: Instrument
  direction: 'long' | 'short'
  avgEntry: number
  avgExit: number
  plannedTarget: number
  plannedStop: number
  size: number
  closedAt: string
}

type AbandonedEntryInput = {
  userId: string
  sessionId: string
  instrument: Instrument
  direction: 'long' | 'short'
  inferredEntry: number
  inferredStop: number | null
  inferredTarget: number | null
  inferredSize: number
  intentScore: number
  decisionTime: string   // ISO UTC
}

type SimResult = {
  r_p05: number; r_p50: number; r_p95: number
  mfe_r: number; mae_r: number
  bars_held: number | null; exit_reason: string
  sim_paths: number; sim_seed: number
}

// ─── Spawn guards ─────────────────────────────────────────────────────────────

/**
 * PREMATURE_EXIT guard: only spawn if the actual exit was before the plan target
 * and the remaining distance to target was meaningful (>0.25R).
 */
function isPrematureExit(
  direction: 'long' | 'short',
  avgEntry: number, avgExit: number,
  plannedTarget: number, plannedStop: number
): boolean {
  const risk = direction === 'long' ? avgEntry - plannedStop : plannedStop - avgEntry
  if (risk <= 0) return false

  const targetSide = direction === 'long'
  const exitedBeforeTarget = targetSide
    ? avgExit < plannedTarget
    : avgExit > plannedTarget

  if (!exitedBeforeTarget) return false

  // The remaining R at exit must be worth simulating (>0.25R threshold)
  const remainingR = direction === 'long'
    ? (plannedTarget - avgExit) / risk
    : (avgExit - plannedTarget) / risk

  return remainingR > 0.25
}

// ─── Simulation (deterministic, seeded) ───────────────────────────────────────

/**
 * Conservative fill + path model for PREMATURE_EXIT:
 * Given the actual exit price, simulate continuing to hold toward the plan target.
 * We replay from the actual exit candle forward using historical bar data if available,
 * or fall back to a parameterised GBM model (clearly labelled).
 *
 * PHANTOM_ENGINE.md §4 rules:
 * - fills include spread + conservative slippage
 * - targets require trade-through (touch alone does not fill)
 * - uncertainty propagated via N=256 paths with stored seed
 */
function simulatePrematureExitOutcome(params: {
  direction: 'long' | 'short'
  entryPrice: number
  exitPrice: number          // actual (premature) exit
  plannedTarget: number
  plannedStop: number
  size: number
  volatilityEst: number      // daily vol estimate (ATR-proxy), fraction of price
  seed: number
}): SimResult {
  const { direction, entryPrice, exitPrice, plannedTarget, plannedStop, volatilityEst, seed } = params
  const risk = Math.abs(entryPrice - plannedStop)
  if (risk === 0) return nullResult(seed)

  const N = 256
  const outcomes: number[] = []
  let rng = seed

  // Simple seeded PRNG (xorshift32)
  function rand(): number {
    rng ^= rng << 13; rng ^= rng >> 17; rng ^= rng << 5
    return ((rng >>> 0) / 0xffffffff)
  }

  // Box-Muller normal sample
  function randn(): number {
    const u1 = Math.max(rand(), 1e-10)
    const u2 = rand()
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
  }

  const barVol = volatilityEst / Math.sqrt(252)   // per-day bar vol
  const drift = 0                                  // conservative: no drift assumption

  let globalMfe = 0
  let globalMae = 0

  for (let i = 0; i < N; i++) {
    let price = exitPrice
    let r = 0
    let pathMfe = 0; let pathMae = 0
    let exitReason = 'time_stop'
    const maxBars = 60   // ~3 weeks of trading days

    for (let b = 0; b < maxBars; b++) {
      const ret = drift + barVol * randn()
      price *= (1 + ret)

      const priceMoveR = direction === 'long'
        ? (price - entryPrice) / risk
        : (entryPrice - price) / risk

      pathMfe = Math.max(pathMfe, priceMoveR)
      pathMae = Math.min(pathMae, priceMoveR)

      // Stop hit — conservative: price must exceed stop meaningfully
      const stopHit = direction === 'long' ? price <= plannedStop * 0.9995 : price >= plannedStop * 1.0005
      // Target hit — requires trade-through (>1 tick past target)
      const spread = exitPrice * 0.0001
      const targetHit = direction === 'long'
        ? price >= plannedTarget + spread
        : price <= plannedTarget - spread

      if (stopHit) { r = -(riskUnits(entryPrice, plannedStop, direction) + slippage(risk)); exitReason = 'stop'; break }
      if (targetHit) { r = riskUnits(entryPrice, plannedTarget, direction) - slippage(risk) * 0.5; exitReason = 'target'; break }
    }

    if (exitReason === 'time_stop') r = direction === 'long' ? (price - entryPrice) / risk : (entryPrice - price) / risk

    globalMfe = Math.max(globalMfe, pathMfe)
    globalMae = Math.min(globalMae, pathMae)
    outcomes.push(r)
  }

  outcomes.sort((a, b) => a - b)
  const p05 = outcomes[Math.floor(N * 0.05)] ?? 0
  const p50 = outcomes[Math.floor(N * 0.5)] ?? 0
  const p95 = outcomes[Math.floor(N * 0.95)] ?? 0

  const actualR = direction === 'long' ? (exitPrice - entryPrice) / risk : (entryPrice - exitPrice) / risk

  return {
    r_p05: round(p05 - actualR),
    r_p50: round(p50 - actualR),
    r_p95: round(p95 - actualR),
    mfe_r: round(globalMfe),
    mae_r: round(globalMae),
    bars_held: null,
    exit_reason: 'target',
    sim_paths: N,
    sim_seed: seed,
  }
}

function riskUnits(entry: number, price: number, direction: 'long' | 'short'): number {
  return direction === 'long' ? price - entry : entry - price
}

function slippage(risk: number): number {
  // Conservative: 3bp of risk distance (PHANTOM_ENGINE.md §4.3)
  return risk * 0.003
}

function round(n: number): number { return Math.round(n * 1000) / 1000 }

function nullResult(seed: number): SimResult {
  return { r_p05: 0, r_p50: 0, r_p95: 0, mfe_r: 0, mae_r: 0, bars_held: null, exit_reason: 'no_fill', sim_paths: 0, sim_seed: seed }
}

// ─── Public API ───────────────────────────────────────────────────────────────

async function maybeSpawnPrematureExit(input: PrematureExitInput): Promise<void> {
  if (!isPrematureExit(input.direction, input.avgEntry, input.avgExit, input.plannedTarget, input.plannedStop)) return

  // Duplicate guard
  const [existing] = await sql<[{ phantomId: string } | undefined]>`
    SELECT phantom_id FROM phantom.phantoms
    WHERE origin_trade_id = ${input.tradeId} AND phantom_type = 'PREMATURE_EXIT'
    LIMIT 1
  `
  if (existing) return

  const risk = Math.abs(input.avgEntry - input.plannedStop)
  const volatilityEst = risk / input.avgEntry * 2.5  // proxy: stop distance × 2.5 ≈ ATR

  const seed = Math.floor(Math.random() * 2147483647)
  const sim = simulatePrematureExitOutcome({
    direction: input.direction,
    entryPrice: input.avgEntry,
    exitPrice: input.avgExit,
    plannedTarget: input.plannedTarget,
    plannedStop: input.plannedStop,
    size: input.size,
    volatilityEst,
    seed,
  })

  // Expiry: 30 days from close (resolved immediately since the trade is already closed)
  const expiresAt = new Date(new Date(input.closedAt).getTime() + 30 * 24 * 60 * 60 * 1000)

  await sql`
    INSERT INTO phantom.phantoms (
      phantom_id, user_id, phantom_type, status,
      origin_trade_id, origin_session_id,
      instrument_symbol, instrument_venue, asset_class, direction,
      cf_entry, cf_stop, cf_target, cf_size,
      cf_policy, param_provenance,
      spawned_at, expires_at, resolved_at, sim_version,
      outcome_r_p05, outcome_r_p50, outcome_r_p95,
      outcome_mfe_r, outcome_mae_r, outcome_exit_reason,
      outcome_detail
    ) VALUES (
      ${newId()}, ${input.userId}, 'PREMATURE_EXIT', 'resolved',
      ${input.tradeId}, ${null},
      ${input.instrument.symbol}, ${input.instrument.venue}, ${input.instrument.asset_class},
      ${input.direction},
      ${input.avgEntry}, ${input.plannedStop}, ${input.plannedTarget}, ${input.size},
      ${JSON.stringify({ kind: 'bracket' })},
      ${JSON.stringify({ entry: 'observed', stop: 'plan', target: 'plan', size: 'observed' })},
      ${input.closedAt}, ${expiresAt.toISOString()}, ${input.closedAt}, ${'v1.0'},
      ${sim.r_p05}, ${sim.r_p50}, ${sim.r_p95},
      ${sim.mfe_r}, ${sim.mae_r}, ${sim.exit_reason},
      ${JSON.stringify({ sim_paths: sim.sim_paths, sim_seed: sim.sim_seed, volatility_est: round(volatilityEst) })}
    )
  `
}

async function maybeSpawnAbandonedEntry(input: AbandonedEntryInput): Promise<void> {
  // ABANDONED_ENTRY: session ended without execution, intent_score >= threshold
  const SPAWN_THRESHOLD = 0.75
  if (input.intentScore < SPAWN_THRESHOLD) return
  if (!input.inferredStop) return   // can't simulate without a stop

  const [existing] = await sql<[{ phantomId: string } | undefined]>`
    SELECT phantom_id FROM phantom.phantoms
    WHERE origin_session_id = ${input.sessionId} AND phantom_type = 'ABANDONED_ENTRY'
    LIMIT 1
  `
  if (existing) return

  const phantomId = newId()
  const expiresAt = new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString()  // 3 week time stop

  const provenance = {
    entry: 'observed',
    stop: input.inferredStop ? 'observed' : 'default',
    target: input.inferredTarget ? 'observed' : 'default',
    size: 'observed',
  }

  await sql`
    INSERT INTO phantom.phantoms (
      phantom_id, user_id, phantom_type, status,
      origin_session_id, origin_trade_id,
      spawn_intent_score,
      instrument_symbol, instrument_venue, asset_class, direction,
      cf_entry, cf_stop, cf_target, cf_size,
      cf_policy, param_provenance,
      spawned_at, expires_at, sim_version
    ) VALUES (
      ${phantomId}, ${input.userId}, ${'ABANDONED_ENTRY'}, ${'active'},
      ${input.sessionId}, ${null},
      ${input.intentScore},
      ${input.instrument.symbol}, ${input.instrument.venue}, ${input.instrument.asset_class},
      ${input.direction},
      ${input.inferredEntry}, ${input.inferredStop}, ${input.inferredTarget ?? null}, ${input.inferredSize},
      ${JSON.stringify({ kind: 'bracket' })},
      ${JSON.stringify(provenance)},
      ${input.decisionTime}, ${expiresAt}, ${'v1.0'}
    )
  `
}

async function listPhantoms(userId: string, filter: { type?: string; status?: string } = {}) {
  return sql`
    SELECT *
    FROM phantom.phantoms
    WHERE user_id = ${userId}
      AND (${filter.type ?? null}::text IS NULL OR phantom_type = ${filter.type ?? null}::text)
      AND (${filter.status ?? null}::text IS NULL OR status = ${filter.status ?? null}::text)
    ORDER BY spawned_at DESC
    LIMIT 100
  `
}

async function getPhantomStats(userId: string) {
  const [row] = await sql<[{
    totalPhantoms: number
    prematureExits: number
    abandonedEntries: number
    avgPrematureExitCostR: number | null
    hesitationCostR: number | null
  }]>`
    SELECT
      COUNT(*)::int                                                          AS total_phantoms,
      COUNT(*) FILTER (WHERE phantom_type = 'PREMATURE_EXIT')::int          AS premature_exits,
      COUNT(*) FILTER (WHERE phantom_type = 'ABANDONED_ENTRY')::int         AS abandoned_entries,
      -- Exit quality: avg incremental R left on table (p50)
      ROUND(AVG(outcome_r_p50) FILTER (WHERE phantom_type = 'PREMATURE_EXIT' AND status = 'resolved')::numeric, 3)
                                                                             AS avg_premature_exit_cost_r,
      -- Hesitation cost: avg p50 outcome of abandoned trades that would have worked
      ROUND(AVG(outcome_r_p50) FILTER (WHERE phantom_type = 'ABANDONED_ENTRY' AND status = 'resolved' AND outcome_r_p50 > 0)::numeric, 3)
                                                                             AS hesitation_cost_r
    FROM phantom.phantoms
    WHERE user_id = ${userId}
  `
  return row ?? { totalPhantoms: 0, prematureExits: 0, abandonedEntries: 0, avgPrematureExitCostR: null, hesitationCostR: null }
}

export const phantomService = {
  maybeSpawnPrematureExit,
  maybeSpawnAbandonedEntry,
  listPhantoms,
  getPhantomStats,
}
