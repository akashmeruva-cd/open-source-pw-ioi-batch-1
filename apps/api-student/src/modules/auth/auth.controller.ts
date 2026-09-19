import type { CookieOptions, Request, Response } from 'express'
import { currentUser } from '@repo/auth/middleware'
import { HttpError } from '@repo/http/http-error'
import type { ChangePasswordInput, LoginInput, PasswordResetInput, PasswordResetRequestInput, RegisterInput } from '@repo/validation/auth'
import {
  changeUserPassword,
  confirmReset,
  endSession,
  getUserById,
  listSessions,
  loginUser,
  refreshSession,
  registerUser,
  requestReset,
  revokeAllSessions,
} from './auth.service'

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

// ─── Member B: new handlers ──────────────────────────────────────────────────

export async function passwordResetRequest(req: Request, res: Response) {
  await requestReset(req.body as PasswordResetRequestInput)
  // Always 202 — never reveal whether the email exists.
  res.status(202).json({ message: 'If that email is registered, a reset link has been sent.' })
}

export async function passwordResetConfirm(req: Request, res: Response) {
  await confirmReset(req.body as PasswordResetInput)
  res.status(200).json({ message: 'Password updated. Please sign in again.' })
}

export async function changePassword(req: Request, res: Response) {
  const { sub } = currentUser(req)
  await changeUserPassword(sub, req.body as ChangePasswordInput)
  res.status(200).json({ message: 'Password changed.' })
}

export async function sessions(req: Request, res: Response) {
  const { sub } = currentUser(req)
  res.json({ sessions: await listSessions(sub) })
}

export async function signOutEverywhere(req: Request, res: Response) {
  const { sub } = currentUser(req)
  await revokeAllSessions(sub)
  // Also clear the cookie on the current device.
  res.clearCookie(REFRESH_COOKIE, { ...refreshCookieOptions(), maxAge: undefined })
  res.status(204).end()
}
