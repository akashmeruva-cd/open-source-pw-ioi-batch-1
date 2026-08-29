import request from 'supertest'
import { beforeEach, describe, expect, it } from 'vitest'
import { createApp } from '../../app'
import { resetAi } from '@repo/services/ai'
import { Assignment } from '@repo/models/assignment'
import { Batch } from '@repo/models/batch'
import { Enrollment } from '@repo/models/enrollment'
import { Subject } from '@repo/models/subject'
import { Submission } from '@repo/models/submission'
import { User } from '@repo/models/user'
import { credentialsLimiterStore } from '../auth/auth.routes'
import { listUpcomingAssignmentsForStudent } from './assistant.service'

/**
 * Owner: Team 13 — AI Assistant.
 *
 * The most important thing to prove here is the security rule from #79: every
 * tool query is scoped to the caller, there is no studentId parameter, and the
 * caller never sees another student's assignments.
 */

const app = createApp()

beforeEach(async () => {
  resetAi()
  // The credential endpoints share a per-process limiter; reset it so the
  // register/login calls in this file aren't throttled the way the auth tests are.
  await credentialsLimiterStore.resetAll?.()
})

const DAY = 24 * 60 * 60 * 1000

async function registerAndGetUser(name: string) {
  const email = `${name.replace(/\s+/g, '').toLowerCase()}@college.edu`
  await request(app)
    .post('/api/auth/register')
    .send({ name, email, password: 'password123' })
    .expect(201)
  const login = await request(app)
    .post('/api/auth/login')
    .send({ email, password: 'password123' })
    .expect(200)
  const user = await User.findOne({ email }).lean()
  return { token: login.body.accessToken as string, userId: user!._id.toString() }
}

async function seedSubject(batchId: string, name: string, code: string) {
  return Subject.create({ name, code, batchId, credits: 3 })
}

async function createAssignment(args: {
  subjectId: unknown
  title: string
  createdBy: string
  daysFromNow: number
  published?: boolean
}) {
  return Assignment.create({
    subjectId: args.subjectId,
    title: args.title,
    description: `description for ${args.title}`,
    dueAt: new Date(Date.now() + args.daysFromNow * DAY),
    maxMarks: 25,
    attachments: [],
    createdBy: args.createdBy,
    isPublished: args.published ?? true,
  })
}

describe('listUpcomingAssignmentsForStudent (service)', () => {
  it('returns only published, due, unsubmitted assignments for enrolled subjects', async () => {
    const user = await registerAndGetUser('Asha Rao')
    const batch = await Batch.create({
      name: 'Batch A',
      year: 2026,
      program: 'B.Tech',
      startDate: new Date(),
    })
    const subject = await seedSubject(batch._id.toString(), 'DBMS', 'CS202')
    await Enrollment.create({
      studentId: user.userId,
      subjectId: subject._id,
      batchId: batch._id,
    })

    const dueSoon = await createAssignment({
      subjectId: subject._id,
      title: 'DBMS Assignment 1',
      createdBy: user.userId,
      daysFromNow: 3,
    })
    await createAssignment({
      subjectId: subject._id,
      title: 'DBMS Draft Assignment',
      createdBy: user.userId,
      daysFromNow: 5,
      published: false,
    })
    await createAssignment({
      subjectId: subject._id,
      title: 'DBMS Past Assignment',
      createdBy: user.userId,
      daysFromNow: -2,
    })

    const items = await listUpcomingAssignmentsForStudent(user.userId)

    expect(items).toHaveLength(1)
    expect(items[0]!.title).toBe('DBMS Assignment 1')
    expect(items[0]!.id).toBe(dueSoon._id.toString())
  })

  it('excludes an assignment the student has already submitted', async () => {
    const user = await registerAndGetUser('Diya Verma')
    const batch = await Batch.create({
      name: 'Batch B',
      year: 2026,
      program: 'B.Tech',
      startDate: new Date(),
    })
    const subject = await seedSubject(batch._id.toString(), 'OS', 'CS203')
    await Enrollment.create({
      studentId: user.userId,
      subjectId: subject._id,
      batchId: batch._id,
    })

    const a = await createAssignment({
      subjectId: subject._id,
      title: 'OS Assignment A',
      createdBy: user.userId,
      daysFromNow: 2,
    })
    await createAssignment({
      subjectId: subject._id,
      title: 'OS Assignment B',
      createdBy: user.userId,
      daysFromNow: 4,
    })

    await Submission.create({
      assignmentId: a._id,
      studentId: user.userId,
      files: [],
      status: 'SUBMITTED',
    })

    const items = await listUpcomingAssignmentsForStudent(user.userId)
    const titles = items.map((i) => i.title)
    expect(titles).toContain('OS Assignment B')
    expect(titles).not.toContain('OS Assignment A')
  })

  it('the days argument narrows the window', async () => {
    const user = await registerAndGetUser('Rohan Iyer')
    const batch = await Batch.create({
      name: 'Batch C',
      year: 2026,
      program: 'B.Tech',
      startDate: new Date(),
    })
    const subject = await seedSubject(batch._id.toString(), 'Networks', 'CS204')
    await Enrollment.create({
      studentId: user.userId,
      subjectId: subject._id,
      batchId: batch._id,
    })

    await createAssignment({
      subjectId: subject._id,
      title: 'Networks Due in 3 days',
      createdBy: user.userId,
      daysFromNow: 3,
    })
    await createAssignment({
      subjectId: subject._id,
      title: 'Networks Due in 30 days',
      createdBy: user.userId,
      daysFromNow: 30,
    })

    const week = await listUpcomingAssignmentsForStudent(user.userId, 7)
    expect(week.map((i) => i.title)).toEqual(['Networks Due in 3 days'])

    const month = await listUpcomingAssignmentsForStudent(user.userId, 45)
    expect(month).toHaveLength(2)
  })

  it('does not leak another student’s assignments (cross-student scoping)', async () => {
    const studentA = await registerAndGetUser('Student Alpha')
    const studentB = await registerAndGetUser('Student Beta')
    const batchA = await Batch.create({
      name: 'Batch D1',
      year: 2026,
      program: 'B.Tech',
      startDate: new Date(),
    })
    const batchB = await Batch.create({
      name: 'Batch D2',
      year: 2026,
      program: 'B.Tech',
      startDate: new Date(),
    })
    const subjectA = await seedSubject(batchA._id.toString(), 'Maths', 'MA201')
    const subjectB = await seedSubject(batchB._id.toString(), 'Physics', 'PH101')
    // Each is enrolled in their own subject only.
    await Enrollment.create({
      studentId: studentA.userId,
      subjectId: subjectA._id,
      batchId: batchA._id,
    })
    await Enrollment.create({
      studentId: studentB.userId,
      subjectId: subjectB._id,
      batchId: batchB._id,
    })

    await createAssignment({
      subjectId: subjectA._id,
      title: 'Private Assignment for Alpha Only',
      createdBy: studentA.userId,
      daysFromNow: 2,
    })
    await createAssignment({
      subjectId: subjectB._id,
      title: 'Private Assignment for Beta Only',
      createdBy: studentB.userId,
      daysFromNow: 2,
    })

    const forAlpha = await listUpcomingAssignmentsForStudent(studentA.userId)
    const forBeta = await listUpcomingAssignmentsForStudent(studentB.userId)

    expect(forAlpha.map((i) => i.title)).toEqual(['Private Assignment for Alpha Only'])
    expect(forBeta.map((i) => i.title)).toEqual(['Private Assignment for Beta Only'])
    expect(forAlpha.map((i) => i.title)).not.toContain('Private Assignment for Beta Only')
    expect(forBeta.map((i) => i.title)).not.toContain('Private Assignment for Alpha Only')
  })

  it('returns nothing for a student enrolled in no subjects', async () => {
    const user = await registerAndGetUser('No Enrollment')
    const items = await listUpcomingAssignmentsForStudent(user.userId)
    expect(items).toEqual([])
  })
})

describe('POST /api/assistant/chat', () => {
  it('answers “what’s due this week?” with the caller’s real assignments (SSE)', async () => {
    const user = await registerAndGetUser('Kabir Rao')
    const batch = await Batch.create({
      name: 'Batch E',
      year: 2026,
      program: 'B.Tech',
      startDate: new Date(),
    })
    const subject = await seedSubject(batch._id.toString(), 'Web Dev', 'CS205')
    await Enrollment.create({
      studentId: user.userId,
      subjectId: subject._id,
      batchId: batch._id,
    })
    await createAssignment({
      subjectId: subject._id,
      title: 'Web Dev Assignment 1',
      createdBy: user.userId,
      daysFromNow: 2,
    })

    const res = await request(app)
      .post('/api/assistant/chat')
      .set('Authorization', `Bearer ${user.token}`)
      .send({ message: 'what is due this week?' })
      .expect('Content-Type', /text\/event-stream/)
      .expect(200)

    // The stub driver reports the real tool result, so the stream must contain
    // the actual assignment for this student.
    expect(res.text).toContain('Web Dev Assignment 1')
  })

  it('does not include another student’s assignment in a streamed answer', async () => {
    const other = await registerAndGetUser('Aarav Mehta')
    const user = await registerAndGetUser('Myra Gupta')
    const batchForOther = await Batch.create({
      name: 'Batch F1',
      year: 2026,
      program: 'B.Tech',
      startDate: new Date(),
    })
    // A subject only the other student is enrolled in — so its assignments must
    // never appear in this caller's answer.
    const subjectForOther = await seedSubject(batchForOther._id.toString(), 'Algorithms', 'CS201')
    await Enrollment.create({
      studentId: other.userId,
      subjectId: subjectForOther._id,
      batchId: batchForOther._id,
    })
    await createAssignment({
      subjectId: subjectForOther._id,
      title: 'Algorithms Sensitive Assignment',
      createdBy: other.userId,
      daysFromNow: 2,
    })

    const batchForUser = await Batch.create({
      name: 'Batch F2',
      year: 2026,
      program: 'B.Tech',
      startDate: new Date(),
    })
    const subjectForUser = await seedSubject(batchForUser._id.toString(), 'Databases', 'CS202')
    await Enrollment.create({
      studentId: user.userId,
      subjectId: subjectForUser._id,
      batchId: batchForUser._id,
    })

    const res = await request(app)
      .post('/api/assistant/chat')
      .set('Authorization', `Bearer ${user.token}`)
      .send({ message: 'is there a due assignment?' })
      .expect(200)

    expect(res.text).not.toContain('Algorithms Sensitive Assignment')
  })

  it('401s without a token', async () => {
    await request(app)
      .post('/api/assistant/chat')
      .send({ message: 'what is due this week?' })
      .expect(401)
  })

  it('validates that message is required', async () => {
    const user = await registerAndGetUser('Vihaan Nair')
    const res = await request(app)
      .post('/api/assistant/chat')
      .set('Authorization', `Bearer ${user.token}`)
      .send({})
      .expect(422)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })
})
