/**
 * Typed error hierarchy + shared response envelope.
 * One place for all error codes — every route uses these, nothing invents its own.
 */
import type { FastifyReply } from 'fastify'

export type ApiResponse<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string; details?: unknown } }

export function ok<T>(data: T): { ok: true; data: T } {
  return { ok: true, data }
}

export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number = 400,
    public readonly details?: unknown
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export const Errors = {
  // Auth
  UNAUTHENTICATED: () => new AppError('UNAUTHENTICATED', 'Authentication required', 401),
  INVALID_CREDENTIALS: () => new AppError('INVALID_CREDENTIALS', 'Invalid email or password', 401),
  MFA_REQUIRED: () => new AppError('MFA_REQUIRED', 'MFA verification required', 401),
  FORBIDDEN: (msg = 'Access denied') => new AppError('FORBIDDEN', msg, 403),

  // Validation
  VALIDATION: (details: unknown) => new AppError('VALIDATION_ERROR', 'Validation failed', 400, details),
  SCHEMA_ERROR: (msg: string) => new AppError('SCHEMA_ERROR', msg, 400),

  // Resources
  NOT_FOUND: (resource: string) => new AppError('NOT_FOUND', `${resource} not found`, 404),
  CONFLICT: (msg: string) => new AppError('CONFLICT', msg, 409),

  // Rate limiting / abuse
  RATE_LIMITED: () => new AppError('RATE_LIMITED', 'Too many requests', 429),

  // Server
  INTERNAL: (msg = 'Internal server error') => new AppError('INTERNAL_ERROR', msg, 500),
} as const

/** Send a typed AppError as an API response. Used in error handler plugin. */
export function sendError(reply: FastifyReply, err: AppError): void {
  reply.status(err.statusCode).send({
    ok: false,
    error: { code: err.code, message: err.message, details: err.details },
  })
}
