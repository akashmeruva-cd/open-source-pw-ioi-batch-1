import { z } from 'zod'
import { objectIdSchema } from './common'

export const atRiskQuerySchema = z.object({
  batchId: objectIdSchema,
  threshold: z.coerce.number().int().min(0).max(100).default(75),
})
export type AtRiskQuery = z.infer<typeof atRiskQuerySchema>

export const batchAnalyticsParamsSchema = z.object({
  batchId: objectIdSchema,
})
export type BatchAnalyticsParams = z.infer<typeof batchAnalyticsParamsSchema>

export const subjectAnalyticsParamsSchema = z.object({
  subjectId: objectIdSchema,
})
export type SubjectAnalyticsParams = z.infer<typeof subjectAnalyticsParamsSchema>

export const exportQuerySchema = z.object({
  batchId: objectIdSchema.optional(),
  subjectId: objectIdSchema.optional(),
})
export type ExportQuery = z.infer<typeof exportQuerySchema>

const atRiskSubjectSchema = z.object({
  subjectId: objectIdSchema,
  subjectName: z.string(),
  attendancePct: z.number().min(0).max(100),
  missingSubmissions: z.number().int().nonnegative(),
})

export const atRiskResponseSchema = z.array(
  z.object({
    studentId: objectIdSchema,
    email: z.string().email(),
    name: z.string(),
    attendancePct: z.number().min(0).max(100),
    missingSubmissions: z.number().int().nonnegative(),
    trend: z.enum(['improving', 'stable', 'declining']),
    subjects: z.array(atRiskSubjectSchema),
  })
)
export type AtRiskResponse = z.infer<typeof atRiskResponseSchema>

const batchPerSubjectSchema = z.object({
  subjectId: objectIdSchema,
  subjectName: z.string(),
  avgAttendance: z.number().min(0).max(100),
  submissionRate: z.number().min(0).max(100),
  avgMarks: z.number().nonnegative(),
})

const attendanceDistributionSchema = z.object({
  bucket: z.string(),
  count: z.number().int().nonnegative(),
})

export const batchAnalyticsResponseSchema = z.object({
  avgAttendance: z.number().min(0).max(100),
  submissionRate: z.number().min(0).max(100),
  avgMarks: z.number().nonnegative(),
  attendanceDistribution: z.array(attendanceDistributionSchema),
  perSubject: z.array(batchPerSubjectSchema),
})
export type BatchAnalyticsResponse = z.infer<typeof batchAnalyticsResponseSchema>

export const subjectAnalyticsResponseSchema = z.object({
  subjectId: objectIdSchema,
  subjectName: z.string(),
  avgAttendance: z.number().min(0).max(100),
  submissionRate: z.number().min(0).max(100),
  avgMarks: z.number().nonnegative(),
  studentCount: z.number().int().nonnegative(),
})
export type SubjectAnalyticsResponse = z.infer<typeof subjectAnalyticsResponseSchema>