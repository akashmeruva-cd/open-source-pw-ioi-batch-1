import { createHmac, randomUUID } from 'node:crypto'
import request from 'supertest'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Role } from '@repo/validation/enums'
import { createApp } from '../../app'

/**
 * Owner: Team 12 — Admin Analytics & Reports.
 *
 * Subject analytics endpoint tested against the DB-free engine in
 * src/test-utils/db-mock.ts. The seeded rows produce hand-computable numbers;
 * the assertions validate what the endpoint reports.
 */

vi.mock('@repo/models/db', async () => {
  const { createDbMockModule } = await import('../../test-utils/db-mock.js')
  return createDbMockModule()
})

import * as dbModule from '@repo/models/db'
const store = (dbModule as unknown as { __store: Map<string, Row[]> }).__store

const app = createApp()

const DAY = 24 * 60 * 60 * 1000

function seed(table: string, rows: Row[]) {
  store.set(table, [...(store.get(table) ?? []), ...rows])
}

function attendanceRows(subjectId: string, studentId: string, statuses: string[]) {
  seed(
    'attendance',
    statuses.map((status) => ({ id: randomUUID(), subjectId, studentId, status, sessionId: randomUUID() })),
  )
}

function signTestToken(role: Role) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')
  const body = Buffer.from(
    JSON.stringify({
      sub: randomUUID(),
      email: `${role.toLowerCase()}@college.edu`,
      role: 'authenticated',
      app_metadata: { role, batch_id: null },
      exp: Math.floor(Date.now() / 1000) + 3600,
    }),
  ).toString('base64url')
  const secret = process.env.SUPABASE_JWT_SECRET || 'test-jwt-secret-must-be-at-least-32-chars-long'
  const sig = createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url')
  return `${header}.${body}.${sig}`
}

const adminToken = () => signTestToken('ADMIN')

describe('GET /api/analytics/subject/:subjectId', () => {
  it('returns subject attendance, distribution, submission rate, marks and sessions held', async () => {
    const batchId = randomUUID()
    const subjectId = randomUUID()
    const [s1, s2, s3, s4] = [randomUUID(), randomUUID(), randomUUID(), randomUUID()]

    seed('subjects', [{ id: subjectId, name: 'DBMS', code: 'CS202', batchId }])
    seed('enrollments', [s1, s2, s3, s4].map((studentId) => ({ studentId, subjectId, batchId })))

    attendanceRows(subjectId, s1, ['PRESENT', 'PRESENT', 'PRESENT', 'PRESENT'])
    attendanceRows(subjectId, s2, ['PRESENT', 'PRESENT', 'ABSENT', 'ABSENT'])
    attendanceRows(subjectId, s3, ['PRESENT', 'ABSENT', 'ABSENT', 'ABSENT'])
    attendanceRows(subjectId, s4, ['ABSENT', 'ABSENT', 'ABSENT'])

    seed('class_sessions', [
      { id: randomUUID(), subjectId, scheduledAt: new Date(Date.now() - 3 * DAY) },
      { id: randomUUID(), subjectId, scheduledAt: new Date(Date.now() - 2 * DAY) },
      { id: randomUUID(), subjectId, scheduledAt: new Date(Date.now() - 1 * DAY) },
      { id: randomUUID(), subjectId, scheduledAt: new Date(Date.now() + 5 * DAY) },
    ])

    const a1 = randomUUID()
    seed('assignments', [
      { id: a1, subjectId, title: 'A1' },
      { id: randomUUID(), subjectId, title: 'A2' },
    ])
    seed('submissions', [
      { id: randomUUID(), assignmentId: a1, studentId: s1, status: 'GRADED', marks: 20 },
      { id: randomUUID(), assignmentId: a1, studentId: s2, status: 'GRADED', marks: 10 },
    ])

    const res = await request(app)
      .get(`/api/analytics/subject/${subjectId}`)
      .set('Authorization', `Bearer ${adminToken()}`)
      .expect(200)

    expect(res.body).toMatchObject({
      subjectId,
      subjectName: 'DBMS',
      subjectCode: 'CS202',
      studentCount: 4,
      attendance: {
        // per-student: 100, 50, 25, 0 -> mean 43.75 -> 43.8
        averagePct: 43.8,
        distribution: [
          { bucket: '0-25', students: 1 },
          { bucket: '25-50', students: 1 },
          { bucket: '50-75', students: 1 },
          { bucket: '75-100', students: 1 },
        ],
      },
      submissions: { ratePct: 50, averageMarks: 15 },
      sessionsHeld: 3,
    })
  })

  it('404s an unknown subject', async () => {
    await request(app)
      .get(`/api/analytics/subject/${randomUUID()}`)
      .set('Authorization', `Bearer ${adminToken()}`)
      .expect(404)
  })

  it('422s a malformed subject id', async () => {
    const res = await request(app)
      .get('/api/analytics/subject/not-a-uuid')
      .set('Authorization', `Bearer ${adminToken()}`)
      .expect(422)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })

  it('requires authentication', async () => {
    await request(app).get(`/api/analytics/subject/${randomUUID()}`).expect(401)
  })

  it('rejects a student token (403) — admin analytics are not student-visible', async () => {
    const res = await request(app)
      .get(`/api/analytics/subject/${randomUUID()}`)
      .set('Authorization', `Bearer ${signTestToken('STUDENT')}`)
      .expect(403)
    expect(res.body.error.code).toBe('FORBIDDEN')
  })
})

beforeEach(() => {
  store.clear()
})

type Row = Record<string, unknown>