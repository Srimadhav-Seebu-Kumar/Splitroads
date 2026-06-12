/**
 * Route registry — one place, all routes.
 * Each route module is thin; service layer holds logic.
 */
import type { FastifyInstance } from 'fastify'
import { authRoutes } from './auth.routes'
import { tradeRoutes } from './trades.routes'
import { phantomRoutes } from './phantoms.routes'
import { dashboardRoutes } from './dashboard.routes'

export async function registerRoutes(app: FastifyInstance) {
  const API = '/api/v1'

  await app.register(async (v1) => {
    await authRoutes(v1)
    await tradeRoutes(v1)
    await phantomRoutes(v1)
    await dashboardRoutes(v1)

    // Health check
    v1.get('/health', async () => ({ ok: true, ts: new Date().toISOString() }))
  }, { prefix: API })
}
