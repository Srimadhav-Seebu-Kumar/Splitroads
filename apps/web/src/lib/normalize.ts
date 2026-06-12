/**
 * Row normalizers: one place that absorbs the API's column naming
 * (postgres.js camel transform, e.g. outcome_r_p05 -> outcomeRP05)
 * so every surface consumes the same typed shapes.
 */

export type Trade = {
  tradeId: string
  instrumentSymbol: string
  direction: 'long' | 'short'
  rMultiple: number | null
  realizedPnl: number | null
  openedAt: string
  closedAt: string | null
}

export type Phantom = {
  phantomId: string
  phantomType: string
  status: string
  instrumentSymbol: string
  direction: 'long' | 'short'
  p05: number | null
  p50: number | null
  p95: number | null
  spawnIntentScore: number | null
  spawnedAt: string
  cfEntry: number | null
  cfStop: number | null
  cfTarget: number | null
  paramProvenance: Record<string, string>
}

function num(v: unknown): number | null {
  if (v === null || v === undefined) return null
  const n = typeof v === 'string' ? parseFloat(v) : (v as number)
  return Number.isFinite(n) ? n : null
}

function pick(row: Record<string, unknown>, ...keys: string[]): unknown {
  for (const k of keys) if (row[k] !== undefined) return row[k]
  return undefined
}

export function normalizeTrade(raw: unknown): Trade {
  const r = raw as Record<string, unknown>
  return {
    tradeId: String(pick(r, 'tradeId', 'trade_id')),
    instrumentSymbol: String(pick(r, 'instrumentSymbol', 'instrument_symbol') ?? ''),
    direction: (pick(r, 'direction') as 'long' | 'short') ?? 'long',
    rMultiple: num(pick(r, 'rMultiple', 'r_multiple')),
    realizedPnl: num(pick(r, 'realizedPnl', 'realized_pnl')),
    openedAt: String(pick(r, 'openedAt', 'opened_at')),
    closedAt: (pick(r, 'closedAt', 'closed_at') as string | null) ?? null,
  }
}

export function normalizePhantom(raw: unknown): Phantom {
  const r = raw as Record<string, unknown>
  return {
    phantomId: String(pick(r, 'phantomId', 'phantom_id')),
    phantomType: String(pick(r, 'phantomType', 'phantom_type') ?? ''),
    status: String(pick(r, 'status') ?? 'active'),
    instrumentSymbol: String(pick(r, 'instrumentSymbol', 'instrument_symbol') ?? ''),
    direction: (pick(r, 'direction') as 'long' | 'short') ?? 'long',
    p05: num(pick(r, 'outcomeRP05', 'outcomeRp05', 'outcome_r_p05')),
    p50: num(pick(r, 'outcomeRP50', 'outcomeRp50', 'outcome_r_p50')),
    p95: num(pick(r, 'outcomeRP95', 'outcomeRp95', 'outcome_r_p95')),
    spawnIntentScore: num(pick(r, 'spawnIntentScore', 'spawn_intent_score')),
    spawnedAt: String(pick(r, 'spawnedAt', 'spawned_at')),
    cfEntry: num(pick(r, 'cfEntry', 'cf_entry')),
    cfStop: num(pick(r, 'cfStop', 'cf_stop')),
    cfTarget: num(pick(r, 'cfTarget', 'cf_target')),
    paramProvenance: (pick(r, 'paramProvenance', 'param_provenance') as Record<string, string>) ?? {},
  }
}

export const PHANTOM_TYPE_LABELS: Record<string, string> = {
  ABANDONED_ENTRY: 'Abandoned entry',
  PREMATURE_EXIT: 'Early exit',
  DELAYED_ENTRY: 'Delayed entry',
  DELAYED_EXIT: 'Delayed exit',
  CONVICTION: 'Conviction gap',
  POSITION_SIZE: 'Size phantom',
  STOP_PLACEMENT: 'Stop phantom',
  OPPOSITE_PERSONALITY: 'Opposite personality',
}
