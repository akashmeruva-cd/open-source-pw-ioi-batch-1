import { Router } from 'express'
import { asyncHandler } from '@repo/http/async-handler'
import { validate } from '@repo/http/validate'
import { importStudentsSchema } from '@repo/validation/batches'
import * as controller from './students.controller'

export const studentsRouter = Router()

studentsRouter.post('/import', validate(importStudentsSchema), asyncHandler(controller.importStudents))
