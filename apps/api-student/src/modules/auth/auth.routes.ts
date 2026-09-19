import { Router } from 'express'
import rateLimit, { MemoryStore } from 'express-rate-limit'
import { requireAuth } from '@repo/auth/middleware'
import { asyncHandler } from '@repo/http/async-handler'
import { validate } from '@repo/http/validate'
import {
  changePasswordSchema,
  loginSchema,
  passwordResetRequestSchema,
  passwordResetSchema,
  registerSchema,
} from '@repo/validation/auth'
import * as controller from './auth.controller'

/** Owner: Team 03 — Auth & Identity. */

/**
 * Exported so tests can reset it between cases. The counter is per-process and
 * in-memory, which is also why it is weaker than it looks in production: each
 * warm Vercel Function has its own copy. Treat it as a speed bump, not a lock.
 */
export const credentialsLimiterStore = new MemoryStore()

// Credential endpoints get their own tighter limit — this is where brute force
// attempts land.
const credentialsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  store: credentialsLimiterStore,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMITED', message: 'Too many attempts, try again later' } },
})

export const authRouter: Router = Router()

authRouter.post(
  '/register',
  credentialsLimiter,
  validate(registerSchema),
  asyncHandler(controller.register),
)
authRouter.post('/login', credentialsLimiter, validate(loginSchema), asyncHandler(controller.login))
authRouter.post('/refresh', asyncHandler(controller.refresh))
authRouter.post('/logout', asyncHandler(controller.logout))
authRouter.get('/me', requireAuth, asyncHandler(controller.me))

// ─── Member B: new routes ────────────────────────────────────────────────────

// Public — rate-limited because anyone can call these unauthenticated.
authRouter.post(
  '/password-reset/request',
  credentialsLimiter,
  validate(passwordResetRequestSchema),
  asyncHandler(controller.passwordResetRequest),
)
authRouter.post(
  '/password-reset/confirm',
  credentialsLimiter,
  validate(passwordResetSchema),
  asyncHandler(controller.passwordResetConfirm),
)

// Authenticated — user must be signed in.
authRouter.post(
  '/change-password',
  requireAuth,
  validate(changePasswordSchema),
  asyncHandler(controller.changePassword),
)
authRouter.get('/sessions', requireAuth, asyncHandler(controller.sessions))
authRouter.delete('/sessions', requireAuth, asyncHandler(controller.signOutEverywhere))
