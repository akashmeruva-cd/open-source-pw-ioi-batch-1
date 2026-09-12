import { z } from 'zod'
import { uuidSchema } from './common'

/**
 * Owner: Team 12 — Admin Analytics & Reports.
 *
 * This file is the contract. Both the backend (analytics.service.ts) and the
 * frontend (features/analytics/) build against these types. Merge this first,
 * before either half writes implementation code.
 *
 * Attendance-percentage formula agreed with Team 06:
 *   percentage = (PRESENT + LATE) / totalSessions * 100
 *   EXCUSED sessions are excluded from the denominator.
 */

// ─── Query schemas ──────────────────────────────────────────────────────────

export const batchAnalyticsParamsSchema = z.object({
  batchId: uuidSchema,
})
export type BatchAnalyticsParams = z.infer<typeof batchAnalyticsParamsSchema>

export const subjectAnalyticsParamsSchema = z.object({
  subjectId: uuidSchema,
})
export type SubjectAnalyticsParams = z.infer<typeof subjectAnalyticsParamsSchema>

export const atRiskQuerySchema = z.object({
  batchId: uuidSchema,
  threshold: z.coerce.number().min(0).max(100).default(75),
})
export type AtRiskQuery = z.infer<typeof atRiskQuerySchema>

export const exportQuerySchema = z.object({
  batchId: uuidSchema,
})
export type ExportQuery = z.infer<typeof exportQuerySchema>

// ─── Response schemas ────────────────────────────────────────────────────────

/** Per-subject breakdown inside a batch dashboard response. */
export const subjectSummarySchema = z.object({
  subjectId: uuidSchema,
  subjectName: z.string(),
  subjectCode: z.string(),
  averageAttendancePercent: z.number(),
  submissionRate: z.number(),
  averageMarks: z.number().nullable(),
  totalStudents: z.number().int(),
})
export type SubjectSummary = z.infer<typeof subjectSummarySchema>

/** Attendance distribution bucket (0–25, 25–50, 50–75, 75–100). */
export const attendanceBucketSchema = z.object({
  label: z.string(),   // e.g. "0–25%"
  min: z.number(),
  max: z.number(),
  count: z.number().int(),
})
export type AttendanceBucket = z.infer<typeof attendanceBucketSchema>

/** Full batch dashboard response. */
export const batchAnalyticsSchema = z.object({
  batchId: uuidSchema,
  batchName: z.string(),
  totalStudents: z.number().int(),
  averageAttendancePercent: z.number(),
  submissionRate: z.number(),
  averageMarks: z.number().nullable(),
  attendanceDistribution: z.array(attendanceBucketSchema),
  subjectBreakdown: z.array(subjectSummarySchema),
})
export type BatchAnalytics = z.infer<typeof batchAnalyticsSchema>

/** Subject-level analytics response. */
export const subjectAnalyticsSchema = z.object({
  subjectId: uuidSchema,
  subjectName: z.string(),
  subjectCode: z.string(),
  batchId: uuidSchema,
  batchName: z.string(),
  totalStudents: z.number().int(),
  averageAttendancePercent: z.number(),
  submissionRate: z.number(),
  averageMarks: z.number().nullable(),
  attendanceDistribution: z.array(attendanceBucketSchema),
})
export type SubjectAnalytics = z.infer<typeof subjectAnalyticsSchema>

/** One student in the at-risk list. */
export const atRiskStudentSchema = z.object({
  studentId: uuidSchema,
  name: z.string(),
  email: z.string().email(),
  attendancePercent: z.number(),
  totalSessions: z.number().int(),
  presentCount: z.number().int(),
  missedSubmissions: z.number().int(),
  totalAssignments: z.number().int(),
  averageMarks: z.number().nullable(),
  /** Attendance trend: positive = improving, negative = declining, null = insufficient data. */
  trend: z.number().nullable(),
})
export type AtRiskStudent = z.infer<typeof atRiskStudentSchema>

/** At-risk list response. */
export const atRiskResponseSchema = z.object({
  batchId: uuidSchema,
  threshold: z.number(),
  students: z.array(atRiskStudentSchema),
  generatedAt: z.string().datetime(),
})
export type AtRiskResponse = z.infer<typeof atRiskResponseSchema>
