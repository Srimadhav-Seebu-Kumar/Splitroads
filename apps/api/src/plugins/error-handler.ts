import type { FastifyInstance } from 'fastify'
import fp from 'fastify-plugin'
import { AppError, sendError, type ApiResponse } from '../lib/errors'

export default fp(async (app: FastifyInstance) => {
  app.setErrorHandler((err: unknown, _req, reply) => {
    if (err instanceof AppError) {
      return sendError(reply, err)
    }

    const fastifyErr = err as { validation?: unknown; message?: string }

    // Fastify validation errors
    if (fastifyErr.validation) {
      return reply.status(400).send({
        ok: false,
        error: { code: 'VALIDATION_ERROR', message: 'Request validation failed', details: fastifyErr.validation },
      } satisfies ApiResponse<never>)
    }

    // Log unexpected errors server-side (never expose stack to client)
    app.log.error({ err }, 'Unhandled error')
    return reply.status(500).send({
      ok: false,
      error: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
    } satisfies ApiResponse<never>)
  })
})
