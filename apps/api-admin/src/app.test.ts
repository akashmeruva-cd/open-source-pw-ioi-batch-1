import { createHmac, randomUUID } from 'node:crypto'
import request from 'supertest'
import { describe, expect, it } from 'vitest'
import type { Role } from '@repo/validation/enums'
import { createApp } from './app'

/**
 * LOCKED FILE — Team 01 + Team 03.
 *
 * This file exists to prove the one guarantee that justifies running `api-admin`
 * as a separate service: **a student token cannot reach admin functionality.**
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
  const secret = process.env.SUPABASE_JWT_SECRET || 'test-jwt-secret-must-be-at-least-32-chars-long'
  const sig = createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url')
  return `${header}.${body}.${sig}`
}

describe('admin role gate', () => {
  it('401s a request with no token', async () => {
    await request(app).get('/api/whoami').expect(401)
  })

  it('403s a STUDENT token', async () => {
    const token = signTestToken({
      sub: randomUUID(),
      role: 'STUDENT',
      email: 'student@college.edu',
    })

    const res = await request(app)
      .get('/api/whoami')
      .set('Authorization', `Bearer ${token}`)
      .expect(403)

    expect(res.body.error.code).toBe('FORBIDDEN')
  })

  it('allows FACULTY and ADMIN', async () => {
    const facultyToken = signTestToken({
      sub: randomUUID(),
      role: 'FACULTY',
      email: 'faculty@college.edu',
    })
    const adminToken = signTestToken({
      sub: randomUUID(),
      role: 'ADMIN',
      email: 'admin@college.edu',
    })

    await request(app).get('/api/whoami').set('Authorization', `Bearer ${facultyToken}`).expect(200)

    const res = await request(app)
      .get('/api/whoami')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200)

    expect(res.body.role).toBe('ADMIN')
  })
})

describe('POST /api/auth/login', () => {
  it('has no registration endpoint', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ name: 'Sneaky', email: 'sneaky@college.edu', password: 'correct horse battery' })
      .expect(404)
  })
})
