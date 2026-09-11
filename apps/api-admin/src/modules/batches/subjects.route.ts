import { Router } from 'express'
import { asyncHandler } from '@repo/http/async-handler'
import { validate } from '@repo/http/validate'
import { createSubjectSchema, updateSubjectSchema } from '@repo/validation/batches'
import * as controller from './subjects.controller'

export const subjectsRouter = Router()

subjectsRouter.get('/', asyncHandler(controller.getSubjects))
subjectsRouter.post('/', validate(createSubjectSchema), asyncHandler(controller.createSubject))
subjectsRouter.patch('/:id', validate(updateSubjectSchema), asyncHandler(controller.updateSubject))
subjectsRouter.delete('/:id', asyncHandler(controller.deleteSubject))
