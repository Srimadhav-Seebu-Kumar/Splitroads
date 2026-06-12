/**
 * Trade schemas — executions and order lifecycle from brokers.
 * These are the raw materials of the journal, R-analytics, and trade-origin phantoms.
 */
import { z } from 'zod'
import { InstrumentSchema } from '../events/base'

export const TradeDirectionSchema = z.enum(['long', 'short'])
export type TradeDirection = z.infer<typeof TradeDirectionSchema>

// ─── Broker-normalised trade ──────────────────────────────────────────────────
// Every connector maps its native format to this. Money is NUMERIC-safe strings here;
// stored as NUMERIC in Postgres (never float).

export const NormalisedTradeSchema = z.object({
  external_id: z.string(),           // broker's native order/trade id
  user_id: z.string().uuid(),
  account_id: z.string().uuid(),
  instrument: InstrumentSchema,
  direction: TradeDirectionSchema,
  opened_at: z.string().datetime({ offset: false }),
  closed_at: z.string().datetime({ offset: false }).nullable(),
  avg_entry: z.string().regex(/^\d+(\.\d+)?$/),   // decimal string, stored as NUMERIC
  avg_exit: z.string().regex(/^\d+(\.\d+)?$/).nullable(),
  quantity: z.string().regex(/^\d+(\.\d+)?$/),
  fees: z.string().regex(/^\d+(\.\d+)?$/).default('0'),
  currency: z.string().length(3),
  source: z.enum([
    'broker.ibkr',
    'broker.alpaca',
    'broker.binance',
    'broker.bybit',
    'broker.tradier',
    'broker.csv_import',
  ]),
  raw_payload: z.record(z.unknown()).optional(),   // original broker data for audit
})
export type NormalisedTrade = z.infer<typeof NormalisedTradeSchema>

// ─── Trade plan ───────────────────────────────────────────────────────────────
// Explicit pre-trade intent. Ground truth for plan-vs-execution deviation.

export const TradePlanSchema = z.object({
  user_id: z.string().uuid(),
  instrument: InstrumentSchema,
  direction: TradeDirectionSchema,
  planned_entry: z.number().positive().optional(),
  planned_stop: z.number().positive().optional(),
  planned_target: z.number().positive().optional(),
  planned_size: z.number().positive().optional(),
  planned_size_type: z.enum(['units', 'dollars', 'percent']).optional(),
  thesis: z.string().max(1000).optional(),
  expires_at: z.string().datetime({ offset: false }).optional(),
})
export type TradePlan = z.infer<typeof TradePlanSchema>

// ─── R-multiple computation input ────────────────────────────────────────────

export const RMultipleInputSchema = z.object({
  avg_entry: z.number(),
  avg_exit: z.number(),
  planned_stop: z.number(),
  direction: TradeDirectionSchema,
})
export type RMultipleInput = z.infer<typeof RMultipleInputSchema>

export function computeRMultiple(input: RMultipleInput): number {
  const { avg_entry, avg_exit, planned_stop, direction } = input
  const risk = direction === 'long' ? avg_entry - planned_stop : planned_stop - avg_entry
  if (risk <= 0) return 0
  const outcome = direction === 'long' ? avg_exit - avg_entry : avg_entry - avg_exit
  return outcome / risk
}
