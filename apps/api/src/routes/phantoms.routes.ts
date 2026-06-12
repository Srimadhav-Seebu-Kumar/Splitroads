import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { ok } from '../lib/errors'
import { validateBody } from '../lib/validate'
import { phantomService } from '../services/phantom.service'
import { sql } from '../lib/db'

export async function phantomRoutes(app: FastifyInstance) {
  // ─── List phantoms ────────────────────────────────────────────────────────
  app.get('/phantoms', async (req, reply) => {
    await req.authenticate()
    const q = req.query as { type?: string; status?: string }
    const rows = await phantomService.listPhantoms(req.userId, q)
    return reply.send(ok(rows))
  })

  // ─── Phantom stats (headline metrics) ─────────────────────────────────────
  app.get('/phantoms/stats', async (req, reply) => {
    await req.authenticate()
    const stats = await phantomService.getPhantomStats(req.userId)
    return reply.send(ok(stats))
  })

  // ─── Single phantom ────────────────────────────────────────────────────────
  app.get('/phantoms/:id', async (req, reply) => {
    await req.authenticate()
    const { id } = req.params as { id: string }
    const [row] = await sql`
      SELECT * FROM phantom.phantoms
      WHERE phantom_id = ${id} AND user_id = ${req.userId} LIMIT 1
    `
    if (!row) throw (await import('../lib/errors')).Errors.NOT_FOUND('Phantom')
    return reply.send(ok(row))
  })

  // ─── Correction loop (BX-013) — label generation + trust ─────────────────
  app.post('/phantoms/:id/correction', async (req, reply) => {
    await req.authenticate()
    const { id } = req.params as { id: string }
    const { verdict, note } = validateBody(
      z.object({
        verdict: z.enum(['confirmed_intent', 'denied_intent']),
        note: z.string().max(300).optional(),
      }),
      req.body
    )

    // Update the associated intent score (training label)
    await sql`
      UPDATE intent.scores SET user_correction = ${verdict}
      WHERE session_id = (
        SELECT origin_session_id FROM phantom.phantoms
        WHERE phantom_id = ${id} AND user_id = ${req.userId}
      )
      AND score_id = (
        SELECT score_id FROM intent.scores
        WHERE session_id = (
          SELECT origin_session_id FROM phantom.phantoms WHERE phantom_id = ${id}
        )
        ORDER BY scored_at DESC LIMIT 1
      )
    `

    // Invalidate phantom if intent was denied
    if (verdict === 'denied_intent') {
      await sql`
        UPDATE phantom.phantoms SET status = 'invalidated'
        WHERE phantom_id = ${id} AND user_id = ${req.userId}
      `
    }

    return reply.send(ok({ phantom_id: id, verdict, note: note ?? null }))
  })
}
