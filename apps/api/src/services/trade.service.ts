/**
 * TradeService — the single source of truth for reading/writing trades.
 * Import management, R-multiple computation, deduplication — all here.
 * Routes are thin; this service is the logic.
 */
import { sql, withUserCtx } from '../lib/db'
import { Errors } from '../lib/errors'
import { newId } from '../lib/id'
import { toOffset, type PageResult, paginate } from '../lib/pagination'
import { computeRMultiple, type NormalisedTrade } from '@splitroads/contracts'
import { phantomService } from './phantom.service'

export type TradeRow = {
  tradeId: string
  userId: string
  accountId: string
  instrumentSymbol: string
  instrumentVenue: string
  assetClass: string
  direction: 'long' | 'short'
  openedAt: Date
  closedAt: Date | null
  avgEntry: string
  avgExit: string | null
  quantity: string
  fees: string
  currency: string
  realizedPnl: string | null
  rMultiple: string | null
  planId: string | null
  setupTags: string[]
  source: string
  externalId: string | null
  createdAt: Date
}

export type TradeFilter = {
  from?: string | undefined
  to?: string | undefined
  symbol?: string | undefined
  direction?: 'long' | 'short' | undefined
  setup_tag?: string | undefined
  open_only?: boolean | undefined
}

// ─── Queries ─────────────────────────────────────────────────────────────────

export async function listTrades(
  userId: string,
  filter: TradeFilter,
  page: number,
  perPage: number
): Promise<PageResult<TradeRow>> {
  const { limit, offset } = toOffset(page, perPage)

  return withUserCtx(userId, async (txSql) => {
    const fromVal = filter.from ?? null
    const toVal = filter.to ?? null
    const symbolVal = filter.symbol ?? null
    const dirVal = filter.direction ?? null

    const rows = await txSql<TradeRow[]>`
      SELECT *
      FROM trading.trades
      WHERE user_id = ${userId}
        AND (${fromVal}::timestamptz IS NULL OR opened_at >= ${fromVal}::timestamptz)
        AND (${toVal}::timestamptz IS NULL   OR opened_at <= ${toVal}::timestamptz)
        AND (${symbolVal}::text IS NULL      OR instrument_symbol = ${symbolVal}::text)
        AND (${dirVal}::text IS NULL         OR direction = ${dirVal}::text)
        AND (${filter.open_only ? sql`closed_at IS NULL` : sql`true`})
      ORDER BY opened_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `

    const [{ count }] = await txSql<[{ count: number }]>`
      SELECT COUNT(*)::int AS count FROM trading.trades
      WHERE user_id = ${userId}
        AND (${fromVal}::timestamptz IS NULL OR opened_at >= ${fromVal}::timestamptz)
        AND (${toVal}::timestamptz IS NULL   OR opened_at <= ${toVal}::timestamptz)
        AND (${symbolVal}::text IS NULL      OR instrument_symbol = ${symbolVal}::text)
        AND (${dirVal}::text IS NULL         OR direction = ${dirVal}::text)
    `

    return paginate(rows, count ?? 0, page, perPage)
  })
}

export async function getTrade(userId: string, tradeId: string): Promise<TradeRow> {
  const [row] = await withUserCtx(userId, (txSql) => txSql<TradeRow[]>`
    SELECT * FROM trading.trades
    WHERE trade_id = ${tradeId} AND user_id = ${userId}
    LIMIT 1
  `)
  if (!row) throw Errors.NOT_FOUND('Trade')
  return row
}

// ─── Import ──────────────────────────────────────────────────────────────────

/**
 * Bulk-upsert normalised trades (from any broker connector).
 * Returns { inserted, skipped } counts.
 */
export async function importTrades(
  userId: string,
  accountId: string,
  trades: NormalisedTrade[]
): Promise<{ inserted: number; skipped: number }> {
  let inserted = 0
  let skipped = 0

  const planLookup = await getPlanLookupMap(userId)

  for (const t of trades) {
    // Look up instrument_id (insert if unknown)
    const instrId = await upsertInstrument(t.instrument)

    // Dedup: same user + source + external_id
    const [existing] = await sql<[{ tradeId: string } | undefined]>`
      SELECT trade_id FROM trading.trades
      WHERE user_id = ${userId} AND source = ${t.source} AND external_id = ${t.external_id}
      LIMIT 1
    `
    if (existing) { skipped++; continue }

    const entry = parseFloat(t.avg_entry)
    const exit = t.avg_exit ? parseFloat(t.avg_exit) : null
    const qty = parseFloat(t.quantity)
    const fees = parseFloat(t.fees)

    // Find matching plan by instrument + direction + time proximity
    const planId = findMatchingPlan(planLookup, t)

    // Compute planned stop from plan if available
    let rMultiple: number | null = null
    if (exit !== null && planId) {
      const plan = planLookup.get(planId)
      if (plan?.plannedStop) {
        rMultiple = computeRMultiple({
          avg_entry: entry,
          avg_exit: exit,
          planned_stop: plan.plannedStop,
          direction: t.direction,
        })
      }
    }

    const realizedPnl = exit !== null
      ? (t.direction === 'long' ? (exit - entry) * qty : (entry - exit) * qty) - fees
      : null

    const tradeId = newId()
    await sql`
      INSERT INTO trading.trades (
        trade_id, user_id, account_id, instrument_id, instrument_symbol, instrument_venue,
        asset_class, direction, opened_at, closed_at, avg_entry, avg_exit, quantity, fees,
        currency, realized_pnl, r_multiple, plan_id, source, external_id
      ) VALUES (
        ${tradeId}, ${userId}, ${accountId}, ${instrId},
        ${t.instrument.symbol}, ${t.instrument.venue}, ${t.instrument.asset_class},
        ${t.direction}, ${t.opened_at}, ${t.closed_at},
        ${entry}, ${exit}, ${qty}, ${fees}, ${t.currency},
        ${realizedPnl}, ${rMultiple}, ${planId ?? null},
        ${t.source}, ${t.external_id}
      )
    `

    // Spawn PREMATURE_EXIT phantom if trade is closed and has a linked plan with target
    if (exit !== null && planId) {
      const plan = planLookup.get(planId)
      if (plan?.plannedTarget && plan.plannedStop) {
        await phantomService.maybeSpawnPrematureExit({
          userId,
          tradeId,
          instrument: t.instrument,
          direction: t.direction,
          avgEntry: entry,
          avgExit: exit,
          plannedTarget: plan.plannedTarget,
          plannedStop: plan.plannedStop,
          size: qty,
          closedAt: t.closed_at!,
        })
      }
    }

    inserted++
  }

  return { inserted, skipped }
}

// ─── R-analytics ─────────────────────────────────────────────────────────────

export type RAnalytics = {
  totalTrades: number
  winRate: number
  avgR: number
  expectancy: number
  totalRealizedPnl: number
  profitFactor: number
  avgWinR: number
  avgLossR: number
  largestWinR: number
  largestLossR: number
}

export async function getRAnalytics(userId: string, fromDays = 90): Promise<RAnalytics> {
  const [row] = await sql<[{
    totalTrades: number; wins: number; avgR: number; expectancy: number
    totalPnl: number; grossWin: number; grossLoss: number
    avgWinR: number; avgLossR: number; maxWinR: number; maxLossR: number
  }]>`
    SELECT
      COUNT(*)::int                                           AS total_trades,
      COUNT(*) FILTER (WHERE r_multiple > 0)::int            AS wins,
      ROUND(AVG(r_multiple)::numeric, 3)                     AS avg_r,
      ROUND(AVG(r_multiple)::numeric, 3)                     AS expectancy,
      ROUND(SUM(realized_pnl)::numeric, 2)                   AS total_pnl,
      ROUND(SUM(realized_pnl) FILTER (WHERE realized_pnl > 0)::numeric, 2) AS gross_win,
      ROUND(ABS(SUM(realized_pnl) FILTER (WHERE realized_pnl < 0))::numeric, 2) AS gross_loss,
      ROUND(AVG(r_multiple) FILTER (WHERE r_multiple > 0)::numeric, 3) AS avg_win_r,
      ROUND(AVG(r_multiple) FILTER (WHERE r_multiple < 0)::numeric, 3) AS avg_loss_r,
      ROUND(MAX(r_multiple)::numeric, 3)                     AS max_win_r,
      ROUND(MIN(r_multiple)::numeric, 3)                     AS max_loss_r
    FROM trading.trades
    WHERE user_id = ${userId}
      AND closed_at IS NOT NULL
      AND r_multiple IS NOT NULL
      AND opened_at >= now() - (${fromDays} || ' days')::interval
  `

  const total = row?.totalTrades ?? 0
  return {
    totalTrades: total,
    winRate: total > 0 ? (row?.wins ?? 0) / total : 0,
    avgR: row?.avgR ?? 0,
    expectancy: row?.expectancy ?? 0,
    totalRealizedPnl: row?.totalPnl ?? 0,
    profitFactor: (row?.grossLoss ?? 0) > 0 ? (row?.grossWin ?? 0) / (row?.grossLoss ?? 1) : 0,
    avgWinR: row?.avgWinR ?? 0,
    avgLossR: row?.avgLossR ?? 0,
    largestWinR: row?.maxWinR ?? 0,
    largestLossR: row?.maxLossR ?? 0,
  }
}

// ─── Private helpers ──────────────────────────────────────────────────────────

async function upsertInstrument(instrument: NormalisedTrade['instrument']): Promise<string> {
  const [row] = await sql<[{ instrumentId: string }]>`
    INSERT INTO trading.instruments (symbol, venue, asset_class)
    VALUES (${instrument.symbol}, ${instrument.venue}, ${instrument.asset_class})
    ON CONFLICT (symbol, venue) DO UPDATE SET asset_class = EXCLUDED.asset_class
    RETURNING instrument_id
  `
  return row!.instrumentId
}

type PlanLookup = { plannedStop: number | null; plannedTarget: number | null; direction: string; symbol: string; expiresAt: Date | null }
async function getPlanLookupMap(userId: string): Promise<Map<string, PlanLookup>> {
  const plans = await sql<Array<{ planId: string; plannedStop: number | null; plannedTarget: number | null; direction: string; instrumentSymbol: string; expiresAt: Date | null }>>`
    SELECT plan_id, planned_stop, planned_target, direction, instrument_symbol, expires_at
    FROM trading.trade_plans WHERE user_id = ${userId} AND linked_trade_id IS NULL
  `
  return new Map(plans.map(p => [p.planId, { plannedStop: p.plannedStop, plannedTarget: p.plannedTarget, direction: p.direction, symbol: p.instrumentSymbol, expiresAt: p.expiresAt }]))
}

function findMatchingPlan(map: Map<string, PlanLookup>, trade: NormalisedTrade): string | null {
  const openedAt = new Date(trade.opened_at)
  for (const [id, plan] of map) {
    if (plan.symbol !== trade.instrument.symbol) continue
    if (plan.direction !== trade.direction) continue
    if (plan.expiresAt && plan.expiresAt < openedAt) continue
    return id
  }
  return null
}
