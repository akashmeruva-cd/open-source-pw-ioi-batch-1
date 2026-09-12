import { createHmac, randomUUID } from 'node:crypto'
import request from 'supertest'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Role } from '@repo/validation/enums'
import { resetAi } from '@repo/services/ai'
import { createApp } from '../../app'
import { credentialsLimiterStore } from '../auth/auth.routes'
import { listUpcomingAssignmentsForStudent } from './assistant.service'

/**
 * Owner: Team 13 — AI Assistant.
 *
 * The most important thing to prove here is the security rule from #79: every
 * tool query is scoped to the caller, there is no studentId parameter, and the
 * caller never sees another student's assignments.
 *
 * The data layer is swapped for an in-memory store keyed by the real Drizzle
 * table objects, so the suite runs without a Postgres/Supabase connection —
 * CI has none. The store still evaluates the same predicate tree the production
 * queries build (and/eq/inArray/gte/lte), and every query's predicate is
 * captured for inspection, so the scoping claims are asserted for real.
 */

type Predicate =
  | { op: 'and'; children: Predicate[] }
  | { op: 'eq' | 'gte' | 'lte' | 'inArray'; field: string; value: unknown }

vi.mock('@repo/models/db', () => {
  const store = new Map<string, Record<string, unknown>[]>()
  const captured: { table: string; predicate: Predicate }[] = []

  const columnName = (column: unknown) => (column as { name: string }).name
  const toCamel = (field: string) => field.replace(/_([a-z])/g, (_m, c: string) => c.toUpperCase())

  function matches(row: Record<string, unknown>, predicate: Predicate): boolean {
    if (predicate.op === 'and') return predicate.children.every((c) => matches(row, c))
    const value = row[toCamel(predicate.field)]
    switch (predicate.op) {
      case 'eq':
        return value === predicate.value
      case 'inArray':
        return (predicate.value as unknown[]).includes(value)
      case 'gte':
        return (value as Date).getTime() >= (predicate.value as Date).getTime()
      case 'lte':
        return (value as Date).getTime() <= (predicate.value as Date).getTime()
    }
  }

  const op =
    (kind: 'eq' | 'gte' | 'lte' | 'inArray') =>
    (left: unknown, right: unknown): Predicate => ({
      op: kind,
      field: columnName(left),
      value: right,
    })

  function thenable(rows: Record<string, unknown>[]) {
    const result = { orderBy: () => result }
    Object.defineProperty(result, 'then', {
      value: (resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) =>
        Promise.resolve(rows).then(resolve, reject),
      enumerable: false,
    })
    return result as { orderBy: () => unknown } & PromiseLike<Record<string, unknown>[]>
  }

  const nameOfTable = (table: unknown) =>
    (table as { [key: PropertyKey]: unknown })[Symbol.for('drizzle:Name')]

  return {
    getDb: () => ({
      select: () => ({
        from: (table: unknown) => ({
          where: (predicate: Predicate) => {
            const tableName = nameOfTable(table) as string
            captured.push({ table: tableName, predicate })
            const rows = store.get(tableName) ?? []
            return thenable(rows.filter((row) => matches(row, predicate)))
          },
        }),
      }),
    }),
    eq: op('eq'),
    gte: op('gte'),
    lte: op('lte'),
    inArray: op('inArray'),
    and: (...children: Predicate[]) => ({ op: 'and', children }) as Predicate,
    asc: () => ({}),
    desc: () => ({}),
    or: (...children: Predicate[]) => ({ op: 'and', children }) as Predicate,
    not: () => ({}),
    notInArray: () => ({}),
    sql: () => ({}),
    getSupabaseAdmin: () => ({}),
    getSupabaseClient: () => ({}),
    disconnectFromDatabase: async () => {},
    __store: store,
    __captured: captured,
  }
})

// The real module has no such members; they are test fixtures exposed by the
// mock. Reading them through the module guarantees the seeded rows and the
// queries the service runs hit the very same store.
import * as dbModule from '@repo/models/db'

const mockDb = dbModule as unknown as {
  __store: Map<string, Record<string, unknown>[]>
  __captured: { table: string; predicate: Predicate }[]
}

const seeded = {
  store: mockDb.__store,
  captured: mockDb.__captured,
}

const app = createApp()

const DAY = 24 * 60 * 60 * 1000

function seed(row: { table: string; data: Record<string, unknown> }) {
  const rows = seeded.store.get(row.table) ?? []
  rows.push(row.data)
  seeded.store.set(row.table, rows)
}

function enroll(studentId: string, subjectId: string) {
  seed({ table: 'enrollments', data: { studentId, subjectId } })
}

function assignment(args: {
  subjectId: string
  title: string
  createdBy: string
  daysFromNow: number
  published?: boolean
}): string {
  const id = randomUUID()
  seed({
    table: 'assignments',
    data: {
      id,
      subjectId: args.subjectId,
      title: args.title,
      description: `description for ${args.title}`,
      dueAt: new Date(Date.now() + args.daysFromNow * DAY),
      maxMarks: 25,
      createdBy: args.createdBy,
      isPublished: args.published ?? true,
    },
  })
  return id
}

function submit(assignmentId: string, studentId: string) {
  seed({ table: 'submissions', data: { assignmentId, studentId } })
}

function findPredicate(predicate: Predicate, op: Predicate['op'], field: string): Predicate | null {
  if (predicate.op === op && (predicate.op === 'and' || predicate.field === field)) return predicate
  if (predicate.op === 'and') {
    for (const child of predicate.children) {
      const found = findPredicate(child, op, field)
      if (found) return found
    }
  }
  return null
}

function signTestToken(sub: string, role: Role = 'STUDENT') {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')
  const body = Buffer.from(
    JSON.stringify({
      sub,
      email: `${sub}@college.edu`,
      role: 'authenticated',
      app_metadata: { role, batch_id: null },
      exp: Math.floor(Date.now() / 1000) + 3600,
    }),
  ).toString('base64url')
  const secret = process.env.SUPABASE_JWT_SECRET || 'test-jwt-secret-must-be-at-least-32-chars-long'
  const sig = createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url')
  return `${header}.${body}.${sig}`
}

describe('listUpcomingAssignmentsForStudent (service)', () => {
  it('returns only published, due, unsubmitted assignments for enrolled subjects', async () => {
    const student = randomUUID()
    const subject = randomUUID()
    enroll(student, subject)

    const dueSoon = assignment({
      subjectId: subject,
      title: 'DBMS Assignment 1',
      createdBy: student,
      daysFromNow: 3,
    })
    assignment({
      subjectId: subject,
      title: 'DBMS Draft Assignment',
      createdBy: student,
      daysFromNow: 5,
      published: false,
    })
    assignment({
      subjectId: subject,
      title: 'DBMS Past Assignment',
      createdBy: student,
      daysFromNow: -2,
    })

    const items = await listUpcomingAssignmentsForStudent(student)

    expect(items).toHaveLength(1)
    expect(items[0]!.title).toBe('DBMS Assignment 1')
    expect(items[0]!.id).toBe(dueSoon)

    // The assignments query is scoped to the caller's enrolled subjects only.
    const assignmentQuery = seeded.captured.find((q) => q.table === 'assignments')
    const subjectFilter = findPredicate(assignmentQuery!.predicate, 'inArray', 'subject_id')
    expect(subjectFilter).not.toBeNull()
    expect((subjectFilter as { value: unknown[] }).value).toEqual([subject])
  })

  it('excludes an assignment the student has already submitted', async () => {
    const student = randomUUID()
    const subject = randomUUID()
    enroll(student, subject)

    const submittedA = assignment({
      subjectId: subject,
      title: 'OS Assignment A',
      createdBy: student,
      daysFromNow: 2,
    })
    assignment({
      subjectId: subject,
      title: 'OS Assignment B',
      createdBy: student,
      daysFromNow: 4,
    })
    submit(submittedA, student)

    const titles = (await listUpcomingAssignmentsForStudent(student)).map((i) => i.title)
    expect(titles).toContain('OS Assignment B')
    expect(titles).not.toContain('OS Assignment A')

    // The submissions query only looks up this student's, restricted to the
    // assignments that were found in the window.
    const submissionQuery = seeded.captured.find((q) => q.table === 'submissions')
    const studentFilter = findPredicate(submissionQuery!.predicate, 'eq', 'student_id')
    expect(studentFilter).not.toBeNull()
    const idFilter = findPredicate(submissionQuery!.predicate, 'inArray', 'assignment_id')
    expect(idFilter).not.toBeNull()
  })

  it('the days argument narrows the window', async () => {
    const student = randomUUID()
    const subject = randomUUID()
    enroll(student, subject)

    assignment({
      subjectId: subject,
      title: 'Networks Due in 3 days',
      createdBy: student,
      daysFromNow: 3,
    })
    assignment({
      subjectId: subject,
      title: 'Networks Due in 30 days',
      createdBy: student,
      daysFromNow: 30,
    })

    const week = await listUpcomingAssignmentsForStudent(student, 7)
    expect(week.map((i) => i.title)).toEqual(['Networks Due in 3 days'])

    const month = await listUpcomingAssignmentsForStudent(student, 45)
    expect(month).toHaveLength(2)
  })

  it('does not leak another student’s assignments (cross-student scoping)', async () => {
    const studentA = randomUUID()
    const studentB = randomUUID()
    const subjectA = randomUUID()
    const subjectB = randomUUID()
    enroll(studentA, subjectA)
    enroll(studentB, subjectB)

    assignment({
      subjectId: subjectA,
      title: 'Private Assignment for Alpha Only',
      createdBy: studentA,
      daysFromNow: 2,
    })
    assignment({
      subjectId: subjectB,
      title: 'Private Assignment for Beta Only',
      createdBy: studentB,
      daysFromNow: 2,
    })

    const forAlpha = await listUpcomingAssignmentsForStudent(studentA)
    const forBeta = await listUpcomingAssignmentsForStudent(studentB)

    expect(forAlpha.map((i) => i.title)).toEqual(['Private Assignment for Alpha Only'])
    expect(forBeta.map((i) => i.title)).toEqual(['Private Assignment for Beta Only'])
    expect(forAlpha.map((i) => i.title)).not.toContain('Private Assignment for Beta Only')
    expect(forBeta.map((i) => i.title)).not.toContain('Private Assignment for Alpha Only')
  })

  it('returns nothing for a student enrolled in no subjects', async () => {
    const items = await listUpcomingAssignmentsForStudent(randomUUID())
    expect(items).toEqual([])
  })
})

describe('POST /api/assistant/chat', () => {
  it('answers “what’s due this week?” with the caller’s real assignments (SSE)', async () => {
    const student = randomUUID()
    const subject = randomUUID()
    enroll(student, subject)
    assignment({
      subjectId: subject,
      title: 'Web Dev Assignment 1',
      createdBy: student,
      daysFromNow: 2,
    })

    const res = await request(app)
      .post('/api/assistant/chat')
      .set('Authorization', `Bearer ${signTestToken(student)}`)
      .send({ message: 'what is due this week?' })
      .expect('Content-Type', /text\/event-stream/)
      .expect(200)

    // The stub driver reports the real tool result, so the stream must contain
    // the actual assignment for this student.
    expect(res.text).toContain('Web Dev Assignment 1')
  })

  it('does not include another student’s assignment in a streamed answer', async () => {
    const caller = randomUUID()
    const other = randomUUID()
    const subjectForCaller = randomUUID()
    const subjectForOther = randomUUID()
    enroll(caller, subjectForCaller)
    enroll(other, subjectForOther)

    // A subject only the other student is enrolled in — so its assignments must
    // never appear in this caller's answer.
    assignment({
      subjectId: subjectForOther,
      title: 'Algorithms Sensitive Assignment',
      createdBy: other,
      daysFromNow: 2,
    })
    assignment({
      subjectId: subjectForCaller,
      title: 'Databases Assignment',
      createdBy: caller,
      daysFromNow: 2,
    })

    const res = await request(app)
      .post('/api/assistant/chat')
      .set('Authorization', `Bearer ${signTestToken(caller)}`)
      .send({ message: 'is there a due assignment?' })
      .expect(200)

    expect(res.text).toContain('Databases Assignment')
    expect(res.text).not.toContain('Algorithms Sensitive Assignment')

    // The assigned query never references the other student's subject.
    const assignmentQuery = seeded.captured.find((q) => q.table === 'assignments')
    const subjectFilter = findPredicate(assignmentQuery!.predicate, 'inArray', 'subject_id')
    expect((subjectFilter as { value: unknown[] }).value).not.toContain(subjectForOther)
  })

  it('401s without a token', async () => {
    await request(app)
      .post('/api/assistant/chat')
      .send({ message: 'what is due this week?' })
      .expect(401)
  })

  it('validates that message is required', async () => {
    const res = await request(app)
      .post('/api/assistant/chat')
      .set('Authorization', `Bearer ${signTestToken(randomUUID())}`)
      .send({})
      .expect(422)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })
})

beforeEach(async () => {
  resetAi()
  seeded.store.clear()
  seeded.captured.length = 0
  // The credential endpoints share a per-process limiter; reset it so any
  // auth calls in this file aren't throttled the way the auth tests are.
  await credentialsLimiterStore.resetAll?.()
})