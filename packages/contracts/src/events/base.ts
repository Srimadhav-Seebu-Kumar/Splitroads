/**
 * Base event envelope — every IntentEvent and TradeEvent shares this shape.
 * SCHEMA RULES (from CLAUDE.md §3.5):
 *   - additive-only evolution; breaking change = new schema_version, never mutation
 *   - the event log is forever; treat schemas like a public API
 *   - PII-bearing fields are tagged so the logging layer can scrub by tag
 */
import { z } from 'zod'

// ─── Instrument ──────────────────────────────────────────────────────────────

export const AssetClassSchema = z.enum([
  'equity',
  'futures',
  'fx',
  'crypto',
  'option',
])
export type AssetClass = z.infer<typeof AssetClassSchema>

export const InstrumentSchema = z.object({
  symbol: z.string().min(1).max(20),
  venue: z.string().min(1).max(30),
  asset_class: AssetClassSchema,
})
export type Instrument = z.infer<typeof InstrumentSchema>

// ─── Source ───────────────────────────────────────────────────────────────────

export const EventSourceSchema = z.enum([
  'ext.tradingview',
  'broker.ibkr',
  'broker.alpaca',
  'broker.binance',
  'broker.bybit',
  'broker.tradier',
  'broker.csv_import',
  'api.manual',
  'api.webhook',
])
export type EventSource = z.infer<typeof EventSourceSchema>

// ─── Base envelope ────────────────────────────────────────────────────────────

export const EventEnvelopeSchema = z.object({
  event_id: z.string().uuid(),
  idempotency_key: z.string().min(1).max(128),
  schema: z.string().min(1),
  schema_version: z.number().int().positive(),
  user_id: z.string().uuid(),
  source: z.string(),
  occurred_at: z.string().datetime({ offset: false }),
  received_at: z.string().datetime({ offset: false }).optional(),
  instrument: InstrumentSchema.optional(),
  context: z
    .object({
      session_hint: z.string().uuid().nullable().optional(),
      market_snapshot_ref: z.string().nullable().optional(),
      capture_scopes: z.array(z.string()).optional(),
    })
    .optional(),
})
export type EventEnvelope = z.infer<typeof EventEnvelopeSchema>
