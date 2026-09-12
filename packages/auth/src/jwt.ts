import { createHmac } from 'node:crypto'
import type { Role } from '@repo/validation/enums'

/**
 * LOCKED FILE — Team 03 (Auth & Identity) + a maintainer review.
 *
 * Supabase Auth issues JWTs. This module verifies them using the project's
 * JWT secret. We decode manually rather than importing `jsonwebtoken` to keep
 * the dependency footprint small — Supabase JWTs are standard HS256 tokens.
 */

export interface AccessTokenPayload {
  sub: string
  role: Role
  batchId: string | null
  email?: string
}

function requireSecret(): string {
  const value = process.env.SUPABASE_JWT_SECRET
  if (!value)
    throw new Error('SUPABASE_JWT_SECRET is not set. Copy .env.example to .env and fill it in.')
  return value
}

function base64UrlDecode(str: string): string {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/')
  return Buffer.from(padded, 'base64').toString('utf-8')
}

function base64UrlEncode(data: Buffer): string {
  return data.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/**
 * Verifies a Supabase-issued JWT and returns the payload.
 * Throws if the token is expired, tampered with, or signed by another key.
 */
export function verifySupabaseToken(token: string): Record<string, unknown> {
  const parts = token.split('.')
  if (parts.length !== 3) throw new Error('Malformed JWT')

  const [header, payload, signature] = parts as [string, string, string]

  // Verify signature (HS256)
  const secret = requireSecret()
  const expectedSig = base64UrlEncode(
    createHmac('sha256', secret).update(`${header}.${payload}`).digest(),
  )

  if (expectedSig !== signature) {
    throw new Error('Invalid JWT signature')
  }

  const decoded = JSON.parse(base64UrlDecode(payload)) as Record<string, unknown>

  // Check expiration
  if (typeof decoded.exp === 'number' && decoded.exp * 1000 < Date.now()) {
    throw new Error('JWT expired')
  }

  return decoded
}

/**
 * Extracts our app-specific payload from a Supabase JWT.
 * The `role` and `batchId` come from `app_metadata` which we set when
 * creating users via the admin API.
 */
export function parseAccessToken(token: string): AccessTokenPayload {
  const decoded = verifySupabaseToken(token)

  const appMeta = (decoded.app_metadata ?? {}) as Record<string, unknown>

  return {
    sub: decoded.sub as string,
    role: (appMeta.role as Role) ?? 'STUDENT',
    batchId: (appMeta.batch_id as string) ?? null,
    email: decoded.email as string | undefined,
  }
}
