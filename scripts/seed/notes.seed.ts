import { getDb } from '@repo/models/db'
import { bookmarks, materials, notes } from '@repo/models/schema'
import type { CoreSeed } from './core.seed'

/**
 * Owner: Team 09 — Student Profile & Notes.
 */
export async function seedNotes(core: CoreSeed) {
  const db = getDb()
  const students = core.students.slice(0, 3)

  const noteValues = students.flatMap((student, i) =>
    core.subjects.slice(0, 3).map((subject, j) => ({
      studentId: student.id,
      subjectId: subject.id,
      sessionId: null,
      title: `${subject.code} — revision points`,
      body:
        j === 0
          ? 'Re-read the complexity table before the exam. Ask about amortised analysis.'
          : 'Practice questions from the end of the slide deck.',
      pinned: i === 0 && j === 0,
    })),
  )

  const insertedNotes = await db.insert(notes).values(noteValues).returning()

  // Bookmark the first two materials of each subject for the first student
  const matList = await db.select().from(materials).limit(6)
  const first = students[0]

  const bookmarkValues = first
    ? matList.slice(0, 4).map((m) => ({
        studentId: first.id,
        entityType: 'MATERIAL' as const,
        entityId: m.id,
      }))
    : []

  let bookmarkCount = 0
  if (bookmarkValues.length > 0) {
    const insertedBookmarks = await db.insert(bookmarks).values(bookmarkValues).returning()
    bookmarkCount = insertedBookmarks.length
  }

  return { notes: insertedNotes.length, bookmarks: bookmarkCount }
}
