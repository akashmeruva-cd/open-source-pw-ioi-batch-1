import { and, eq, getDb, inArray, sql } from '@repo/models/db'
import {
  assignments,
  attendance,
  batches,
  classSessions,
  enrollments,
  profiles,
  subjects,
  submissions,
} from '@repo/models/schema'
import { HttpError } from '@repo/http/http-error'
import type { Response } from 'express'
import type {
  AtRiskResponse,
  BatchAnalytics,
  SubjectAnalytics,
} from '@repo/validation/analytics'

/**
 * Owner: Team 12 — Admin Analytics & Reports.
 *
 * All aggregations run in SQL via Drizzle ORM — no JavaScript loops over
 * documents. Two rules enforced throughout:
 *   1. WHERE (narrow) before JOIN (expand).
 *   2. attendance.subjectId is denormalised — per-subject % never needs a join.
 *
 * Attendance formula (agreed with Team 06):
 *   percentage = (PRESENT + LATE) / totalSessions * 100
 *   EXCUSED sessions are removed from the denominator.
 */

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Escape a CSV field per RFC 4180. Handles commas, quotes, newlines, apostrophes. */
function escapeCsvField(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return ''
  const str = String(value)
  // Any field containing comma, double-quote, or newline must be quoted.
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function csvRow(fields: (string | number | null | undefined)[]): string {
  return fields.map(escapeCsvField).join(',') + '\r\n'
}

// ─── Batch dashboard ─────────────────────────────────────────────────────────

export async function getBatchAnalytics(batchId: string): Promise<BatchAnalytics> {
  const db = getDb()

  // Verify batch exists — narrow first
  const [batch] = await db.select().from(batches).where(eq(batches.id, batchId)).limit(1)
  if (!batch) throw HttpError.notFound('Batch not found')

  // Students enrolled in this batch
  const studentRows = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(and(eq(profiles.batchId, batchId), eq(profiles.role, 'STUDENT'), eq(profiles.isActive, true)))

  const studentIds = studentRows.map((r) => r.id)
  const totalStudents = studentIds.length

  if (totalStudents === 0) {
    return {
      batchId,
      batchName: batch.name,
      totalStudents: 0,
      averageAttendancePercent: 0,
      submissionRate: 0,
      averageMarks: null,
      attendanceDistribution: [
        { label: '0–25%', min: 0, max: 25, count: 0 },
        { label: '25–50%', min: 25, max: 50, count: 0 },
        { label: '50–75%', min: 50, max: 75, count: 0 },
        { label: '75–100%', min: 75, max: 100, count: 0 },
      ],
      subjectBreakdown: [],
    }
  }

  // ── 1. Per-student attendance % (all subjects in batch) ───────────────────
  // attendance.subjectId is denormalised — join only to subjects for batchId filter
  const subjectRows = await db
    .select({ id: subjects.id })
    .from(subjects)
    .where(eq(subjects.batchId, batchId))
  const subjectIds = subjectRows.map((r) => r.id)

  // Attendance per student: count PRESENT+LATE as attended, exclude EXCUSED from total
  const attendanceStats = await db
    .select({
      studentId: attendance.studentId,
      attended: sql<number>`cast(sum(case when ${attendance.status} in ('PRESENT','LATE') then 1 else 0 end) as int)`,
      total: sql<number>`cast(sum(case when ${attendance.status} != 'EXCUSED' then 1 else 0 end) as int)`,
    })
    .from(attendance)
    .where(
      and(
        inArray(attendance.studentId, studentIds),
        inArray(attendance.subjectId, subjectIds),
      ),
    )
    .groupBy(attendance.studentId)

  // Build per-student attendance %
  const attendanceByStudent = new Map<string, number>()
  for (const row of attendanceStats) {
    const pct = row.total > 0 ? (row.attended / row.total) * 100 : 0
    attendanceByStudent.set(row.studentId, pct)
  }
  // Students with no records count as 0%
  for (const id of studentIds) {
    if (!attendanceByStudent.has(id)) attendanceByStudent.set(id, 0)
  }

  const allPcts = [...attendanceByStudent.values()]
  const avgAttendance = allPcts.length > 0
    ? allPcts.reduce((a, b) => a + b, 0) / allPcts.length
    : 0

  // ── 2. Attendance distribution (buckets) ─────────────────────────────────
  const distribution = [
    { label: '0–25%', min: 0, max: 25, count: 0 },
    { label: '25–50%', min: 25, max: 50, count: 0 },
    { label: '50–75%', min: 50, max: 75, count: 0 },
    { label: '75–100%', min: 75, max: 100, count: 0 },
  ]
  for (const pct of allPcts) {
    if (pct < 25) distribution[0]!.count++
    else if (pct < 50) distribution[1]!.count++
    else if (pct < 75) distribution[2]!.count++
    else distribution[3]!.count++
  }

  // ── 3. Submission rate & average marks ────────────────────────────────────
  const batchAssignments = await db
    .select({ id: assignments.id, maxMarks: assignments.maxMarks })
    .from(assignments)
    .where(
      and(
        inArray(assignments.subjectId, subjectIds),
        eq(assignments.isPublished, true),
        sql`${assignments.dueAt} < now()`,
      ),
    )
  const assignmentIds = batchAssignments.map((a) => a.id)

  const expectedSubmissions = assignmentIds.length * totalStudents
  let submissionRate = 0
  let averageMarks: number | null = null

  if (expectedSubmissions > 0 && assignmentIds.length > 0) {
    const [submissionStats] = await db
      .select({
        submitCount: sql<number>`cast(count(*) as int)`,
        avgMarks: sql<number | null>`avg(${submissions.marks})`,
      })
      .from(submissions)
      .where(
        and(
          inArray(submissions.assignmentId, assignmentIds),
          inArray(submissions.studentId, studentIds),
        ),
      )

    submissionRate = submissionStats
      ? (submissionStats.submitCount / expectedSubmissions) * 100
      : 0
    averageMarks = submissionStats?.avgMarks ?? null
  }

  // ── 4. Per-subject breakdown ───────────────────────────────────────────────
  const fullSubjects = await db
    .select({ id: subjects.id, name: subjects.name, code: subjects.code })
    .from(subjects)
    .where(eq(subjects.batchId, batchId))

  const subjectBreakdown = await Promise.all(
    fullSubjects.map(async (subject) => {
      // Attendance per subject (denormalised subjectId — no extra join)
      const [subAttn] = await db
        .select({
          attended: sql<number>`cast(sum(case when ${attendance.status} in ('PRESENT','LATE') then 1 else 0 end) as int)`,
          total: sql<number>`cast(sum(case when ${attendance.status} != 'EXCUSED' then 1 else 0 end) as int)`,
        })
        .from(attendance)
        .where(
          and(
            eq(attendance.subjectId, subject.id),
            inArray(attendance.studentId, studentIds),
          ),
        )

      const subAvgAttn =
        subAttn && subAttn.total > 0 ? (subAttn.attended / subAttn.total) * 100 : 0

      // Submissions for this subject
      const subjectAssignments = await db
        .select({ id: assignments.id })
        .from(assignments)
        .where(
          and(
            eq(assignments.subjectId, subject.id),
            eq(assignments.isPublished, true),
            sql`${assignments.dueAt} < now()`,
          ),
        )
      const subAssignmentIds = subjectAssignments.map((a) => a.id)
      const subExpected = subAssignmentIds.length * totalStudents

      let subSubmissionRate = 0
      let subAvgMarks: number | null = null

      if (subExpected > 0 && subAssignmentIds.length > 0) {
        const [subSubs] = await db
          .select({
            count: sql<number>`cast(count(*) as int)`,
            avgMarks: sql<number | null>`avg(${submissions.marks})`,
          })
          .from(submissions)
          .where(
            and(
              inArray(submissions.assignmentId, subAssignmentIds),
              inArray(submissions.studentId, studentIds),
            ),
          )
        subSubmissionRate = subSubs ? (subSubs.count / subExpected) * 100 : 0
        subAvgMarks = subSubs?.avgMarks ?? null
      }

      return {
        subjectId: subject.id,
        subjectName: subject.name,
        subjectCode: subject.code,
        averageAttendancePercent: Math.round(subAvgAttn * 10) / 10,
        submissionRate: Math.round(subSubmissionRate * 10) / 10,
        averageMarks: subAvgMarks !== null ? Math.round(subAvgMarks * 10) / 10 : null,
        totalStudents,
      }
    }),
  )

  return {
    batchId,
    batchName: batch.name,
    totalStudents,
    averageAttendancePercent: Math.round(avgAttendance * 10) / 10,
    submissionRate: Math.round(submissionRate * 10) / 10,
    averageMarks: averageMarks !== null ? Math.round(averageMarks * 10) / 10 : null,
    attendanceDistribution: distribution,
    subjectBreakdown,
  }
}

// ─── Subject analytics ───────────────────────────────────────────────────────

export async function getSubjectAnalytics(subjectId: string): Promise<SubjectAnalytics> {
  const db = getDb()

  const [subject] = await db
    .select({
      id: subjects.id,
      name: subjects.name,
      code: subjects.code,
      batchId: subjects.batchId,
    })
    .from(subjects)
    .where(eq(subjects.id, subjectId))
    .limit(1)

  if (!subject) throw HttpError.notFound('Subject not found')

  const [batch] = await db
    .select({ name: batches.name })
    .from(batches)
    .where(eq(batches.id, subject.batchId))
    .limit(1)

  if (!batch) throw HttpError.notFound('Batch not found')

  // Students enrolled in this subject
  const enrolledRows = await db
    .select({ studentId: enrollments.studentId })
    .from(enrollments)
    .where(eq(enrollments.subjectId, subjectId))

  const studentIds = enrolledRows.map((r) => r.studentId)
  const totalStudents = studentIds.length

  if (totalStudents === 0) {
    return {
      subjectId,
      subjectName: subject.name,
      subjectCode: subject.code,
      batchId: subject.batchId,
      batchName: batch.name,
      totalStudents: 0,
      averageAttendancePercent: 0,
      submissionRate: 0,
      averageMarks: null,
      attendanceDistribution: [
        { label: '0–25%', min: 0, max: 25, count: 0 },
        { label: '25–50%', min: 25, max: 50, count: 0 },
        { label: '50–75%', min: 50, max: 75, count: 0 },
        { label: '75–100%', min: 75, max: 100, count: 0 },
      ],
    }
  }

  // Attendance — subjectId denormalised, no join needed
  const attendanceStats = await db
    .select({
      studentId: attendance.studentId,
      attended: sql<number>`cast(sum(case when ${attendance.status} in ('PRESENT','LATE') then 1 else 0 end) as int)`,
      total: sql<number>`cast(sum(case when ${attendance.status} != 'EXCUSED' then 1 else 0 end) as int)`,
    })
    .from(attendance)
    .where(
      and(
        eq(attendance.subjectId, subjectId),
        inArray(attendance.studentId, studentIds),
      ),
    )
    .groupBy(attendance.studentId)

  const perStudentPct: number[] = []
  const attendanceMap = new Map(attendanceStats.map((r) => [r.studentId, r]))
  for (const id of studentIds) {
    const row = attendanceMap.get(id)
    const pct = row && row.total > 0 ? (row.attended / row.total) * 100 : 0
    perStudentPct.push(pct)
  }

  const avgAttendance =
    perStudentPct.length > 0 ? perStudentPct.reduce((a, b) => a + b, 0) / perStudentPct.length : 0

  // Distribution
  const distribution = [
    { label: '0–25%', min: 0, max: 25, count: 0 },
    { label: '25–50%', min: 25, max: 50, count: 0 },
    { label: '50–75%', min: 50, max: 75, count: 0 },
    { label: '75–100%', min: 75, max: 100, count: 0 },
  ]
  for (const pct of perStudentPct) {
    if (pct < 25) distribution[0]!.count++
    else if (pct < 50) distribution[1]!.count++
    else if (pct < 75) distribution[2]!.count++
    else distribution[3]!.count++
  }

  // Submissions
  const subjectAssignments = await db
    .select({ id: assignments.id })
    .from(assignments)
    .where(
      and(
        eq(assignments.subjectId, subjectId),
        eq(assignments.isPublished, true),
        sql`${assignments.dueAt} < now()`,
      ),
    )

  const assignmentIds = subjectAssignments.map((a) => a.id)
  const expectedSubmissions = assignmentIds.length * totalStudents
  let submissionRate = 0
  let averageMarks: number | null = null

  if (expectedSubmissions > 0 && assignmentIds.length > 0) {
    const [stats] = await db
      .select({
        count: sql<number>`cast(count(*) as int)`,
        avgMarks: sql<number | null>`avg(${submissions.marks})`,
      })
      .from(submissions)
      .where(
        and(
          inArray(submissions.assignmentId, assignmentIds),
          inArray(submissions.studentId, studentIds),
        ),
      )
    submissionRate = stats ? (stats.count / expectedSubmissions) * 100 : 0
    averageMarks = stats?.avgMarks ?? null
  }

  return {
    subjectId,
    subjectName: subject.name,
    subjectCode: subject.code,
    batchId: subject.batchId,
    batchName: batch.name,
    totalStudents,
    averageAttendancePercent: Math.round(avgAttendance * 10) / 10,
    submissionRate: Math.round(submissionRate * 10) / 10,
    averageMarks: averageMarks !== null ? Math.round(averageMarks * 10) / 10 : null,
    attendanceDistribution: distribution,
  }
}

// ─── At-risk list ────────────────────────────────────────────────────────────

export async function getAtRiskStudents(
  batchId: string,
  threshold: number,
): Promise<AtRiskResponse> {
  const db = getDb()

  const [batch] = await db.select().from(batches).where(eq(batches.id, batchId)).limit(1)
  if (!batch) throw HttpError.notFound('Batch not found')

  // Narrow first: get all students in this batch
  const studentRows = await db
    .select({ id: profiles.id, name: profiles.name, email: profiles.email })
    .from(profiles)
    .where(
      and(
        eq(profiles.batchId, batchId),
        eq(profiles.role, 'STUDENT'),
        eq(profiles.isActive, true),
      ),
    )

  if (studentRows.length === 0) {
    return { batchId, threshold, students: [], generatedAt: new Date().toISOString() }
  }

  const studentIds = studentRows.map((r) => r.id)

  // Get batch subjects for scoping
  const subjectRows = await db
    .select({ id: subjects.id })
    .from(subjects)
    .where(eq(subjects.batchId, batchId))
  const subjectIds = subjectRows.map((r) => r.id)

  // Attendance per student across ALL batch subjects
  const attendanceStats = await db
    .select({
      studentId: attendance.studentId,
      attended: sql<number>`cast(sum(case when ${attendance.status} in ('PRESENT','LATE') then 1 else 0 end) as int)`,
      total: sql<number>`cast(sum(case when ${attendance.status} != 'EXCUSED' then 1 else 0 end) as int)`,
    })
    .from(attendance)
    .where(
      and(
        inArray(attendance.studentId, studentIds),
        inArray(attendance.subjectId, subjectIds),
      ),
    )
    .groupBy(attendance.studentId)

  const attendanceMap = new Map(attendanceStats.map((r) => [r.studentId, r]))

  // Closed published assignments for this batch
  const batchAssignments = await db
    .select({ id: assignments.id })
    .from(assignments)
    .where(
      and(
        inArray(assignments.subjectId, subjectIds),
        eq(assignments.isPublished, true),
        sql`${assignments.dueAt} < now()`,
      ),
    )
  const assignmentIds = batchAssignments.map((a) => a.id)
  const totalAssignments = assignmentIds.length

  // Submissions per student
  type SubmissionRow = { studentId: string; count: number; avgMarks: number | null }
  let submissionStats: SubmissionRow[] = []
  if (assignmentIds.length > 0) {
    submissionStats = await db
      .select({
        studentId: submissions.studentId,
        count: sql<number>`cast(count(*) as int)`,
        avgMarks: sql<number | null>`avg(${submissions.marks})`,
      })
      .from(submissions)
      .where(
        and(
          inArray(submissions.assignmentId, assignmentIds),
          inArray(submissions.studentId, studentIds),
        ),
      )
      .groupBy(submissions.studentId)
  }
  const submissionMap = new Map(submissionStats.map((r) => [r.studentId, r]))

  // Trend: compare attendance in first half vs second half of sessions
  // Get session order for this batch so we can split early/late
  const sessionRows = await db
    .select({ id: classSessions.id })
    .from(classSessions)
    .where(
      and(
        inArray(classSessions.subjectId, subjectIds),
        sql`${classSessions.scheduledAt} < now()`,
      ),
    )
  const sessionIds = sessionRows.map((r) => r.id)
  const midpoint = Math.floor(sessionIds.length / 2)
  const earlySessionIds = sessionIds.slice(0, midpoint)
  const lateSessionIds = sessionIds.slice(midpoint)

  // Compute early/late attendance per student for trend (only if enough sessions)
  const trendMap = new Map<string, number | null>()
  if (earlySessionIds.length > 0 && lateSessionIds.length > 0) {
    const earlyStats = await db
      .select({
        studentId: attendance.studentId,
        attended: sql<number>`cast(sum(case when ${attendance.status} in ('PRESENT','LATE') then 1 else 0 end) as int)`,
        total: sql<number>`cast(sum(case when ${attendance.status} != 'EXCUSED' then 1 else 0 end) as int)`,
      })
      .from(attendance)
      .where(
        and(
          inArray(attendance.studentId, studentIds),
          inArray(attendance.sessionId, earlySessionIds),
        ),
      )
      .groupBy(attendance.studentId)

    const lateStats = await db
      .select({
        studentId: attendance.studentId,
        attended: sql<number>`cast(sum(case when ${attendance.status} in ('PRESENT','LATE') then 1 else 0 end) as int)`,
        total: sql<number>`cast(sum(case when ${attendance.status} != 'EXCUSED' then 1 else 0 end) as int)`,
      })
      .from(attendance)
      .where(
        and(
          inArray(attendance.studentId, studentIds),
          inArray(attendance.sessionId, lateSessionIds),
        ),
      )
      .groupBy(attendance.studentId)

    const earlyMap = new Map(earlyStats.map((r) => [r.studentId, r]))
    const lateMap = new Map(lateStats.map((r) => [r.studentId, r]))

    for (const id of studentIds) {
      const e = earlyMap.get(id)
      const l = lateMap.get(id)
      if (e && l && e.total > 0 && l.total > 0) {
        const earlyPct = (e.attended / e.total) * 100
        const latePct = (l.attended / l.total) * 100
        trendMap.set(id, Math.round((latePct - earlyPct) * 10) / 10)
      } else {
        trendMap.set(id, null)
      }
    }
  }

  // Build the at-risk list
  const atRiskStudents = []
  for (const student of studentRows) {
    const attn = attendanceMap.get(student.id)
    const attended = attn?.attended ?? 0
    const total = attn?.total ?? 0
    const pct = total > 0 ? (attended / total) * 100 : 0

    if (pct < threshold) {
      const subs = submissionMap.get(student.id)
      const submitted = subs?.count ?? 0
      const missed = totalAssignments - submitted

      atRiskStudents.push({
        studentId: student.id,
        name: student.name,
        email: student.email,
        attendancePercent: Math.round(pct * 10) / 10,
        totalSessions: total,
        presentCount: attended,
        missedSubmissions: missed < 0 ? 0 : missed,
        totalAssignments,
        averageMarks: subs?.avgMarks !== undefined && subs?.avgMarks !== null
          ? Math.round(subs.avgMarks * 10) / 10
          : null,
        trend: trendMap.get(student.id) ?? null,
      })
    }
  }

  // Sort by attendance % ascending (most at-risk first)
  atRiskStudents.sort((a, b) => a.attendancePercent - b.attendancePercent)

  return {
    batchId,
    threshold,
    students: atRiskStudents,
    generatedAt: new Date().toISOString(),
  }
}

// ─── CSV export: attendance ───────────────────────────────────────────────────

export async function streamAttendanceCsv(batchId: string, res: Response): Promise<void> {
  const db = getDb()

  const [batch] = await db.select().from(batches).where(eq(batches.id, batchId)).limit(1)
  if (!batch) throw HttpError.notFound('Batch not found')

  const date = new Date().toISOString().slice(0, 10)
  res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  res.setHeader('Content-Disposition', `attachment; filename="attendance-${batchId}-${date}.csv"`)

  // Header row
  res.write(
    csvRow([
      'studentId', 'studentEmail', 'studentName',
      'subjectId', 'subjectCode', 'subjectName',
      'sessionId', 'sessionDate',
      'status', 'markedAt',
    ]),
  )

  // Stream in subject-sized chunks to keep memory constant
  const subjectRows = await db
    .select({ id: subjects.id, name: subjects.name, code: subjects.code })
    .from(subjects)
    .where(eq(subjects.batchId, batchId))

  for (const subject of subjectRows) {
    const records = await db
      .select({
        studentId: profiles.id,
        studentEmail: profiles.email,
        studentName: profiles.name,
        sessionId: attendance.sessionId,
        sessionDate: classSessions.scheduledAt,
        status: attendance.status,
        markedAt: attendance.markedAt,
      })
      .from(attendance)
      .innerJoin(profiles, eq(attendance.studentId, profiles.id))
      .innerJoin(classSessions, eq(attendance.sessionId, classSessions.id))
      .where(eq(attendance.subjectId, subject.id))
      .orderBy(classSessions.scheduledAt, profiles.email)

    for (const r of records) {
      res.write(
        csvRow([
          r.studentId,
          r.studentEmail,
          r.studentName,
          subject.id,
          subject.code,
          subject.name,
          r.sessionId,
          r.sessionDate.toISOString(),
          r.status,
          r.markedAt.toISOString(),
        ]),
      )
    }
  }

  res.end()
}

// ─── CSV export: grades ───────────────────────────────────────────────────────

export async function streamGradesCsv(batchId: string, res: Response): Promise<void> {
  const db = getDb()

  const [batch] = await db.select().from(batches).where(eq(batches.id, batchId)).limit(1)
  if (!batch) throw HttpError.notFound('Batch not found')

  const date = new Date().toISOString().slice(0, 10)
  res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  res.setHeader('Content-Disposition', `attachment; filename="grades-${batchId}-${date}.csv"`)

  res.write(
    csvRow([
      'studentId', 'studentEmail', 'studentName',
      'assignmentId', 'assignmentTitle',
      'subjectId', 'subjectCode', 'subjectName',
      'submittedAt', 'status', 'marks', 'maxMarks',
      'feedback', 'gradedAt',
    ]),
  )

  // Narrow: get subjects in this batch first
  const subjectRows = await db
    .select({ id: subjects.id, name: subjects.name, code: subjects.code })
    .from(subjects)
    .where(eq(subjects.batchId, batchId))

  for (const subject of subjectRows) {
    const subjectAssignments = await db
      .select({ id: assignments.id, title: assignments.title, maxMarks: assignments.maxMarks })
      .from(assignments)
      .where(
        and(
          eq(assignments.subjectId, subject.id),
          eq(assignments.isPublished, true),
        ),
      )

    for (const assignment of subjectAssignments) {
      const rows = await db
        .select({
          studentId: profiles.id,
          studentEmail: profiles.email,
          studentName: profiles.name,
          submittedAt: submissions.submittedAt,
          status: submissions.status,
          marks: submissions.marks,
          feedback: submissions.feedback,
          gradedAt: submissions.gradedAt,
        })
        .from(submissions)
        .innerJoin(profiles, eq(submissions.studentId, profiles.id))
        .where(eq(submissions.assignmentId, assignment.id))
        .orderBy(profiles.email)

      for (const r of rows) {
        res.write(
          csvRow([
            r.studentId,
            r.studentEmail,
            r.studentName,
            assignment.id,
            assignment.title,
            subject.id,
            subject.code,
            subject.name,
            r.submittedAt.toISOString(),
            r.status,
            r.marks ?? '',
            assignment.maxMarks,
            r.feedback ?? '',
            r.gradedAt?.toISOString() ?? '',
          ]),
        )
      }
    }
  }

  res.end()
}
