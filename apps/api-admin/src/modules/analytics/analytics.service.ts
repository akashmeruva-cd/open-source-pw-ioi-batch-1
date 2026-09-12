import { and, avg, count, countDistinct, eq, getDb, inArray, lte } from '@repo/models/db'
import { HttpError } from '@repo/http/http-error'
import {
  attendance,
  assignments,
  batches,
  classSessions,
  enrollments,
  subjects,
  submissions,
} from '@repo/models/schema'
import type {
  AttendanceBucket,
  BatchAnalyticsResponse,
  SubjectAnalyticsResponse,
} from '@repo/validation/analytics'

/**
 * Owner: Team 12 — Admin Analytics & Reports.
 *
 * Batch dashboard and subject analytics. Every number in here is computed by
 * the database — GROUP BY + aggregate functions over the grouping of the
 * seeded data; the only JavaScript below reshapes rows that SQL has already
 * aggregated, never raw attendance/submission records.
 *
 * Attendance % formula: PRESENT ÷ all records. LATE and EXCUSED stay in the
 * denominator. This is the convention the seed encodes — student04 is marked
 * PRESENT in exactly 1 of every 3 classes, i.e. 33.3%. Confirm with Team 06
 * that the student portal uses the same rule.
 *
 * Attendance.subjectId is denormalised on purpose (see the charter), so
 * attendance percentages never need a join.
 */

const PRESENT = 'PRESENT'
const GRADED = 'GRADED'

interface StatusCount {
  status: string
  n: number
}

interface AttendanceGroupRow {
  studentId: string
  status: string
  n: number
}

function toPct(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0
  return Math.round((numerator / denominator) * 1000) / 10
}

function attendancePct(counts: StatusCount[]): number {
  const total = counts.reduce((sum, c) => sum + c.n, 0)
  const present = counts
    .filter((c) => c.status === PRESENT)
    .reduce((sum, c) => sum + c.n, 0)
  return toPct(present, total)
}

function bucketFor(pct: number): AttendanceBucket['bucket'] {
  if (pct < 25) return '0-25'
  if (pct < 50) return '25-50'
  if (pct < 75) return '50-75'
  return '75-100'
}

function groupCounts(rows: AttendanceGroupRow[]): Map<string, StatusCount[]> {
  const byStudent = new Map<string, StatusCount[]>()
  for (const row of rows) {
    const counts = byStudent.get(row.studentId) ?? []
    counts.push({ status: row.status, n: row.n })
    byStudent.set(row.studentId, counts)
  }
  return byStudent
}

function averagePctOf(rows: AttendanceGroupRow[]): number {
  const percentages: number[] = []
  for (const counts of groupCounts(rows).values()) percentages.push(attendancePct(counts))
  const total = percentages.reduce((sum, p) => sum + p, 0)
  if (percentages.length === 0) return 0
  return Math.round((total / percentages.length) * 10) / 10
}

export function attendanceDistribution(rows: AttendanceGroupRow[]): AttendanceBucket[] {
  const buckets: Record<AttendanceBucket['bucket'], number> = {
    '0-25': 0,
    '25-50': 0,
    '50-75': 0,
    '75-100': 0,
  }
  for (const counts of groupCounts(rows).values()) {
    buckets[bucketFor(attendancePct(counts))] += 1
  }
  return (Object.keys(buckets) as AttendanceBucket['bucket'][]).map((bucket) => ({
    bucket,
    students: buckets[bucket],
  }))
}

function ratePct(part: number, whole: number): number {
  return toPct(part, whole)
}

function toAvgMarks(avg: string | null | undefined): number | null {
  if (avg == null) return null
  if (typeof avg === 'number') return avg
  const parsed = Number(avg)
  return Number.isNaN(parsed) ? null : parsed
}

export async function getBatchAnalytics(batchId: string): Promise<BatchAnalyticsResponse> {
  const db = getDb()

  const [batchRow] = await db.select().from(batches).where(eq(batches.id, batchId))
  if (!batchRow) throw HttpError.notFound('Batch not found')

  const subjectRows = await db
    .select({ id: subjects.id, name: subjects.name, code: subjects.code })
    .from(subjects)
    .where(eq(subjects.batchId, batchId))
  const subjectIds = subjectRows.map((s) => s.id)
  if (subjectIds.length === 0) {
    return {
      batchId,
      batchName: batchRow.name,
      studentCount: 0,
      attendance: { averagePct: 0, distribution: attendanceDistribution([]) },
      submissions: { ratePct: 0, averageMarks: null },
      perSubject: [],
    }
  }

  const [studentCountRow] = await db
    .select({ n: countDistinct(enrollments.studentId) })
    .from(enrollments)
    .where(eq(enrollments.batchId, batchId))

  const enrolledBySubject = await db
    .select({ subjectId: enrollments.subjectId, n: count() })
    .from(enrollments)
    .where(eq(enrollments.batchId, batchId))
    .groupBy(enrollments.subjectId)

  const attendanceRows = await db
    .select({
      subjectId: attendance.subjectId,
      studentId: attendance.studentId,
      status: attendance.status,
      n: count(),
    })
    .from(attendance)
    .where(inArray(attendance.subjectId, subjectIds))
    .groupBy(attendance.subjectId, attendance.studentId, attendance.status)

  const submittedRows = await db
    .select({
      subjectId: assignments.subjectId,
      studentId: submissions.studentId,
      n: count(),
    })
    .from(submissions)
    .innerJoin(assignments, eq(submissions.assignmentId, assignments.id))
    .where(inArray(assignments.subjectId, subjectIds))
    .groupBy(assignments.subjectId, submissions.studentId)

  const [averageMarksRow] = await db
    .select({ averageMarks: avg(submissions.marks) })
    .from(submissions)
    .innerJoin(assignments, eq(submissions.assignmentId, assignments.id))
    .where(and(eq(submissions.status, GRADED), inArray(assignments.subjectId, subjectIds)))

  const attendanceBySubject = new Map<string, StatusCount[]>()
  for (const row of attendanceRows) {
    const counts = attendanceBySubject.get(row.subjectId) ?? []
    counts.push({ status: row.status, n: row.n })
    attendanceBySubject.set(row.subjectId, counts)
  }

  const submittedBySubject = new Map<string, Set<string>>()
  for (const row of submittedRows) {
    const students = submittedBySubject.get(row.subjectId) ?? new Set<string>()
    students.add(row.studentId)
    submittedBySubject.set(row.subjectId, students)
  }

  const enrolledBySubjectCounts = new Map(enrolledBySubject.map((e) => [e.subjectId, e.n]))

  const perSubject = subjectRows.map((s) => ({
    subjectId: s.id,
    subjectName: s.name,
    subjectCode: s.code,
    attendancePct: attendancePct(attendanceBySubject.get(s.id) ?? []),
    submissionRatePct: ratePct(
      submittedBySubject.get(s.id)?.size ?? 0,
      enrolledBySubjectCounts.get(s.id) ?? 0,
    ),
  }))

  const submittedCount = new Set(submittedRows.map((r) => r.studentId)).size

  return {
    batchId,
    batchName: batchRow.name,
    studentCount: studentCountRow?.n ?? 0,
    attendance: {
      averagePct: averagePctOf(attendanceRows),
      distribution: attendanceDistribution(attendanceRows),
    },
    submissions: {
      ratePct: ratePct(submittedCount, studentCountRow?.n ?? 0),
      averageMarks: toAvgMarks(averageMarksRow?.averageMarks),
    },
    perSubject,
  }
}

export async function getSubjectAnalytics(subjectId: string): Promise<SubjectAnalyticsResponse> {
  const db = getDb()

  const [subjectRow] = await db.select().from(subjects).where(eq(subjects.id, subjectId))
  if (!subjectRow) throw HttpError.notFound('Subject not found')

  const [studentCountRow] = await db
    .select({ n: countDistinct(enrollments.studentId) })
    .from(enrollments)
    .where(eq(enrollments.subjectId, subjectId))

  const [sessionsRow] = await db
    .select({ n: count() })
    .from(classSessions)
    .where(and(eq(classSessions.subjectId, subjectId), lte(classSessions.scheduledAt, new Date())))

  const attendanceRows = await db
    .select({ studentId: attendance.studentId, status: attendance.status, n: count() })
    .from(attendance)
    .where(eq(attendance.subjectId, subjectId))
    .groupBy(attendance.studentId, attendance.status)

  const assignmentRows = await db
    .select({ id: assignments.id })
    .from(assignments)
    .where(eq(assignments.subjectId, subjectId))
  const assignmentIds = assignmentRows.map((a) => a.id)

  const submittedRows =
    assignmentIds.length === 0
      ? []
      : await db
          .select({ studentId: submissions.studentId, n: count() })
          .from(submissions)
          .innerJoin(assignments, eq(submissions.assignmentId, assignments.id))
          .where(and(eq(assignments.subjectId, subjectId), inArray(submissions.assignmentId, assignmentIds)))
          .groupBy(submissions.studentId)

  const [averageMarksRow] = await db
    .select({ averageMarks: avg(submissions.marks) })
    .from(submissions)
    .innerJoin(assignments, eq(submissions.assignmentId, assignments.id))
    .where(and(eq(submissions.status, GRADED), eq(assignments.subjectId, subjectId)))

  return {
    subjectId,
    subjectName: subjectRow.name,
    subjectCode: subjectRow.code,
    studentCount: studentCountRow?.n ?? 0,
    attendance: {
      averagePct: averagePctOf(attendanceRows),
      distribution: attendanceDistribution(attendanceRows),
    },
    submissions: {
      ratePct: ratePct(submittedRows.length, studentCountRow?.n ?? 0),
      averageMarks: toAvgMarks(averageMarksRow?.averageMarks),
    },
    sessionsHeld: sessionsRow?.n ?? 0,
  }
}