import { Router } from 'express'
import { requireAuth } from '@repo/auth/middleware'
import { asyncHandler } from '@repo/http/async-handler'
import { validate } from '@repo/http/validate'
import { materialListQuerySchema, materialSearchQuerySchema } from '@repo/validation/materials'
import * as controller from './materials.controller'

export const materialsRouter: Router = Router()

materialsRouter.get(
  '/',
  requireAuth,
  validate(materialListQuerySchema, 'query'),
  asyncHandler(controller.list),
)

materialsRouter.get(
  '/search',
  requireAuth,
  validate(materialSearchQuerySchema, 'query'),
  asyncHandler(controller.search),
)

materialsRouter.get(
  '/:id',
  requireAuth,
  asyncHandler(controller.getById),
)
