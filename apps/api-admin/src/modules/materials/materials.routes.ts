import { Router } from 'express'
import { asyncHandler } from '@repo/http/async-handler'
import { validate } from '@repo/http/validate'
import {
  createMaterialSchema,
  materialIdParamsSchema,
  updateMaterialSchema,
  uploadSignatureSchema,
} from '@repo/validation/materials'
import * as controller from './materials.controller'

/** Owner: Team 04 — Class Materials. */

export const materialsRouter: Router = Router()

materialsRouter.post(
  '/upload-signature',
  validate(uploadSignatureSchema, 'body'),
  asyncHandler(controller.uploadSignature),
)
materialsRouter.post('/', validate(createMaterialSchema, 'body'), asyncHandler(controller.create))
materialsRouter.patch(
  '/:id',
  validate(materialIdParamsSchema, 'params'),
  validate(updateMaterialSchema, 'body'),
  asyncHandler(controller.update),
)
materialsRouter.delete('/:id', validate(materialIdParamsSchema, 'params'), asyncHandler(controller.remove))
