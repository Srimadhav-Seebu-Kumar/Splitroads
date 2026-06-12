/**
 * Register all plugins in correct order.
 * Import this once from server.ts.
 */
import type { FastifyInstance } from 'fastify'
import errorHandler from './error-handler'
import auth from './auth'

export async function registerPlugins(app: FastifyInstance) {
  // Security headers
  await app.register(import('@fastify/helmet'), { global: true })

  // CORS
  await app.register(import('@fastify/cors'), {
    origin: (process.env['CORS_ORIGINS'] ?? 'http://localhost:3000').split(','),
    credentials: true,
  })

  // Rate limiting — tighter on auth routes, looser elsewhere
  await app.register(import('@fastify/rate-limit'), {
    max: 300,
    timeWindow: '1 minute',
    errorResponseBuilder: () => ({
      ok: false,
      error: { code: 'RATE_LIMITED', message: 'Too many requests' },
    }),
  })

  await app.register(errorHandler)
  await app.register(auth)
}
