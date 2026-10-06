import { Router } from 'express'
import { requireAuth, requireRole } from '@repo/auth/middleware'
import { asyncHandler } from '@repo/http/async-handler'
import { validate } from '@repo/http/validate'
import {
  createUserSchema,
  resetPasswordSchema,
  updateUserSchema,
  userListQuerySchema,
} from '@repo/validation/users'
import * as controller from './users.controller'

export const usersRouter: Router = Router()

usersRouter.use(requireAuth, requireRole('ADMIN'))

usersRouter.get('/', validate(userListQuerySchema, 'query'), asyncHandler(controller.listUsers))
usersRouter.post('/', validate(createUserSchema), asyncHandler(controller.createUser))
usersRouter.patch('/:id', validate(updateUserSchema), asyncHandler(controller.updateUser))
usersRouter.post('/:id/reset-password', validate(resetPasswordSchema), asyncHandler(controller.resetPassword))
