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

describe('GET /api/materials', () => {
  it('401s without a token', async () => {
    await request(app).get('/api/materials').expect(401)
  })

  it('404s for a subject the student is not enrolled in', async () => {
    const studentToken = signTestToken({
      sub: randomUUID(),
      role: 'STUDENT',
      email: 'student@college.edu',
    })
    const randomSubjectId = randomUUID()

    await request(app)
      .get(`/api/materials?subjectId=${randomSubjectId}`)
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(404)
  })

  it('returns materials list for an authenticated student', async () => {
    const studentToken = signTestToken({
      sub: randomUUID(),
      role: 'STUDENT',
      email: 'student@college.edu',
    })

    const res = await request(app)
      .get('/api/materials')
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(200)

    expect(res.body).toHaveProperty('items')
    expect(Array.isArray(res.body.items)).toBe(true)
    expect(res.body).toHaveProperty('total')
  })
})

describe('GET /api/materials/search', () => {
  it('401s without a token', async () => {
    await request(app).get('/api/materials/search?q=math').expect(401)
  })

  it('returns search results for authenticated student', async () => {
    const studentToken = signTestToken({
      sub: randomUUID(),
      role: 'STUDENT',
      email: 'student@college.edu',
    })

    const res = await request(app)
      .get('/api/materials/search?q=test')
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(200)

    expect(res.body).toHaveProperty('items')
  })
})
