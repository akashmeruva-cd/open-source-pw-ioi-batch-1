import request from 'supertest'
import { beforeEach, describe, expect, it } from 'vitest'
import { Batch } from '@repo/models/batch'
import { Material } from '@repo/models/material'
import { Subject } from '@repo/models/subject'
import { User } from '@repo/models/user'
import { createApp } from '../../app'

/** Owner: Team 04 — Class Materials. */

const app = createApp()

async function createTestData() {
  const batch = await Batch.create({
    name: 'CS 2026',
    year: 2026,
    program: 'B.Tech CSE',
    startDate: new Date('2026-01-01'),
  })

  const user = await User.create({
    name: 'Test Student',
    email: 'student_mat@college.edu',
    passwordHash: 'hash',
    role: 'STUDENT',
    batchId: batch._id,
  })

  const faculty = await User.create({
    name: 'Prof. Smith',
    email: 'faculty_mat@college.edu',
    passwordHash: 'hash',
    role: 'FACULTY',
  })

  const subject = await Subject.create({
    name: 'Data Structures',
    code: 'CS201',
    description: 'Core CS subject',
    batchId: batch._id,
    facultyId: faculty._id,
  })

  const material = await Material.create({
    subjectId: subject._id,
    title: 'Arrays & Vectors Deck',
    description: 'Lecture slides for Week 1',
    type: 'PPT',
    uploadedBy: faculty._id,
    cloudinary: {
      publicId: 'test/mat-1',
      url: 'https://res.cloudinary.com/demo/raw/upload/test/mat-1.pptx',
      bytes: 150000,
      format: 'pptx',
    },
  })

  // Register student user to receive token
  const loginRes = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'Test Student Reg',
      email: 'student_reg_mat@college.edu',
      password: 'password123',
    })

  const accessToken = loginRes.body.accessToken as string

  return { batch, user, faculty, subject, material, accessToken }
}

describe('GET /api/materials', () => {
  it('returns materials list for authenticated student', async () => {
    const { accessToken, subject } = await createTestData()

    const res = await request(app)
      .get(`/api/materials?subjectId=${subject._id.toString()}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)

    expect(res.body.items).toBeInstanceOf(Array)
    expect(res.body.items.length).toBeGreaterThanOrEqual(1)
    expect(res.body.items[0].title).toBe('Arrays & Vectors Deck')
  })

  it('401s without auth token', async () => {
    await request(app).get('/api/materials').expect(401)
  })

  it('422s with invalid subjectId parameter', async () => {
    const { accessToken } = await createTestData()

    const res = await request(app)
      .get('/api/materials?subjectId=invalid-id')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(422)

    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })
})

describe('GET /api/materials/search', () => {
  it('searches materials by query string', async () => {
    const { accessToken } = await createTestData()

    const res = await request(app)
      .get('/api/materials/search?q=Arrays')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)

    expect(res.body.items).toBeInstanceOf(Array)
    expect(res.body.items.some((m: any) => m.title.includes('Arrays'))).toBe(true)
  })

  it('422s on empty search query', async () => {
    const { accessToken } = await createTestData()

    await request(app)
      .get('/api/materials/search?q=')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(422)
  })
})

describe('GET /api/materials/:id', () => {
  it('returns material by ID', async () => {
    const { accessToken, material } = await createTestData()

    const res = await request(app)
      .get(`/api/materials/${material._id.toString()}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)

    expect(res.body.material._id).toBe(material._id.toString())
  })

  it('404s for non-existent material ID', async () => {
    const { accessToken } = await createTestData()

    await request(app)
      .get('/api/materials/000000000000000000000000')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(404)
  })
})
