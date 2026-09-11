import { Router } from 'express'
import { asyncHandler } from '@repo/http/async-handler'
import { validate } from '@repo/http/validate'
import { createEnrollmentSchema, bulkCreateEnrollmentsSchema } from '@repo/validation/batches'
import * as controller from './enrollments.controller'

export const enrollmentsRouter = Router()

enrollmentsRouter.post('/', validate(createEnrollmentSchema), asyncHandler(controller.createEnrollment))
enrollmentsRouter.post('/bulk', validate(bulkCreateEnrollmentsSchema), asyncHandler(controller.bulkCreateEnrollments))
