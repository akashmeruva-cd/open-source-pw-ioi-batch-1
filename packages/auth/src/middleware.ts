import type { NextFunction, Request, Response } from 'express'
import type { Role } from '@repo/validation/enums'
import { parseAccessToken, type AccessTokenPayload } from './jwt'

/**
 * LOCKED FILE — Team 03 (Auth & Identity) + a maintainer review.
 *
 * `req.auth` is the ONLY trustworthy source of the caller's identity. Never read
 * a user id from the request body, a query param, or a header — including in the
 * AI assistant's tool handlers.
 *
 * Now verifies Supabase-issued JWTs instead of custom-signed ones. The interface
 * (`requireAuth`, `requireRole`, `currentUser`) is unchanged so every other
 * module keeps working without edits.
 */

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: AccessTokenPayload
    }
  }
}

export type { AccessTokenPayload } from './jwt'

export class AuthError extends Error {
  readonly status: number
  readonly code: string

  constructor(status: number, code: string, message: string) {
    super(message)
    this.name = 'AuthError'
    this.status = status
    this.code = code
  }
}

function readBearerToken(req: Request): string | null {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) return null
  return header.slice('Bearer '.length).trim() || null
}

/** Rejects the request unless it carries a valid, unexpired Supabase access token. */
export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const token = readBearerToken(req)
  if (!token) {
    return next(new AuthError(401, 'UNAUTHENTICATED', 'Missing bearer token'))
  }

  try {
    req.auth = parseAccessToken(token)
    return next()
  } catch {
    return next(new AuthError(401, 'INVALID_TOKEN', 'Token is invalid or expired'))
  }
}

/**
 * Rejects the request unless the caller holds one of `roles`. Always mount it
 * after `requireAuth`.
 */
export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.auth) {
      return next(new AuthError(401, 'UNAUTHENTICATED', 'Missing bearer token'))
    }
    if (!roles.includes(req.auth.role)) {
      return next(new AuthError(403, 'FORBIDDEN', 'You do not have access to this resource'))
    }
    return next()
  }
}

/** Convenience for handlers that have already passed `requireAuth`. */
export function currentUser(req: Request): AccessTokenPayload {
  if (!req.auth) throw new AuthError(401, 'UNAUTHENTICATED', 'Missing bearer token')
  return req.auth
}
