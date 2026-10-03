import request from 'supertest'
import { beforeEach, describe, expect, it } from 'vitest'
import { signAccessToken } from '@repo/auth/jwt'
import { Batch } from '@repo/models/batch'
import { Material } from '@repo/models/material'
import { Subject } from '@repo/models/subject'
import { User } from '@repo/models/user'
import { createApp } from '../../app'

/** Owner: Team 04 — Class Materials. */

const app = createApp()

async function createAdminTestData() {
  const batch = await Batch.create({
    name: 'CS 2026 Admin',
    year: 2026,
    program: 'B.Tech CSE',
    startDate: new Date('2026-01-01'),
  })

  const admin = await User.create({
    name: 'Admin User',
    email: 'admin_mat@college.edu',
    passwordHash: 'hash',
    role: 'ADMIN',
  })

  const student = await User.create({
    name: 'Student User',
    email: 'student_unauth@college.edu',
    passwordHash: 'hash',
    role: 'STUDENT',
  })

  const subject = await Subject.create({
    name: 'Operating Systems',
    code: 'CS203',
    description: 'Core CS subject',
    batchId: batch._id,
    facultyId: admin._id,
  })

  const adminToken = signAccessToken({ sub: admin._id.toString(), role: 'ADMIN', batchId: batch._id.toString() })
  const studentToken = signAccessToken({ sub: student._id.toString(), role: 'STUDENT', batchId: batch._id.toString() })

  return { batch, admin, student, subject, adminToken, studentToken }
}

describe('POST /api/materials/upload-signature', () => {
  it('generates an upload ticket without exposing API secrets', async () => {
    const { adminToken } = await createAdminTestData()

    const res = await request(app)
      .post('/api/materials/upload-signature')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ filename: 'lecture1.pdf', folder: 'materials' })
      .expect(200)

    expect(res.body.ticket).toBeDefined()
    expect(res.body.ticket.uploadUrl).toBeTypeOf('string')
    // Crucial check: secret MUST NOT be leaked anywhere in payload
    expect(JSON.stringify(res.body)).not.toContain(process.env.CLOUDINARY_API_SECRET ?? 'secret-should-not-exist')
  })
})

describe('POST /api/materials', () => {
  it('allows ADMIN to create a material', async () => {
    const { adminToken, subject } = await createAdminTestData()

    const res = await request(app)
      .post('/api/materials')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        subjectId: subject._id.toString(),
        title: 'Processes Slides',
        description: 'Chapter 2 slides',
        type: 'PDF',
        externalUrl: 'https://example.com/slides.pdf',
      })
      .expect(201)

    expect(res.body.material.title).toBe('Processes Slides')
  })

  it('rejects STUDENT role with 403 Forbidden', async () => {
    const { studentToken, subject } = await createAdminTestData()

    await request(app)
      .post('/api/materials')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        subjectId: subject._id.toString(),
        title: 'Hacked Material',
        type: 'PDF',
      })
      .expect(403)
  })
})

describe('PATCH & DELETE /api/materials/:id', () => {
  it('updates and deletes material', async () => {
    const { adminToken, subject, admin } = await createAdminTestData()

    const material = await Material.create({
      subjectId: subject._id,
      title: 'Initial Title',
      type: 'DOC',
      uploadedBy: admin._id,
    })

    const patchRes = await request(app)
      .patch(`/api/materials/${material._id.toString()}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Updated Title' })
      .expect(200)

    expect(patchRes.body.material.title).toBe('Updated Title')

    await request(app)
      .delete(`/api/materials/${material._id.toString()}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(204)

    const findDeleted = await Material.findById(material._id)
    expect(findDeleted).toBeNull()
  })
})
