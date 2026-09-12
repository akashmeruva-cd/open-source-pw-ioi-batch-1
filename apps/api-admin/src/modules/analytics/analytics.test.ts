import { createHmac, randomUUID } from 'node:crypto'
import request from 'supertest'
import { describe, expect, it } from 'vitest'
import type { Role } from '@repo/validation/enums'
import { createApp } from '../../app'

/**
 * Owner: Team 12 — Admin Analytics & Reports.
 *
 * Tests run against the seeded database. The seed produces:
 *   - 1 batch ("PW IOI Batch 1")
 *   - 40 students (student01–40@college.edu)
 *   - student04@college.edu is at index 3 → PRESENT only when sessionIndex % 3 === 0 → ~33.3%
 *
 * The at-risk test at 75% threshold MUST return student04.
 * These tests are DB-free for the route/auth layer; the seed-based assertion
 * runs only when DATABASE_URL is set.
 */

const app = createApp()

function signTestToken(payload: {
  sub: string
  role: Role
  email: string
  batchId?: string | null
}) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')
  const body = Buffer.from(
    JSON.stringify({
      sub: payload.sub,
      email: payload.email,
      role: 'authenticated',
      app_metadata: { role: payload.role, batch_id: payload.batchId ?? null },
      exp: Math.floor(Date.now() / 1000) + 3600,
    }),
  ).toString('base64url')
  const secret =
    process.env.SUPABASE_JWT_SECRET || 'test-jwt-secret-must-be-at-least-32-chars-long'
  const sig = createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url')
  return `${header}.${body}.${sig}`
}

const adminToken = signTestToken({ sub: randomUUID(), role: 'ADMIN', email: 'admin@college.edu' })
const studentToken = signTestToken({
  sub: randomUUID(),
  role: 'STUDENT',
  email: 'student@college.edu',
})

// ─── Auth guard ──────────────────────────────────────────────────────────────

describe('analytics auth guard', () => {
  it('401s a request with no token on /at-risk', async () => {
    await request(app)
      .get('/api/analytics/at-risk?batchId=' + randomUUID() + '&threshold=75')
      .expect(401)
  })

  it('403s a STUDENT token on /batch/:batchId', async () => {
    const res = await request(app)
      .get('/api/analytics/batch/' + randomUUID())
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(403)
    expect(res.body.error.code).toBe('FORBIDDEN')
  })

  it('403s a STUDENT token on /at-risk', async () => {
    const res = await request(app)
      .get('/api/analytics/at-risk?batchId=' + randomUUID() + '&threshold=75')
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(403)
    expect(res.body.error.code).toBe('FORBIDDEN')
  })
})

// ─── Validation (abuse cases) ────────────────────────────────────────────────

describe('analytics input validation', () => {
  it('422s /at-risk with no batchId', async () => {
    const res = await request(app)
      .get('/api/analytics/at-risk?threshold=75')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(422)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })

  it('422s /at-risk with threshold > 100', async () => {
    const res = await request(app)
      .get('/api/analytics/at-risk?batchId=' + randomUUID() + '&threshold=200')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(422)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })

  it('422s /batch/:batchId with a non-UUID', async () => {
    const res = await request(app)
      .get('/api/analytics/batch/not-a-uuid')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(422)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })

  it('422s /export/attendance.csv with no batchId', async () => {
    const res = await request(app)
      .get('/api/analytics/export/attendance.csv')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(422)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })
})

// ─── Seed-data happy path ─────────────────────────────────────────────────────

/**
 * These tests run only when a real DATABASE_URL is present (i.e. after npm run seed).
 * In CI without a DB they are skipped gracefully.
 */
const runSeedTests = Boolean(process.env.DATABASE_URL && process.env.SUPABASE_JWT_SECRET)

describe.skipIf(!runSeedTests)('at-risk happy path (seed data)', () => {
  it('returns student04@college.edu at the 75% threshold', async () => {
    // The seed creates exactly one batch — fetch its id dynamically.
    // We test against a known batchId set via SEED_BATCH_ID env var in CI,
    // or skip if not set.
    const batchId = process.env.SEED_BATCH_ID
    if (!batchId) return

    const res = await request(app)
      .get(`/api/analytics/at-risk?batchId=${batchId}&threshold=75`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200)

    const emails: string[] = res.body.students.map((s: { email: string }) => s.email)
    expect(emails).toContain('student04@college.edu')

    const student04 = res.body.students.find(
      (s: { email: string }) => s.email === 'student04@college.edu',
    )
    expect(student04.attendancePercent).toBeLessThan(75)
    expect(student04.attendancePercent).toBeGreaterThan(30) // ~33.3%

    // Sorted ascending (most at-risk first)
    const pcts: number[] = res.body.students.map((s: { attendancePercent: number }) => s.attendancePercent)
    const sorted = [...pcts].sort((a, b) => a - b)
    expect(pcts).toEqual(sorted)
  })
})
