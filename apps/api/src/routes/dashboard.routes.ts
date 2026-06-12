/**
 * Dashboard routes — pre-composed data for the Today + weekly surfaces.
 * Reads from pre-computed projections; never computes stats at request time from raw events.
 */
import type { FastifyInstance } from 'fastify'
import { ok } from '../lib/errors'
import { sql } from '../lib/db'
import { getRAnalytics } from '../services/trade.service'
import { phantomService } from '../services/phantom.service'

export async function dashboardRoutes(app: FastifyInstance) {
  // ─── Today view ─────────────────────────────────────────────────────────
  app.get('/dashboard/today', async (req, reply) => {
    await req.authenticate()
    const userId = req.userId

    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)

    const [todayTrades, phantomStats, latestInsight, intentSessions, openTrades] = await Promise.all([
      // Trades today
      sql<Array<{ tradeId: string; instrumentSymbol: string; direction: string; realizedPnl: string | null; rMultiple: string | null; openedAt: Date; closedAt: Date | null }>>`
        SELECT trade_id, instrument_symbol, direction, realized_pnl, r_multiple, opened_at, closed_at
        FROM trading.trades
        WHERE user_id = ${userId} AND opened_at >= ${today.toISOString()}
        ORDER BY opened_at DESC LIMIT 20
      `,
      // Phantom stats
      phantomService.getPhantomStats(userId),
      // Top published insight
      sql<Array<{ insightId: string; kind: string; claim: unknown; severity: string; action: unknown }>>`
        SELECT insight_id, kind, claim, severity, action
        FROM profile.insights
        WHERE user_id = ${userId} AND status = 'published'
        ORDER BY published_at DESC LIMIT 1
      `,
      // Intent sessions today (capture health)
      sql<[{ count: number }]>`
        SELECT COUNT(*)::int AS count FROM intent.sessions
        WHERE user_id = ${userId} AND started_at >= ${today.toISOString()}
      `,
      // Open trades (currently in market)
      sql<[{ count: number }]>`
        SELECT COUNT(*)::int AS count FROM trading.trades
        WHERE user_id = ${userId} AND closed_at IS NULL
      `,
    ])

    // Pending corrections (review-band phantoms)
    const [pendingCorrections] = await sql<[{ count: number }]>`
      SELECT COUNT(*)::int AS count FROM phantom.phantoms
      WHERE user_id = ${userId}
        AND status = 'active'
        AND spawn_intent_score BETWEEN 0.5 AND 0.749
    `

    return reply.send(ok({
      today_trades: todayTrades,
      phantom_stats: phantomStats,
      top_insight: latestInsight[0] ?? null,
      intent_sessions_today: intentSessions[0]?.count ?? 0,
      open_trades: openTrades[0]?.count ?? 0,
      pending_corrections: pendingCorrections?.count ?? 0,
    }))
  })

  // ─── Weekly report data ───────────────────────────────────────────────────
  app.get('/dashboard/weekly', async (req, reply) => {
    await req.authenticate()
    const userId = req.userId

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

    const [analytics, phantomStats, insights, behavioralMetrics] = await Promise.all([
      getRAnalytics(userId, 7),
      phantomService.getPhantomStats(userId),
      sql`
        SELECT * FROM profile.insights
        WHERE user_id = ${userId} AND status = 'published'
          AND (published_at >= ${sevenDaysAgo} OR published_at IS NULL)
        ORDER BY published_at DESC LIMIT 5
      `,
      sql`
        SELECT * FROM profile.behavioral_metrics
        WHERE user_id = ${userId}
        ORDER BY computed_at DESC LIMIT 1
      `,
    ])

    return reply.send(ok({
      period: { from: sevenDaysAgo, to: new Date().toISOString() },
      analytics,
      phantom_stats: phantomStats,
      insights,
      behavioral_metrics: behavioralMetrics[0] ?? null,
    }))
  })
}
