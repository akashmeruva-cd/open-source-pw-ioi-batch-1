import { createHmac, randomUUID } from 'node:crypto'
import request from 'supertest'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Role } from '@repo/validation/enums'
import { createApp } from '../../app'

/**
 * Owner: Team 12 — Admin Analytics & Reports.
 *
 * Batch dashboard endpoint tested against the DB-free engine in
 * src/test-utils/db-mock.ts. The seeded rows below produce hand-computable
 * numbers; the assertions validate what the endpoint reports.
 */

vi.mock('@repo/models/db', async () => {
  const { createDbMockModule } = await import('../../test-utils/db-mock.js')
  return createDbMockModule()
})

import * as dbModule from '@repo/models/db'
const store = (dbModule as unknown as { __store: Map<string, Row[]> }).__store

const app = createApp()

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

describe('GET /api/analytics/batch/:batchId', () => {
  it('returns average attendance, distribution, submission rate, marks and per-subject numbers', async () => {
    const batchId = randomUUID()
    const dbms = randomUUID()
    const os = randomUUID()
    const [s1, s2, s3, s4] = [randomUUID(), randomUUID(), randomUUID(), randomUUID()]

    seed('batches', [{ id: batchId, name: 'Batch A', year: 2026, program: 'B.Tech' }])
    seed('subjects', [
      { id: dbms, name: 'DBMS', code: 'CS202', batchId },
      { id: os, name: 'OS', code: 'CS203', batchId },
    ])
    seed('enrollments', [
      { studentId: s1, subjectId: dbms, batchId },
      { studentId: s2, subjectId: dbms, batchId },
      { studentId: s3, subjectId: dbms, batchId },
      { studentId: s4, subjectId: dbms, batchId },
      { studentId: s1, subjectId: os, batchId },
      { studentId: s2, subjectId: os, batchId },
    ])

    attendanceRows(dbms, s1, ['PRESENT', 'PRESENT', 'PRESENT', 'PRESENT'])
    attendanceRows(dbms, s2, ['PRESENT', 'PRESENT', 'ABSENT', 'ABSENT'])
    attendanceRows(dbms, s3, ['PRESENT', 'ABSENT', 'ABSENT', 'ABSENT'])
    attendanceRows(dbms, s4, ['ABSENT', 'ABSENT', 'ABSENT'])
    attendanceRows(os, s1, ['PRESENT', 'PRESENT'])
    attendanceRows(os, s2, ['ABSENT', 'ABSENT'])

    const a1 = randomUUID()
    const a3 = randomUUID()
    seed('assignments', [
      { id: a1, subjectId: dbms, title: 'DBMS 1' },
      { id: randomUUID(), subjectId: dbms, title: 'DBMS 2' },
      { id: a3, subjectId: os, title: 'OS 1' },
    ])
    seed('submissions', [
      { id: randomUUID(), assignmentId: a1, studentId: s1, status: 'GRADED', marks: 20 },
      { id: randomUUID(), assignmentId: a1, studentId: s2, status: 'GRADED', marks: 10 },
      { id: randomUUID(), assignmentId: a3, studentId: s1, status: 'SUBMITTED', marks: null },
    ])

    const res = await request(app)
      .get(`/api/analytics/batch/${batchId}`)
      .set('Authorization', `Bearer ${adminToken()}`)
      .expect(200)

    expect(res.body).toMatchObject({
      batchId,
      batchName: 'Batch A',
      studentCount: 4,
      attendance: {
        // per-student: 100, 33.3, 25, 0 -> mean 39.6
        averagePct: 39.6,
        distribution: [
          { bucket: '0-25', students: 1 },
          { bucket: '25-50', students: 2 },
          { bucket: '50-75', students: 0 },
          { bucket: '75-100', students: 1 },
        ],
      },
      submissions: { ratePct: 50, averageMarks: 15 },
    })
    expect(res.body.perSubject).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ subjectCode: 'CS202', attendancePct: 46.7, submissionRatePct: 50 }),
        expect.objectContaining({ subjectCode: 'CS203', attendancePct: 50, submissionRatePct: 50 }),
      ]),
    )
  })

  it('404s an unknown batch', async () => {
    await request(app)
      .get(`/api/analytics/batch/${randomUUID()}`)
      .set('Authorization', `Bearer ${adminToken()}`)
      .expect(404)
  })

  it('422s a malformed batch id', async () => {
    const res = await request(app)
      .get('/api/analytics/batch/not-a-uuid')
      .set('Authorization', `Bearer ${adminToken()}`)
      .expect(422)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })

  it('requires authentication', async () => {
    await request(app).get(`/api/analytics/batch/${randomUUID()}`).expect(401)
  })

  it('rejects a student token (403) — admin analytics are not student-visible', async () => {
    const res = await request(app)
      .get(`/api/analytics/batch/${randomUUID()}`)
      .set('Authorization', `Bearer ${signTestToken('STUDENT')}`)
      .expect(403)
    expect(res.body.error.code).toBe('FORBIDDEN')
  })
})

beforeEach(() => {
  store.clear()
})

type Row = Record<string, unknown>