import { Router } from 'express'
import { requireAuth, requireRole } from '@repo/auth/middleware'
import { asyncHandler } from '@repo/http/async-handler'
import { validate } from '@repo/http/validate'
import { ADMIN_PORTAL_ROLES } from '@repo/validation/enums'
import {
  createMaterialSchema,
  materialListQuerySchema,
  updateMaterialSchema,
  uploadSignatureSchema,
} from '@repo/validation/materials'
import * as controller from './materials.controller'

export const materialsRouter: Router = Router()

materialsRouter.use(requireAuth, requireRole(...ADMIN_PORTAL_ROLES))

materialsRouter.get('/', validate(materialListQuerySchema, 'query'), asyncHandler(controller.list))
materialsRouter.post(
  '/upload-signature',
  validate(uploadSignatureSchema),
  asyncHandler(controller.uploadSignature),
)
materialsRouter.post('/', validate(createMaterialSchema), asyncHandler(controller.create))
materialsRouter.patch('/:id', validate(updateMaterialSchema), asyncHandler(controller.update))
materialsRouter.delete('/:id', asyncHandler(controller.deleteMaterial))
