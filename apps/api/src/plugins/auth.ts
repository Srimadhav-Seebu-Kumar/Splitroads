/**
 * JWT auth plugin.
 * Decorates request with `request.userId` (string).
 * All protected routes call `await request.authenticate()`.
 */
import type { FastifyInstance, FastifyRequest } from 'fastify'
import fp from 'fastify-plugin'
import { Errors } from '../lib/errors'

declare module 'fastify' {
  interface FastifyRequest {
    userId: string
    authenticate: () => Promise<void>
  }
}

export default fp(async (app: FastifyInstance) => {
  await app.register(import('@fastify/jwt'), {
    secret: process.env['JWT_SECRET'] ?? '',
    sign: { expiresIn: process.env['JWT_EXPIRES_IN'] ?? '7d' },
  })

  app.decorateRequest('userId', '')

  app.decorateRequest('authenticate', async function (this: FastifyRequest) {
    try {
      const payload = await this.jwtVerify<{ sub: string }>()
      this.userId = payload.sub
    } catch {
      throw Errors.UNAUTHENTICATED()
    }
  })
})
