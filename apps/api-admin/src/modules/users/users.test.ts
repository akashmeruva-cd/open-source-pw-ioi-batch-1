import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { hashPassword } from '@repo/auth/password'
import { signAccessToken } from '@repo/auth/jwt'
import { User } from '@repo/models/user'
import type { Role } from '@repo/validation/enums'
import { createApp } from '../../app'

const app = createApp()

async function createUser(role: Role, email: string) {
  const user = await User.create({
    name: `${role} user`,
    email,
    passwordHash: await hashPassword('correct horse battery'),
    role,
  })
  const token = signAccessToken({ sub: user._id.toString(), role, batchId: null })
  return { user, token }
}

describe('Users API', () => {
  it('GET /api/users - lists users and excludes passwordHash', async () => {
    const admin = await createUser('ADMIN', 'admin1@college.edu')
    await createUser('STUDENT', 'student1@college.edu')

    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${admin.token}`)
      .expect(200)

    expect(res.body.items.length).toBeGreaterThanOrEqual(2)
    // Check that passwordHash is explicitly missing
    for (const user of res.body.items) {
      expect(user).not.toHaveProperty('passwordHash')
    }
  })

  it('GET /api/users - filters by role', async () => {
    const admin = await createUser('ADMIN', 'admin2@college.edu')
    await createUser('STUDENT', 'student2@college.edu')

    const res = await request(app)
      .get('/api/users?role=STUDENT')
      .set('Authorization', `Bearer ${admin.token}`)
      .expect(200)

    expect(res.body.items.length).toBeGreaterThanOrEqual(1)
    for (const user of res.body.items) {
      expect(user.role).toBe('STUDENT')
    }
  })

  it('POST /api/users - allows ADMIN to create users, full payload validation', async () => {
    const admin = await createUser('ADMIN', 'admin3@college.edu')

    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({
        name: 'New Faculty',
        email: 'newfaculty@college.edu',
        password: 'securepassword123',
        role: 'FACULTY',
      })
      .expect(201)

    expect(res.body.name).toBe('New Faculty')
    expect(res.body.email).toBe('newfaculty@college.edu')
    expect(res.body.role).toBe('FACULTY')
    expect(res.body).not.toHaveProperty('passwordHash')

    // Validation failure check
    await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({
        name: 'Short', // fine
        email: 'not-an-email',
        password: 'short', // invalid
        role: 'FACULTY',
      })
      .expect(422)
  })

  it('POST /api/users - prevents FACULTY from creating users', async () => {
    const faculty = await createUser('FACULTY', 'faculty1@college.edu')

    await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${faculty.token}`)
      .send({
        name: 'Another User',
        email: 'another@college.edu',
        password: 'securepassword123',
        role: 'STUDENT',
      })
      .expect(403) // because only ADMIN is allowed via requireRole('ADMIN')
  })

  it('PATCH /api/users/:id - allows ADMIN to update details', async () => {
    const admin = await createUser('ADMIN', 'admin4@college.edu')
    const student = await createUser('STUDENT', 'student3@college.edu')

    const res = await request(app)
      .patch(`/api/users/${student.user._id}`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ name: 'Updated Name', isActive: false })
      .expect(200)

    expect(res.body.name).toBe('Updated Name')
    expect(res.body.isActive).toBeUndefined() // Since we map to PublicUser, isActive might not be returned.

    // Verify in db
    const dbUser = await User.findById(student.user._id)
    expect(dbUser?.isActive).toBe(false)
  })

  it('POST /api/users/:id/reset-password - allows ADMIN to reset password securely', async () => {
    const admin = await createUser('ADMIN', 'admin5@college.edu')
    const target = await createUser('STUDENT', 'student4@college.edu')
    const oldHash = target.user.passwordHash

    const res = await request(app)
      .post(`/api/users/${target.user._id}/reset-password`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ password: 'newsecurepassword123' })
      .expect(200)

    expect(res.body).not.toHaveProperty('passwordHash')

    const dbUser = await User.findById(target.user._id).select('+passwordHash')
    expect(dbUser?.passwordHash).not.toBe(oldHash)
    expect(dbUser?.passwordHash).not.toBe('newsecurepassword123') // should be hashed
  })
})
