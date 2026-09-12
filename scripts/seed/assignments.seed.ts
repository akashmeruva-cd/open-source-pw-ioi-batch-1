import { getDb } from '@repo/models/db'
import { assignments, submissions } from '@repo/models/schema'
import type { CoreSeed } from './core.seed'

/**
 * Owner: Team 05 — Assignments & Submissions.
 */
export async function seedAssignments(core: CoreSeed, now: Date) {
  const db = getDb()

  const assignmentValues = core.subjects.flatMap((subject) =>
    [0, 1, 2].map((n) => {
      const dueAt = new Date(now)
      dueAt.setDate(dueAt.getDate() + (n === 0 ? -14 : n === 1 ? 3 : 21))
      dueAt.setHours(23, 59, 0, 0)

      return {
        subjectId: subject.id,
        title: `${subject.code} Assignment ${n + 1}`,
        description: `Complete the exercises for ${subject.name}, unit ${n + 1}. Submit a single PDF.`,
        dueAt,
        maxMarks: n === 0 ? 20 : 25,
        attachments: [],
        createdBy: subject.facultyId ?? core.admin.id,
        isPublished: n !== 2,
      }
    }),
  )

  const insertedAssignments = await db.insert(assignments).values(assignmentValues).returning()

  // Only closed assignments have graded submissions
  const closed = insertedAssignments.filter((a) => a.dueAt.getTime() < now.getTime())

  const submissionValues = closed.flatMap((assignment, assignmentIndex) =>
    core.students
      .filter((_, studentIndex) => (studentIndex * 7 + assignmentIndex * 3) % 13 !== 0)
      .map((student, i) => {
        const isLate = (i + assignmentIndex) % 9 === 0
        const submittedAt = new Date(assignment.dueAt)
        submittedAt.setHours(submittedAt.getHours() + (isLate ? 6 : -18))

        const marks = Math.round(assignment.maxMarks * (0.55 + ((i * 13) % 40) / 100))

        return {
          assignmentId: assignment.id,
          studentId: student.id,
          files: [
            {
              publicId: `submissions/sub-${assignment.id}-${student.id}`,
              url: `https://example-supabase-project.supabase.co/storage/v1/object/public/uploads/submissions/submission.pdf`,
              name: 'submission.pdf',
              bytes: 120_000 + i * 1_000,
            },
          ],
          note: null,
          submittedAt,
          status: 'GRADED' as const,
          marks,
          feedback:
            marks >= assignment.maxMarks * 0.8 ? 'Good work.' : 'Review the feedback in class.',
          gradedBy: assignment.createdBy,
          gradedAt: new Date(submittedAt.getTime() + 3 * 24 * 60 * 60 * 1000),
        }
      }),
  )

  if (submissionValues.length > 0) {
    await db.insert(submissions).values(submissionValues)
  }

  return { assignments: insertedAssignments, submissionCount: submissionValues.length }
}
