import { createHmac, randomUUID } from 'node:crypto'
import request from 'supertest'
import { describe, expect, it } from 'vitest'
import type { Role } from '@repo/validation/enums'
import { createApp } from '../../app'

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

describe('Admin Materials API', () => {
  it('401s without auth token', async () => {
    await request(app).get('/api/materials').expect(401)
  })

  it('403s for student token', async () => {
    const studentToken = signTestToken({
      sub: randomUUID(),
      role: 'STUDENT',
      email: 'student@college.edu',
    })

    await request(app)
      .get('/api/materials')
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(403)
  })

  it('allows access for FACULTY token and creates upload ticket', async () => {
    const facultyToken = signTestToken({
      sub: randomUUID(),
      role: 'FACULTY',
      email: 'faculty@college.edu',
    })

    const res = await request(app)
      .post('/api/materials/upload-signature')
      .set('Authorization', `Bearer ${facultyToken}`)
      .send({ filename: 'lecture1.pdf' })
      .expect(200)

    expect(res.body).toHaveProperty('uploadUrl')
    expect(res.body).toHaveProperty('key')
  })
})
