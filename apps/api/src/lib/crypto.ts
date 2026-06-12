/**
 * Encryption helpers for broker credentials and sensitive values.
 * AES-256-GCM — security baseline from CLAUDE.md §3.3
 */
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const KEY_HEX = process.env['CREDENTIAL_ENCRYPTION_KEY'] ?? ''
if (!KEY_HEX && process.env['NODE_ENV'] !== 'test') {
  throw new Error('CREDENTIAL_ENCRYPTION_KEY is required')
}

const KEY = Buffer.from(KEY_HEX, 'hex')
const ALGO = 'aes-256-gcm' as const
const IV_LEN = 12
const TAG_LEN = 16

/** Encrypt plaintext → base64 ciphertext (iv:tag:ciphertext) */
export function encrypt(plaintext: string): string {
  const iv = randomBytes(IV_LEN)
  const cipher = createCipheriv(ALGO, KEY, iv)
  const ct = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return [iv, tag, ct].map(b => b.toString('base64')).join(':')
}

/** Decrypt base64 ciphertext → plaintext */
export function decrypt(ciphertext: string): string {
  const parts = ciphertext.split(':')
  if (parts.length !== 3) throw new Error('Invalid ciphertext format')
  const [ivB64, tagB64, ctB64] = parts as [string, string, string]
  const iv = Buffer.from(ivB64, 'base64')
  const tag = Buffer.from(tagB64, 'base64')
  const ct = Buffer.from(ctB64, 'base64')
  const decipher = createDecipheriv(ALGO, KEY, iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(ct), decipher.final()]).toString('utf8')
}
