import { Router } from 'express'
import { requireAuth } from '@repo/auth/middleware'
import { asyncHandler } from '@repo/http/async-handler'
import { validate } from '@repo/http/validate'
import {
  listMaterialsQuerySchema,
  materialIdParamsSchema,
  searchMaterialsQuerySchema,
} from '@repo/validation/materials'
import * as controller from './materials.controller'

/** Owner: Team 04 — Class Materials. */

export const materialsRouter: Router = Router()

materialsRouter.use(requireAuth)

materialsRouter.get('/', validate(listMaterialsQuerySchema, 'query'), asyncHandler(controller.list))
materialsRouter.get('/search', validate(searchMaterialsQuerySchema, 'query'), asyncHandler(controller.search))
materialsRouter.get('/:id', validate(materialIdParamsSchema, 'params'), asyncHandler(controller.getById))
