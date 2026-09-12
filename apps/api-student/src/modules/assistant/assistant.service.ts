import { and, asc, eq, getDb, gte, inArray, lte } from '@repo/models/db'
import { HttpError } from '@repo/http/http-error'
import { assignments, enrollments, submissions } from '@repo/models/schema'

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

  const db = getDb()

  // Access control first: only subjects the caller is actually enrolled in.
  const enrolled = await db.select().from(enrollments).where(eq(enrollments.studentId, studentId))
  const allowedSubjectIds = enrolled.map((e) => e.subjectId)
  if (allowedSubjectIds.length === 0) return []

  const found = await db
    .select()
    .from(assignments)
    .where(
      and(
        inArray(assignments.subjectId, allowedSubjectIds),
        eq(assignments.isPublished, true),
        gte(assignments.dueAt, now),
        lte(assignments.dueAt, cutoff),
      ),
    )
    .orderBy(asc(assignments.dueAt))

  if (found.length === 0) return []

  // Upcoming means not yet submitted. One query, not one per assignment.
  const submitted = await db
    .select()
    .from(submissions)
    .where(
      and(
        eq(submissions.studentId, studentId),
        inArray(
          submissions.assignmentId,
          found.map((a) => a.id),
        ),
      ),
    )
  const submittedIds = new Set(submitted.map((s) => s.assignmentId))

  return found
    .filter((a) => !submittedIds.has(a.id))
    .map((a) => ({
      id: a.id,
      title: a.title,
      subjectId: a.subjectId,
      description: a.description,
      dueAt: a.dueAt.toISOString(),
      maxMarks: a.maxMarks,
    }))
}