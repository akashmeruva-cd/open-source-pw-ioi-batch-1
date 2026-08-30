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
