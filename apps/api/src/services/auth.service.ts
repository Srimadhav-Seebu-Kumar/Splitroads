/**
 * AuthService — registration, login, token issuance.
 * Single place for all auth logic. Routes are thin wrappers over this.
 */
import argon2 from 'argon2'
import type { FastifyInstance } from 'fastify'
import { sql } from '../lib/db'
import { Errors } from '../lib/errors'
import { newId } from '../lib/id'

export type AuthUser = {
  userId: string
  email: string
  displayName: string | null
  tier: string
  mfaEnabled: boolean
}

const ARGON2_OPTIONS: argon2.Options = {
  type: argon2.argon2id,
  memoryCost: 65536,   // 64 MiB
  timeCost: 3,
  parallelism: 4,
}

export async function register(email: string, password: string, displayName?: string): Promise<AuthUser> {
  const [existing] = await sql<[{ userId: string } | undefined]>`
    SELECT user_id FROM core.users WHERE email = ${email} AND deleted_at IS NULL LIMIT 1
  `
  if (existing) throw Errors.CONFLICT('Email already in use')

  const hash = await argon2.hash(password, ARGON2_OPTIONS)
  const userId = newId()

  await sql`
    INSERT INTO core.users (user_id, email, password_hash, display_name)
    VALUES (${userId}, ${email}, ${hash}, ${displayName ?? null})
  `

  // Default consents (capture enabled for own-use; cross-user benchmarks opt-in)
  await sql`
    INSERT INTO core.consents (user_id, scope, granted) VALUES
      (${userId}, 'capture.ticket',   true),
      (${userId}, 'capture.drawings', true),
      (${userId}, 'capture.hover',    true),
      (${userId}, 'capture.alerts',   true),
      (${userId}, 'benchmark.crossuser', false)
  `

  return { userId, email, displayName: displayName ?? null, tier: 'free', mfaEnabled: false }
}

export async function login(email: string, password: string): Promise<AuthUser> {
  const [user] = await sql<[{ userId: string; email: string; passwordHash: string | null; displayName: string | null; tier: string; mfaEnabled: boolean } | undefined]>`
    SELECT user_id, email, password_hash, display_name, tier, mfa_enabled
    FROM core.users
    WHERE email = ${email} AND deleted_at IS NULL
    LIMIT 1
  `
  if (!user || !user.passwordHash) throw Errors.INVALID_CREDENTIALS()

  const valid = await argon2.verify(user.passwordHash, password)
  if (!valid) throw Errors.INVALID_CREDENTIALS()

  if (user.mfaEnabled) throw Errors.MFA_REQUIRED()

  return {
    userId: user.userId,
    email: user.email,
    displayName: user.displayName,
    tier: user.tier,
    mfaEnabled: user.mfaEnabled,
  }
}

export async function getUser(userId: string): Promise<AuthUser | null> {
  const [user] = await sql<[{ userId: string; email: string; displayName: string | null; tier: string; mfaEnabled: boolean } | undefined]>`
    SELECT user_id, email, display_name, tier, mfa_enabled
    FROM core.users WHERE user_id = ${userId} AND deleted_at IS NULL LIMIT 1
  `
  return user
    ? { userId: user.userId, email: user.email, displayName: user.displayName, tier: user.tier, mfaEnabled: user.mfaEnabled }
    : null
}

/** Issue a short-lived JWT. fastify is passed in to call app.jwt.sign. */
export function issueToken(app: FastifyInstance, user: AuthUser): string {
  return app.jwt.sign({ sub: user.userId, email: user.email, tier: user.tier })
}
