import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { validateBody } from '../lib/validate'
import { ok, Errors } from '../lib/errors'
import { PaginationSchema } from '../lib/pagination'
import * as tradeService from '../services/trade.service'
import { parseCSV } from '../services/connectors/csv.connector'

const TradeFilterSchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  symbol: z.string().optional(),
  direction: z.enum(['long', 'short']).optional(),
  setup_tag: z.string().optional(),
  open_only: z.coerce.boolean().optional(),
})

export async function tradeRoutes(app: FastifyInstance) {
  // ─── List trades ──────────────────────────────────────────────────────────
  app.get('/trades', async (req, reply) => {
    await req.authenticate()
    const q = req.query as Record<string, string>
    const { page, per_page } = PaginationSchema.parse(q)
    const filter = TradeFilterSchema.parse(q)
    const result = await tradeService.listTrades(req.userId, filter, page, per_page)
    return reply.send(ok(result))
  })

  // ─── Single trade ─────────────────────────────────────────────────────────
  app.get('/trades/:id', async (req, reply) => {
    await req.authenticate()
    const { id } = req.params as { id: string }
    const trade = await tradeService.getTrade(req.userId, id)
    return reply.send(ok(trade))
  })

  // ─── R-analytics ──────────────────────────────────────────────────────────
  app.get('/trades/analytics', async (req, reply) => {
    await req.authenticate()
    const q = req.query as { days?: string }
    const analytics = await tradeService.getRAnalytics(req.userId, parseInt(q.days ?? '90'))
    return reply.send(ok(analytics))
  })

  // ─── CSV import ───────────────────────────────────────────────────────────
  app.post('/trades/import/csv', async (req, reply) => {
    await req.authenticate()
    const body = validateBody(
      z.object({ account_id: z.string().uuid(), csv: z.string().min(10) }),
      req.body
    )
    const trades = parseCSV(body.csv, req.userId, body.account_id)
    if (trades.length === 0) {
      throw Errors.SCHEMA_ERROR('No valid trades found in CSV. Check column headers.')
    }
    const result = await tradeService.importTrades(req.userId, body.account_id, trades)
    return reply.status(201).send(ok({ ...result, total_parsed: trades.length }))
  })

  // ─── Trade plan ───────────────────────────────────────────────────────────
  app.post('/trades/plans', async (req, reply) => {
    await req.authenticate()
    const PlanSchema = z.object({
      instrument_symbol: z.string().min(1).max(20),
      instrument_venue: z.string().min(1).max(30),
      direction: z.enum(['long', 'short']),
      planned_entry: z.number().positive().optional(),
      planned_stop: z.number().positive().optional(),
      planned_target: z.number().positive().optional(),
      planned_size: z.number().positive().optional(),
      planned_size_type: z.enum(['units', 'dollars', 'percent']).optional(),
      thesis: z.string().max(1000).optional(),
      expires_at: z.string().datetime().optional(),
    })
    const body = validateBody(PlanSchema, req.body)
    const { sql } = await import('../lib/db')
    const { newId } = await import('../lib/id')
    const planId = newId()
    await sql`
      INSERT INTO trading.trade_plans (
        plan_id, user_id, instrument_symbol, instrument_venue, direction,
        planned_entry, planned_stop, planned_target, planned_size, planned_size_type,
        thesis, expires_at
      ) VALUES (
        ${planId}, ${req.userId}, ${body.instrument_symbol}, ${body.instrument_venue},
        ${body.direction}, ${body.planned_entry ?? null}, ${body.planned_stop ?? null},
        ${body.planned_target ?? null}, ${body.planned_size ?? null},
        ${body.planned_size_type ?? null}, ${body.thesis ?? null}, ${body.expires_at ?? null}
      )
    `
    return reply.status(201).send(ok({ plan_id: planId }))
  })

  // ─── Setup tags ───────────────────────────────────────────────────────────
  app.patch('/trades/:id/tags', async (req, reply) => {
    await req.authenticate()
    const { id } = req.params as { id: string }
    const { tags } = validateBody(z.object({ tags: z.array(z.string().max(40)).max(10) }), req.body)
    const { sql } = await import('../lib/db')
    await sql`
      UPDATE trading.trades SET setup_tags = ${tags}, updated_at = now()
      WHERE trade_id = ${id} AND user_id = ${req.userId}
    `
    return reply.send(ok({ trade_id: id, tags }))
  })
}
