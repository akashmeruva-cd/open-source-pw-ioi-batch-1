import { Router } from 'express'
import { asyncHandler } from '@repo/http/async-handler'
import { validate } from '@repo/http/validate'
import {
  batchAnalyticsParamsSchema,
  subjectAnalyticsParamsSchema,
  atRiskQuerySchema,
  exportQuerySchema,
} from '@repo/validation/analytics'
import * as controller from './analytics.controller'

/**
 * Owner: Team 12 — Admin Analytics & Reports.
 *
 * All routes are automatically gated to ADMIN|FACULTY by app.ts — no need to
 * add requireAuth/requireRole here.
 */
export const analyticsRouter: Router = Router()

/** GET /api/analytics/batch/:batchId */
analyticsRouter.get(
  '/batch/:batchId',
  validate(batchAnalyticsParamsSchema, 'params'),
  asyncHandler(controller.batchAnalytics),
)

/** GET /api/analytics/subject/:subjectId */
analyticsRouter.get(
  '/subject/:subjectId',
  validate(subjectAnalyticsParamsSchema, 'params'),
  asyncHandler(controller.subjectAnalytics),
)

/** GET /api/analytics/at-risk?batchId=&threshold=75 */
analyticsRouter.get(
  '/at-risk',
  validate(atRiskQuerySchema, 'query'),
  asyncHandler(controller.atRisk),
)

/** GET /api/analytics/export/attendance.csv?batchId= */
analyticsRouter.get(
  '/export/attendance.csv',
  validate(exportQuerySchema, 'query'),
  asyncHandler(controller.exportAttendance),
)

/** GET /api/analytics/export/grades.csv?batchId= */
analyticsRouter.get(
  '/export/grades.csv',
  validate(exportQuerySchema, 'query'),
  asyncHandler(controller.exportGrades),
)
