import { z } from 'zod'
import { objectIdSchema } from './common'
import { attendanceStatusSchema } from './enums'

/**
 * A single attendance record visible to a student.
 */
export const attendanceRecordSchema = z.object({
    id: objectIdSchema,
    sessionId: objectIdSchema,
    subjectId: objectIdSchema,
    status: attendanceStatusSchema,
    markedAt: z.string(),
    note: z.string().nullable(),
})

export type AttendanceRecord = z.infer<typeof attendanceRecordSchema>

/**
 * Attendance summary for one subject.
 */
export const subjectAttendanceSummarySchema = z.object({
    subjectId: objectIdSchema,
    subjectName: z.string(),
    present: z.number().int().nonnegative(),
    absent: z.number().int().nonnegative(),
    late: z.number().int().nonnegative(),
    excused: z.number().int().nonnegative(),
    total: z.number().int().nonnegative(),
    percentage: z.number().min(0).max(100),
})

export type SubjectAttendanceSummary = z.infer<typeof subjectAttendanceSummarySchema>

/**
 * Overall attendance summary for the logged-in student.
 */
export const attendanceSummarySchema = z.object({
    overall: z.object({
        present: z.number().int().nonnegative(),
        absent: z.number().int().nonnegative(),
        late: z.number().int().nonnegative(),
        excused: z.number().int().nonnegative(),
        total: z.number().int().nonnegative(),
        percentage: z.number().min(0).max(100),
    }),
    subjects: z.array(subjectAttendanceSummarySchema),
})

export type AttendanceSummary = z.infer<typeof attendanceSummarySchema>