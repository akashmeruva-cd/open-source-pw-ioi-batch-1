import { createHmac, randomUUID } from 'node:crypto'
import request from 'supertest'
import { describe, expect, it } from 'vitest'
import type { Role } from '@repo/validation/enums'
import { createApp } from '../../app'
import { changeRoleService, deactivateUserService, activateUserService } from './users.service'

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
  const secret = process.env.SUPABASE_JWT_SECRET || 'test-jwt-secret-must-be-at-least-32-chars-long'
  const sig = createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url')
  return `${header}.${body}.${sig}`
}

/** Helper: create a test profile in the database */
async function createTestProfile(
  role: Role = 'STUDENT',
  isActive = true,
  name = 'Test User',
  email: string = `test-${randomUUID()}@example.com`,
) {
  const db = globalThis.db
  if (!db) throw new Error('Database not initialized')

  const [profile] = await db
    .insert(globalThis.profiles)
    .values({
      id: randomUUID(),
      name,
      email,
      role,
      isActive,
    })
    .returning()
  return profile
}

describe('POST /api/users/:id/role', () => {
  it('ADMIN successfully promotes a user to ADMIN', async () => {
    const admin = await createTestProfile('ADMIN')
    const student = await createTestProfile('STUDENT')

    const adminToken = signTestToken({
      sub: admin.id,
      role: 'ADMIN',
      email: admin.email,
    })

    await request(app)
      .post(`/api/users/${student.id}/role`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'ADMIN' })
      .expect(200)

    const updated = await globalThis.db
      .select()
      .from(globalThis.profiles)
      .where(eq(globalThis.profiles.id, student.id))
    expect(updated[0].role).toBe('ADMIN')
  })

  it('ADMIN successfully demotes a user to STUDENT', async () => {
    const admin = await createTestProfile('ADMIN')
    const faculty = await createTestProfile('FACULTY')

    const adminToken = signTestToken({
      sub: admin.id,
      role: 'ADMIN',
      email: admin.email,
    })

    await request(app)
      .post(`/api/users/${faculty.id}/role`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'STUDENT' })
      .expect(200)

    const updated = await globalThis.db
      .select()
      .from(globalThis.profiles)
      .where(eq(globalThis.profiles.id, faculty.id))
    expect(updated[0].role).toBe('STUDENT')
  })

  it('STUDENT cannot change a user role', async () => {
    const admin = await createTestProfile('ADMIN')
    const student = await createTestProfile('STUDENT')

    const studentToken = signTestToken({
      sub: student.id,
      role: 'STUDENT',
      email: student.email,
    })

    await request(app)
      .post(`/api/users/${student.id}/role`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ role: 'STUDENT' })
      .expect(403)
  })

  it('FACULTY cannot change a user role', async () => {
    const admin = await createTestProfile('ADMIN')
    const student = await createTestProfile('STUDENT')

    const facultyToken = signTestToken({
      sub: admin.id,
      role: 'FACULTY',
      email: admin.email,
    })

    await request(app)
      .post(`/api/users/${student.id}/role`)
      .set('Authorization', `Bearer ${facultyToken}`)
      .send({ role: 'STUDENT' })
      .expect(403)
  })

  it('unauthenticated request is rejected', async () => {
    const target = await createTestProfile('STUDENT')

    await request(app)
      .post(`/api/users/${target.id}/role`)
      .send({ role: 'STUDENT' })
      .expect(401)
  })

  it('ADMIN cannot demote themselves', async () => {
    const admin = await createTestProfile('ADMIN')

    const adminToken = signTestToken({
      sub: admin.id,
      role: 'ADMIN',
      email: admin.email,
    })

    await request(app)
      .post(`/api/users/${admin.id}/role`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'STUDENT' })
      .expect(403)
  })
})

describe('POST /api/users/:id/deactivate', () => {
  it('ADMIN successfully deactivates another user', async () => {
    const admin = await createTestProfile('ADMIN')
    const student = await createTestProfile('STUDENT', true)

    const adminToken = signTestToken({
      sub: admin.id,
      role: 'ADMIN',
      email: admin.email,
    })

    await request(app)
      .post(`/api/users/${student.id}/deactivate`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200)

    const updated = await globalThis.db
      .select()
      .from(globalThis.profiles)
      .where(eq(globalThis.profiles.id, student.id))
    expect(updated[0].isActive).toBe(false)
  })

  it('target user active status becomes inactive', async () => {
    const admin = await createTestProfile('ADMIN')
    const student = await createTestProfile('STUDENT', true)

    const adminToken = signTestToken({
      sub: admin.id,
      role: 'ADMIN',
      email: admin.email,
    })

    await request(app)
      .post(`/api/users/${student.id}/deactivate`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200)

    const updated = await globalThis.db
      .select()
      .from(globalThis.profiles)
      .where(eq(globalThis.profiles.id, student.id))
    expect(updated[0].isActive).toBe(false)
  })

  it('ADMIN cannot deactivate themselves', async () => {
    const admin = await createTestProfile('ADMIN')

    const adminToken = signTestToken({
      sub: admin.id,
      role: 'ADMIN',
      email: admin.email,
    })

    await request(app)
      .post(`/api/users/${admin.id}/deactivate`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(403)
  })

  it('unauthenticated request is rejected', async () => {
    const target = await createTestProfile('STUDENT', true)

    await request(app)
      .post(`/api/users/${target.id}/deactivate`)
      .expect(401)
  })

  it('non-ADMIN users are rejected', async () => {
    const admin = await createTestProfile('ADMIN')
    const student = await createTestProfile('STUDENT', true)

    const facultyToken = signTestToken({
      sub: admin.id,
      role: 'FACULTY',
      email: admin.email,
    })

    await request(app)
      .post(`/api/users/${student.id}/deactivate`)
      .set('Authorization', `Bearer ${facultyToken}`)
      .expect(403)
  })
})

describe('POST /api/users/:id/activate', () => {
  it('ADMIN successfully reactivates an inactive user', async () => {
    const admin = await createTestProfile('ADMIN')
    const student = await createTestProfile('STUDENT', false)

    const adminToken = signTestToken({
      sub: admin.id,
      role: 'ADMIN',
      email: admin.email,
    })

    await request(app)
      .post(`/api/users/${student.id}/activate`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200)

    const updated = await globalThis.db
      .select()
      .from(globalThis.profiles)
      .where(eq(globalThis.profiles.id, student.id))
    expect(updated[0].isActive).toBe(true)
  })

  it('target user active status becomes active', async () => {
    const admin = await createTestProfile('ADMIN')
    const student = await createTestProfile('STUDENT', false)

    const adminToken = signTestToken({
      sub: admin.id,
      role: 'ADMIN',
      email: admin.email,
    })

    await request(app)
      .post(`/api/users/${student.id}/activate`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200)

    const updated = await globalThis.db
      .select()
      .from(globalThis.profiles)
      .where(eq(globalThis.profiles.id, student.id))
    expect(updated[0].isActive).toBe(true)
  })

  it('unauthenticated request is rejected', async () => {
    const target = await createTestProfile('STUDENT', false)

    await request(app)
      .post(`/api/users/${target.id}/activate`)
      .expect(401)
  })

  it('non-ADMIN users are rejected', async () => {
    const admin = await createTestProfile('ADMIN')
    const student = await createTestProfile('STUDENT', false)

    const facultyToken = signTestToken({
      sub: admin.id,
      role: 'FACULTY',
      email: admin.email,
    })

    await request(app)
      .post(`/api/users/${student.id}/activate`)
      .set('Authorization', `Bearer ${facultyToken}`)
      .expect(403)
  })
})

describe('Audit logging', () => {
  it('successful role change is audited', async () => {
    const admin = await createTestProfile('ADMIN')
    const student = await createTestProfile('STUDENT')

    const adminToken = signTestToken({
      sub: admin.id,
      role: 'ADMIN',
      email: admin.email,
    })

    await request(app)
      .post(`/api/users/${student.id}/role`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'FACULTY' })
      .expect(200)

    const auditLogs = await globalThis.db
      .select()
      .from(globalThis.auditLogs)
      .where(eq(globalThis.auditLogs.entity, 'profiles'))
      .orderBy(globalThis.auditLogs.createdAt, 'desc')
    expect(auditLogs.length).toBeGreaterThan(0)
    expect(auditLogs[0].action).toBe('role_change')
    expect(auditLogs[0].meta?.newRole).toBe('FACULTY')
  })

  it('successful deactivation is audited', async () => {
    const admin = await createTestProfile('ADMIN')
    const student = await createTestProfile('STUDENT', true)

    const adminToken = signTestToken({
      sub: admin.id,
      role: 'ADMIN',
      email: admin.email,
    })

    await request(app)
      .post(`/api/users/${student.id}/deactivate`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200)

    const auditLogs = await globalThis.db
      .select()
      .from(globalThis.auditLogs)
      .where(eq(globalThis.auditLogs.entity, 'profiles'))
      .orderBy(globalThis.auditLogs.createdAt, 'desc')
    expect(auditLogs.length).toBeGreaterThan(0)
    expect(auditLogs[0].action).toBe('deactivate')
  })

  it('successful reactivation is audited', async () => {
    const admin = await createTestProfile('ADMIN')
    const student = await createTestProfile('STUDENT', false)

    const adminToken = signTestToken({
      sub: admin.id,
      role: 'ADMIN',
      email: admin.email,
    })

    await request(app)
      .post(`/api/users/${student.id}/activate`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200)

    const auditLogs = await globalThis.db
      .select()
      .from(globalThis.auditLogs)
      .where(eq(globalThis.auditLogs.entity, 'profiles'))
      .orderBy(globalThis.auditLogs.createdAt, 'desc')
    expect(auditLogs.length).toBeGreaterThan(0)
    expect(auditLogs[0].action).toBe('activate')
  })
})