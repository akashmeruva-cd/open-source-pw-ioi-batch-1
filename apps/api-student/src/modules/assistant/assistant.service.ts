import { Assignment } from '@repo/models/assignment'
import { Enrollment } from '@repo/models/enrollment'
import { Submission } from '@repo/models/submission'
import { HttpError } from '@repo/http/http-error'

/**
 * Owner: Team 13 — AI Assistant.
 *
 * Tool queries read the models directly (never another team's HTTP endpoint)
 * and are always scoped to the caller's own data. All data access filters on a
 * `studentId` that comes from the verified token and is never part of a tool
 * schema.
 */

/** Default "what's due this week" window in days. */
export const DEFAULT_DUE_DAYS = 7

/** Upper bound so a stray model argument cannot trigger an unbounded window. */
export const MAX_DUE_DAYS = 365

export interface UpcomingAssignment {
  id: string
  title: string
  subjectId: string
  description: string
  dueAt: string
  maxMarks: number
}

/**
 * The numeric range of a tool's `days` argument. Tool input travels from the
 * model, so it is coerced and clamped before it is trusted in a query. A
 * rejected value surfaces as a readable message, not a crash.
 */
function clampDays(days: unknown): number {
  const raw = typeof days === 'number' ? days : Number(days)
  if (!Number.isFinite(raw)) return DEFAULT_DUE_DAYS
  const n = Math.max(1, Math.floor(raw))
  return Math.min(n, MAX_DUE_DAYS)
}

/**
 * Assignments due within `days` (default 7) for subjects the student is
 * enrolled in, minus ones they have already submitted.
 */
export async function listUpcomingAssignmentsForStudent(
  studentId: string,
  days: unknown = DEFAULT_DUE_DAYS,
): Promise<UpcomingAssignment[]> {
  if (!studentId) throw HttpError.badRequest('Missing caller identity')

  const windowDays = clampDays(days)
  const now = new Date()
  const cutoff = new Date(now.getTime() + windowDays * 24 * 60 * 60 * 1000)

  // Access control first: only subjects the caller is actually enrolled in.
  const enrolled = await Enrollment.find({ studentId }).select('subjectId').lean()
  const allowedSubjectIds = enrolled.map((e) => e.subjectId)
  if (allowedSubjectIds.length === 0) return []

  const assignments = await Assignment.find({
    subjectId: { $in: allowedSubjectIds },
    isPublished: true,
    dueAt: { $gte: now, $lte: cutoff },
  })
    .sort({ dueAt: 1 })
    .lean()

  if (assignments.length === 0) return []

  // Upcoming means not yet submitted. One query, not one per assignment.
  const submitted = await Submission.find({
    studentId,
    assignmentId: { $in: assignments.map((a) => a._id) },
  })
    .select('assignmentId')
    .lean()
  const submittedIds = new Set(submitted.map((s) => s.assignmentId.toString()))

  return assignments
    .filter((a) => !submittedIds.has(a._id.toString()))
    .map((a) => ({
      id: a._id.toString(),
      title: a.title,
      subjectId: a.subjectId.toString(),
      description: a.description,
      dueAt: a.dueAt.toISOString(),
      maxMarks: a.maxMarks,
    }))
}
