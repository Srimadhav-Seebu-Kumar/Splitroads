/**
 * Reusable Zod validation wrapper for Fastify handlers.
 * Throws typed AppError(VALIDATION) so the error handler renders it cleanly.
 */
import { z } from 'zod'
import { Errors } from './errors'

export function validate<T>(schema: z.ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data)
  if (!result.success) {
    throw Errors.VALIDATION(result.error.flatten())
  }
  return result.data
}

/** Validate and strip unknown keys from request body */
export function validateBody<T>(schema: z.ZodType<T>, body: unknown): T {
  return validate(schema, body)
}
