import 'dotenv/config'
import { sql } from 'drizzle-orm'
import { disconnectFromDatabase, getDb } from '@repo/models/db'
import { SEED_PASSWORD, seedCore } from './core.seed'
import { seedMaterials } from './materials.seed'
import { seedAssignments } from './assignments.seed'
import { seedAttendance } from './attendance.seed'
import { seedAnnouncements } from './announcements.seed'
import { seedNotes } from './notes.seed'

/**
 * APPEND-ONLY — Team 01 owns this file; every team owns its own `*.seed.ts`.
 *
 * Run with `npm run seed` from the repo root. It **wipes the database first**,
 * which is why it refuses to touch anything that looks like production.
 */

function assertNotProduction(uri: string) {
  if (process.env.NODE_ENV === 'production' || /prod/i.test(uri)) {
    throw new Error(
      'Refusing to seed: this connection string looks like production. ' +
        'Point DATABASE_URL at your local/dev database.',
    )
  }
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set. Copy .env.example to .env and fill it in.')
  }

  assertNotProduction(databaseUrl)
  const db = getDb()

  console.log('Seeding PostgreSQL database — truncating existing tables first.')

  // Truncate all tables in cascade order
  await db.execute(sql`
    TRUNCATE TABLE
      conversation_messages,
      conversations,
      audit_logs,
      bookmarks,
      notes,
      notifications,
      announcements,
      submissions,
      assignments,
      materials,
      attendance,
      class_sessions,
      enrollments,
      subjects,
      batches,
      profiles
    CASCADE;
  `)

  const now = new Date()

  const core = await seedCore(now)
  const materials = await seedMaterials(core)
  const assignments = await seedAssignments(core, now)
  const attendance = await seedAttendance(core, now)
  const announcements = await seedAnnouncements(core, now)
  const notes = await seedNotes(core)

  console.log(
    [
      '',
      `  batch          ${core.batch.name}`,
      `  subjects       ${core.subjects.length}`,
      `  students       ${core.students.length}`,
      `  faculty        ${core.faculty.length}`,
      `  sessions       ${core.sessions.length} (${attendance.pastSessions} in the past)`,
      `  materials      ${materials.length}`,
      `  assignments    ${assignments.assignments.length}`,
      `  submissions    ${assignments.submissionCount}`,
      `  attendance     ${attendance.records}`,
      `  announcements  ${announcements.announcements}`,
      `  notifications  ${announcements.notifications}`,
      `  notes          ${notes.notes}`,
      `  bookmarks      ${notes.bookmarks}`,
      '',
      '  Sign in with any of these — password is the same for all:',
      `    admin       admin@college.edu     / ${SEED_PASSWORD}`,
      `    faculty     faculty1@college.edu  / ${SEED_PASSWORD}`,
      `    student     student01@college.edu / ${SEED_PASSWORD}`,
      '',
      '  student04@college.edu is deliberately below 75% attendance —',
      '  use them to test low-attendance warnings and the at-risk report.',
      '',
    ].join('\n'),
  )

  await disconnectFromDatabase()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
