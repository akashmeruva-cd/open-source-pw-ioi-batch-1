import { createHmac, randomUUID } from 'node:crypto'
import request from 'supertest'
import { beforeEach, describe, expect, it } from 'vitest'
import type { Role } from '@repo/validation/enums'
import { createApp } from '../../app'
import { credentialsLimiterStore } from './auth.routes'

/**
 * Owner: Team 03 — Auth & Identity.
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

beforeEach(async () => {
  await credentialsLimiterStore.resetAll?.()
})

const validUser = {
  name: 'Asha Rao',
  email: 'asha@college.edu',
  password: 'correct horse battery',
}

describe('POST /api/auth/register', () => {
  it('rejects a short password with 422', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...validUser, password: 'short' })
      .expect(422)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })

  it('rejects an invalid email with 422', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...validUser, email: 'not-an-email' })
      .expect(422)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })
})

describe('GET /api/auth/me', () => {
  it('401s without a token', async () => {
    await request(app).get('/api/auth/me').expect(401)
  })

  it('401s with a tampered token', async () => {
    const validToken = signTestToken({
      sub: randomUUID(),
      role: 'STUDENT',
      email: 'student@college.edu',
    })

    await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${validToken.slice(0, -2)}xx`)
      .expect(401)
  })
})

describe('brute-force protection', () => {
  it('429s after 10 failed attempts', async () => {
    for (let attempt = 0; attempt < 10; attempt++) {
      await request(app)
        .post('/api/auth/login')
        .send({ email: 'invalid-email-format', password: 'short' })
        .expect(422)
    }

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'invalid-email-format', password: 'short' })
      .expect(429)

    expect(res.body.error.code).toBe('RATE_LIMITED')
  })
})

// ─── Member B tests ──────────────────────────────────────────────────────────

describe('POST /api/auth/change-password', () => {
  it('401s when called without a token', async () => {
    await request(app)
      .post('/api/auth/change-password')
      .send({ oldPassword: 'old-pass-123', newPassword: 'new-pass-456' })
      .expect(401)
  })

  it('422s when body is missing required fields', async () => {
    const token = signTestToken({ sub: randomUUID(), role: 'STUDENT', email: 'a@college.edu' })
    const res = await request(app)
      .post('/api/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({ newPassword: 'no-old-password' })
      .expect(422)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })

  it('422s when newPassword is too short', async () => {
    const token = signTestToken({ sub: randomUUID(), role: 'STUDENT', email: 'a@college.edu' })
    const res = await request(app)
      .post('/api/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({ oldPassword: 'correct-old-pass', newPassword: 'short' })
      .expect(422)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })

  it('rejects abuse: wrong old password or unknown user', async () => {
    const token = signTestToken({ sub: randomUUID(), role: 'STUDENT', email: 'nobody@college.edu' })
    const res = await request(app)
      .post('/api/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({ oldPassword: 'wrong-password', newPassword: 'valid-new-password123' })
    
    // 404 if user not found, 400 if user exists but wrong password. Both are safe rejections.
    expect([400, 404]).toContain(res.status)
  })
})

describe('GET /api/auth/sessions', () => {
  it('401s when called without a token', async () => {
    await request(app).get('/api/auth/sessions').expect(401)
  })
})

describe('DELETE /api/auth/sessions', () => {
  it('401s when called without a token', async () => {
    await request(app).delete('/api/auth/sessions').expect(401)
  })
})

describe('POST /api/auth/password-reset/request', () => {
  it('422s when email is missing', async () => {
    const res = await request(app)
      .post('/api/auth/password-reset/request')
      .send({})
      .expect(422)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })

  it('422s when email is malformed', async () => {
    const res = await request(app)
      .post('/api/auth/password-reset/request')
      .send({ email: 'not-an-email' })
      .expect(422)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })

  it('returns 202 even for unknown emails to prevent enumeration abuse', async () => {
    await request(app)
      .post('/api/auth/password-reset/request')
      .send({ email: 'nobody@college.edu' })
      .expect(202)
  })
})

describe('POST /api/auth/password-reset/confirm', () => {
  it('422s when token or newPassword is missing', async () => {
    const res = await request(app)
      .post('/api/auth/password-reset/confirm')
      .send({ token: 'some-token' }) // missing newPassword
      .expect(422)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })

  it('422s when newPassword is too short', async () => {
    const res = await request(app)
      .post('/api/auth/password-reset/confirm')
      .send({ token: 'some-token', newPassword: 'short' })
      .expect(422)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })

  it('400s on abuse: invalid or already-used token', async () => {
    const res = await request(app)
      .post('/api/auth/password-reset/confirm')
      .send({ token: 'fake-or-used-token', newPassword: 'valid-new-password123' })
      .expect(400)
    
    expect(res.body.error.code).toBe('BAD_REQUEST')
  })
})
