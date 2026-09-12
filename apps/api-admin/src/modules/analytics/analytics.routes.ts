import { Router } from 'express'
import { asyncHandler } from '@repo/http/async-handler'
import { validate } from '@repo/http/validate'
import { batchAnalyticsParamsSchema, subjectAnalyticsParamsSchema } from '@repo/validation/analytics'
import { getBatchAnalyticsHandler, getSubjectAnalyticsHandler } from './analytics.controller'

/**
 * Owner: Team 12 — Admin Analytics & Reports.
 *
 * Mounted by `app.ts` behind `requireAuth` + `requireRole(ADMIN, FACULTY)`, so
 * a student token can never reach these routes.
 */
export const analyticsRouter: Router = Router()

analyticsRouter.get(
  '/batch/:batchId',
  validate(batchAnalyticsParamsSchema, 'params'),
  asyncHandler(getBatchAnalyticsHandler),
)

analyticsRouter.get(
  '/subject/:subjectId',
  validate(subjectAnalyticsParamsSchema, 'params'),
  asyncHandler(getSubjectAnalyticsHandler),
)