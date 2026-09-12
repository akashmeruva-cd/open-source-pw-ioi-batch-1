import type { CookieOptions, Request, Response } from 'express'
import { currentUser } from '@repo/auth/middleware'
import { HttpError } from '@repo/http/http-error'
import type { LoginInput, RegisterInput } from '@repo/validation/auth'
import { endSession, getUserById, loginUser, refreshSession, registerUser } from './auth.service'

/** Owner: Team 03 — Auth & Identity. */

export const REFRESH_COOKIE = 'refresh_token'

/** Refresh tokens last 7 days in Supabase by default. */
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000

function refreshCookieOptions(): CookieOptions {
  const isProd = process.env.NODE_ENV === 'production'
  return {
    httpOnly: true,
    secure: isProd,
    // The frontends are on a different Vercel domain to the APIs, so the cookie
    // has to be cross-site — which browsers only allow with SameSite=None+Secure.
    sameSite: isProd ? 'none' : 'lax',
    path: '/api/auth',
    maxAge: REFRESH_TOKEN_TTL_MS,
  }
}

export async function register(req: Request, res: Response) {
  const { user, accessToken, refreshToken } = await registerUser(req.body as RegisterInput)
  res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions())
  res.status(201).json({ user, accessToken })
}

export async function login(req: Request, res: Response) {
  const { user, accessToken, refreshToken } = await loginUser(req.body as LoginInput)
  res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions())
  res.json({ user, accessToken })
}

export async function refresh(req: Request, res: Response) {
  const token = req.cookies?.[REFRESH_COOKIE] as string | undefined
  if (!token) throw HttpError.unauthorized('No refresh token')

  const { user, accessToken, refreshToken } = await refreshSession(token)
  res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions())
  res.json({ user, accessToken })
}

export async function logout(req: Request, res: Response) {
  const token = req.cookies?.[REFRESH_COOKIE] as string | undefined
  if (token) await endSession(token)
  res.clearCookie(REFRESH_COOKIE, { ...refreshCookieOptions(), maxAge: undefined })
  res.status(204).end()
}

export async function me(req: Request, res: Response) {
  const { sub } = currentUser(req)
  res.json({ user: await getUserById(sub) })
}
