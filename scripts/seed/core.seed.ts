import { getDb, getSupabaseAdmin } from '@repo/models/db'
import { batches, classSessions, enrollments, profiles, subjects } from '@repo/models/schema'

/**
 * Owner: Team 01 (Core Platform).
 *
 * The foundation every other seeder builds on: one batch, six subjects, one
 * admin, three faculty, forty students, and four weeks of class sessions.
 *
 * Everything here is deterministic — same data every run.
 * Users are created in Supabase Auth and synced to the `profiles` table.
 */

export const SEED_PASSWORD = 'password123'

const SUBJECT_DEFS = [
  { name: 'Data Structures', code: 'CS201', credits: 4 },
  { name: 'Database Management Systems', code: 'CS202', credits: 4 },
  { name: 'Operating Systems', code: 'CS203', credits: 4 },
  { name: 'Computer Networks', code: 'CS204', credits: 3 },
  { name: 'Web Development', code: 'CS205', credits: 3 },
  { name: 'Discrete Mathematics', code: 'MA201', credits: 3 },
]

const FIRST_NAMES = [
  'Aarav',
  'Diya',
  'Vihaan',
  'Ananya',
  'Arjun',
  'Ishita',
  'Reyansh',
  'Saanvi',
  'Kabir',
  'Myra',
  'Aditya',
  'Aadhya',
  'Rohan',
  'Kiara',
  'Vivaan',
  'Anika',
  'Krishna',
  'Navya',
  'Ayaan',
  'Riya',
]

const LAST_NAMES = [
  'Sharma',
  'Verma',
  'Reddy',
  'Nair',
  'Iyer',
  'Patel',
  'Gupta',
  'Rao',
  'Singh',
  'Menon',
]

/** Monday of the week four weeks before `from`, at 09:00 local time. */
function startOfSeedTerm(from: Date): Date {
  const start = new Date(from)
  start.setDate(start.getDate() - 28)
  start.setHours(9, 0, 0, 0)
  const daysSinceMonday = (start.getDay() + 6) % 7
  start.setDate(start.getDate() - daysSinceMonday)
  return start
}

export async function seedCore(now: Date) {
  const db = getDb()
  const supabase = getSupabaseAdmin()

  // 1. Create Batch
  const [batch] = await db
    .insert(batches)
    .values({
      name: 'PW IOI Batch 1',
      year: now.getFullYear(),
      program: 'B.Tech Computer Science',
      startDate: startOfSeedTerm(now),
    })
    .returning()

  if (!batch) throw new Error('Failed to create batch')

  // Helper to create a user in Supabase Auth + profiles table
  async function createSeedUser(
    name: string,
    email: string,
    role: 'STUDENT' | 'FACULTY' | 'ADMIN',
  ) {
    // If user already exists in Supabase Auth, delete first
    const { data: existingList } = await supabase.auth.admin.listUsers()
    const existing = existingList?.users.find((u) => u.email === email)
    if (existing) {
      await supabase.auth.admin.deleteUser(existing.id)
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password: SEED_PASSWORD,
      email_confirm: true,
      user_metadata: { name },
      app_metadata: { role, batch_id: batch.id },
    })

    if (error || !data.user) {
      throw new Error(`Failed to create auth user ${email}: ${error?.message}`)
    }

    const [profile] = await db
      .insert(profiles)
      .values({
        id: data.user.id,
        name,
        email,
        role,
        batchId: batch.id,
      })
      .returning()

    if (!profile) throw new Error(`Failed to insert profile for ${email}`)
    return profile
  }

  // 2. Create Admin
  const admin = await createSeedUser('Priya Menon', 'admin@college.edu', 'ADMIN')

  // 3. Create Faculty
  const facultyNames = ['Anil Kumar', 'Sneha Joshi', 'Ravi Prasad']
  const faculty = await Promise.all(
    facultyNames.map((name, i) => createSeedUser(name, `faculty${i + 1}@college.edu`, 'FACULTY')),
  )

  // 4. Create Subjects
  const insertedSubjects = await db
    .insert(subjects)
    .values(
      SUBJECT_DEFS.map((subject, i) => ({
        name: subject.name,
        code: subject.code,
        credits: subject.credits,
        batchId: batch.id,
        facultyId: faculty[i % faculty.length]!.id,
      })),
    )
    .returning()

  // 5. Create Students
  const studentData = Array.from({ length: 40 }, (_, i) => {
    const first = FIRST_NAMES[i % FIRST_NAMES.length]!
    const last = LAST_NAMES[Math.floor(i / FIRST_NAMES.length) % LAST_NAMES.length]!
    return {
      name: `${first} ${last}`,
      email: `student${String(i + 1).padStart(2, '0')}@college.edu`,
    }
  })

  // Create students in batches of 5 to avoid throttling
  const students: (typeof profiles.$inferSelect)[] = []
  for (const s of studentData) {
    const student = await createSeedUser(s.name, s.email, 'STUDENT')
    students.push(student)
  }

  // 6. Enrollments: Everyone takes every subject
  await db.insert(enrollments).values(
    students.flatMap((student) =>
      insertedSubjects.map((subject) => ({
        studentId: student.id,
        subjectId: subject.id,
        batchId: batch.id,
      })),
    ),
  )

  // 7. Class Sessions
  const termStart = startOfSeedTerm(now)
  const sessionValues = insertedSubjects.flatMap((subject, subjectIndex) =>
    Array.from({ length: 8 }, (_, week) => {
      const scheduledAt = new Date(termStart)
      scheduledAt.setDate(termStart.getDate() + week * 7 + (subjectIndex % 5))
      scheduledAt.setHours(9 + Math.floor(subjectIndex / 5) * 2, 0, 0, 0)
      return {
        subjectId: subject.id,
        title: `${subject.name} — Week ${week + 1}`,
        scheduledAt,
        durationMins: 60,
        room: `LH-${101 + (subjectIndex % 6)}`,
        facultyId: subject.facultyId,
      }
    }),
  )

  const insertedSessions = await db.insert(classSessions).values(sessionValues).returning()

  return {
    batch,
    admin,
    faculty,
    subjects: insertedSubjects,
    students,
    sessions: insertedSessions,
  }
}

export type CoreSeed = Awaited<ReturnType<typeof seedCore>>
