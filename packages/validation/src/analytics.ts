import { z } from 'zod'
import { uuidSchema } from './common'

/**
 * Owner: Team 12 — Admin Analytics & Reports.
 *
 * Contract for the batch dashboard and subject analytics endpoints. The
 * frontend (apps/web-admin/features/analytics) builds against these shapes in
 * parallel, so keep them stable.
 */

export const batchAnalyticsParamsSchema = z.object({
  batchId: uuidSchema,
})
export type BatchAnalyticsParams = z.infer<typeof batchAnalyticsParamsSchema>

export const subjectAnalyticsParamsSchema = z.object({
  subjectId: uuidSchema,
})
export type SubjectAnalyticsParams = z.infer<typeof subjectAnalyticsParamsSchema>

/** Per-student attendance % histogram. Buckets are [0,25), [25,50), [50,75), [75,100]. */
export const attendanceBucketSchema = z.object({
  bucket: z.enum(['0-25', '25-50', '50-75', '75-100']),
  students: z.number().int().min(0),
})
export type AttendanceBucket = z.infer<typeof attendanceBucketSchema>

/**
 * A single subject's line in a batch report. Percentages are 0-100 and are
 * computed by the database, never by looping over raw records.
 */
export const perSubjectAnalyticsSchema = z.object({
  subjectId: uuidSchema,
  subjectName: z.string(),
  subjectCode: z.string(),
  attendancePct: z.number().min(0).max(100),
  submissionRatePct: z.number().min(0).max(100),
})
export type PerSubjectAnalytics = z.infer<typeof perSubjectAnalyticsSchema>

export const batchAnalyticsResponseSchema = z.object({
  batchId: uuidSchema,
  batchName: z.string(),
  studentCount: z.number().int().min(0),
  attendance: z.object({
    /** Mean of per-student attendance percentages. */
    averagePct: z.number().min(0).max(100),
    distribution: z.array(attendanceBucketSchema),
  }),
  submissions: z.object({
    /** Distinct students who submitted at least one assignment ÷ enrolled. */
    ratePct: z.number().min(0).max(100),
    averageMarks: z.number().nullable(),
  }),
  perSubject: z.array(perSubjectAnalyticsSchema),
})
export type BatchAnalyticsResponse = z.infer<typeof batchAnalyticsResponseSchema>

export const subjectAnalyticsResponseSchema = z.object({
  subjectId: uuidSchema,
  subjectName: z.string(),
  subjectCode: z.string(),
  studentCount: z.number().int().min(0),
  attendance: z.object({
    averagePct: z.number().min(0).max(100),
    distribution: z.array(attendanceBucketSchema),
  }),
  submissions: z.object({
    ratePct: z.number().min(0).max(100),
    averageMarks: z.number().nullable(),
  }),
  sessionsHeld: z.number().int().min(0),
})
export type SubjectAnalyticsResponse = z.infer<typeof subjectAnalyticsResponseSchema>