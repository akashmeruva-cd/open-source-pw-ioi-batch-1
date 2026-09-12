import { Router } from 'express'
import { requireAuth, requireRole } from '@repo/auth/middleware'
import { asyncHandler } from '@repo/http/async-handler'
import * as controller from './users.controller'

const usersRouter = Router()

/** Role change: ADMIN only */
usersRouter.post(
  '/:id/role',
  requireAuth,
  requireRole('ADMIN'),
  asyncHandler(controller.changeRole)
)

/** Deactivate user: ADMIN only */
usersRouter.post(
  '/:id/deactivate',
  requireAuth,
  requireRole('ADMIN'),
  asyncHandler(controller.deactivateUser)
)

/** Reactivate user: ADMIN only */
usersRouter.post(
  '/:id/activate',
  requireAuth,
  requireRole('ADMIN'),
  asyncHandler(controller.activateUser)
)

export { usersRouter }