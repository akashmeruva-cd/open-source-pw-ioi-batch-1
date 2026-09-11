import { Router } from 'express'
import { asyncHandler } from '@repo/http/async-handler'
import { validate } from '@repo/http/validate'
import { createBatchSchema, updateBatchSchema } from '@repo/validation/batches'
import * as controller from './batches.controller'
import { requireAuth } from '@repo/auth/middleware'

// Note: Admin check middleware should ideally be applied globally or here. 
// Assuming requireAuth handles role checks or there's a specific requireAdmin if provided.
// Since modules.ts comments "The only module mounted outside the admin role gate — logging in...",
// everything else is behind the admin role gate globally!

export const batchesRouter = Router()

batchesRouter.get('/', asyncHandler(controller.getBatches))
batchesRouter.post('/', validate(createBatchSchema), asyncHandler(controller.createBatch))
batchesRouter.patch('/:id', validate(updateBatchSchema), asyncHandler(controller.updateBatch))
batchesRouter.delete('/:id', asyncHandler(controller.deleteBatch))
