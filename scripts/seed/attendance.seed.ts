import { getDb } from '@repo/models/db'
import { attendance } from '@repo/models/schema'
import type { AttendanceStatus } from '@repo/validation/enums'
import type { CoreSeed } from './core.seed'

/**
 * Owner: Team 06 — Attendance.
 */
function statusFor(studentIndex: number, sessionIndex: number): AttendanceStatus {
  if (studentIndex === 3) return sessionIndex % 3 === 0 ? 'PRESENT' : 'ABSENT'

  const n = (studentIndex * 3 + sessionIndex * 5) % 11
  if (n === 0) return 'ABSENT'
  if (n === 1) return 'LATE'
  if (studentIndex % 17 === 0 && sessionIndex % 8 === 0) return 'EXCUSED'
  return 'PRESENT'
}

export async function seedAttendance(core: CoreSeed, now: Date) {
  const db = getDb()
  const pastSessions = core.sessions.filter((s) => s.scheduledAt.getTime() < now.getTime())

  const values = pastSessions.flatMap((session, sessionIndex) =>
    core.students.map((student, studentIndex) => ({
      sessionId: session.id,
      subjectId: session.subjectId,
      studentId: student.id,
      status: statusFor(studentIndex, sessionIndex),
      markedBy: session.facultyId ?? core.admin.id,
      markedAt: new Date(session.scheduledAt.getTime() + 10 * 60 * 1000),
      note: null,
    })),
  )

  if (values.length > 0) {
    await db.insert(attendance).values(values)
  }

  return { pastSessions: pastSessions.length, records: values.length }
}
