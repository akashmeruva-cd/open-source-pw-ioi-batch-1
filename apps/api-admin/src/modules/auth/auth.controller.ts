import type { CookieOptions, Request, Response } from 'express'
import { currentUser } from '@repo/auth/middleware'
import { HttpError } from '@repo/http/http-error'
import type { LoginInput } from '@repo/validation/auth'
import { endAdminSession, getAdminById, loginAdmin, refreshAdminSession } from './auth.service'

/** Owner: Team 03 — Auth & Identity. */

export const REFRESH_COOKIE = 'admin_refresh_token'
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000

function refreshCookieOptions(): CookieOptions {
  const isProd = process.env.NODE_ENV === 'production'
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/api/auth',
    maxAge: REFRESH_TOKEN_TTL_MS,
  }
}

export async function login(req: Request, res: Response) {
  const { user, accessToken, refreshToken } = await loginAdmin(req.body as LoginInput)
  res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions())
  res.json({ user, accessToken })
}

export async function refresh(req: Request, res: Response) {
  const token = req.cookies?.[REFRESH_COOKIE] as string | undefined
  if (!token) throw HttpError.unauthorized('No refresh token')

  const { user, accessToken, refreshToken } = await refreshAdminSession(token)
  res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions())
  res.json({ user, accessToken })
}

export async function logout(req: Request, res: Response) {
  const token = req.cookies?.[REFRESH_COOKIE] as string | undefined
  if (token) await endAdminSession(token)
  res.clearCookie(REFRESH_COOKIE, { ...refreshCookieOptions(), maxAge: undefined })
  res.status(204).end()
}

export async function me(req: Request, res: Response) {
  const { sub } = currentUser(req)
  res.json({ user: await getAdminById(sub) })
}
