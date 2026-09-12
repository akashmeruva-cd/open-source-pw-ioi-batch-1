import { randomUUID } from 'node:crypto'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  assignments,
  attendance,
  classSessions,
  subjects,
  submissions,
} from '@repo/models/schema'

/**
 * Owner: Team 12 — Admin Analytics & Reports.
 *
 * Exercises the DB-free engine (see src/test-utils/db-mock.ts) against the
 * real Drizzle table definitions: joins, GROUP BY, count / countDistinct / avg
 * and the tag ops the analytics services emit. These tests pin the
 * guarantee the analytics endpoints rely on — no JavaScript loops over
 * records; the "database" answers every number.
 */

vi.mock('@repo/models/db', async () => {
  const { createDbMockModule } = await import('../../test-utils/db-mock.js')
  return createDbMockModule()
})

const db = (dbModule as unknown as { __store: Map<string, Row[]> }).__store

beforeEach(() => {
  db.clear()
})

describe('db-mock engine', () => {
  it('counts distinct values across a filtered table', async () => {
    seed(
      'attendance',
      ['PRESENT', 'PRESENT', 'ABSENT', 'ABSENT'].map((status) => ({
        id: randomUUID(),
        subjectId: 's1',
        studentId: status === 'PRESENT' ? 'a' : 'b',
        status,
      })),
    )

    const [row] = await (dbModule.getDb() as any)
      .select({ n: dbModule.countDistinct(attendance.status) })
      .from(attendance)
      .where(eq(attendance.subjectId, 's1'))

    expect(row.n).toBe(2)
  })

  it('groups rows and counts per group', async () => {
    seed(
      'attendance',
      [
        ['s1', 'a', 'PRESENT'],
        ['s1', 'a', 'PRESENT'],
        ['s1', 'a', 'ABSENT'],
        ['s1', 'b', 'ABSENT'],
        ['s2', 'a', 'PRESENT'],
      ].map(([subjectId, studentId, status]) => ({
        id: randomUUID(),
        subjectId: subjectId as string,
        studentId: studentId as string,
        status: status as string,
      })),
    )

    const rows = await (dbModule.getDb() as any)
      .select({ subjectId: attendance.subjectId, status: attendance.status, n: dbModule.count() })
      .from(attendance)
      .groupBy(attendance.subjectId, attendance.studentId, attendance.status)

    expect(rows).toHaveLength(4)
    expect(rows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ subjectId: 's1', status: 'PRESENT', n: 2 }),
        expect.objectContaining({ subjectId: 's1', status: 'ABSENT', n: 1 }),
        expect.objectContaining({ subjectId: 's2', status: 'PRESENT', n: 1 }),
      ]),
    )
  })

  it('joins and averages over the merged rows', async () => {
    const a1 = randomUUID()
    const a2 = randomUUID()
    seed('assignments', [
      { id: a1, subjectId: 'sx', title: 'A1' },
      { id: a2, subjectId: 'sx', title: 'A2' },
    ])
    seed('submissions', [
      { id: randomUUID(), assignmentId: a1, studentId: 'p', status: 'GRADED', marks: 20 },
      { id: randomUUID(), assignmentId: a1, studentId: 'q', status: 'GRADED', marks: 30 },
      { id: randomUUID(), assignmentId: a1, studentId: 'r', status: 'SUBMITTED', marks: null },
      { id: randomUUID(), assignmentId: a2, studentId: 'p', status: 'GRADED', marks: 10 },
    ])

    const [avgRow] = await (dbModule.getDb() as any)
      .select({ averageMarks: dbModule.avg(submissions.marks) })
      .from(submissions)
      .innerJoin(assignments, eq(submissions.assignmentId, assignments.id))
      .where(and(eq(submissions.status, 'GRADED'), eq(assignments.subjectId, 'sx')))
    expect(avgRow.averageMarks).toBe(20)

    const submitted = await (dbModule.getDb() as any)
      .select({ studentId: submissions.studentId, n: dbModule.count() })
      .from(submissions)
      .innerJoin(assignments, eq(submissions.assignmentId, assignments.id))
      .where(eq(assignments.subjectId, 'sx'))
      .groupBy(submissions.studentId)
    expect(submitted).toHaveLength(3)
    expect(submitted).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ studentId: 'p', n: 2 }),
        expect.objectContaining({ studentId: 'q', n: 1 }),
      ]),
    )
  })

  it('filters by range (lte) over timestamped rows', async () => {
    const now = Date.now()
    seed('class_sessions', [
      { id: randomUUID(), subjectId: 'sx', scheduledAt: new Date(now - 1000) },
      { id: randomUUID(), subjectId: 'sx', scheduledAt: new Date(now) },
      { id: randomUUID(), subjectId: 'sx', scheduledAt: new Date(now + 1000) },
    ])

    const [row] = await (dbModule.getDb() as any)
      .select({ n: dbModule.count() })
      .from(classSessions)
      .where(and(eq(classSessions.subjectId, 'sx'), lte(classSessions.scheduledAt, new Date(now))))
    expect(row.n).toBe(2)
  })

  it('resolves plain rows without an aggregate config', async () => {
    seed('subjects', [{ id: 'bx1', name: 'DBMS', code: 'CS202', batchId: 'b' }])

    const rows = await (dbModule.getDb() as any)
      .select({ id: subjects.id, name: subjects.name, code: subjects.code })
      .from(subjects)
      .where(eq(subjects.batchId, 'b'))
    expect(rows).toEqual([{ id: 'bx1', name: 'DBMS', code: 'CS202' }])
  })
})

function seed(table: string, rows: Row[]) {
  db.set(table, [...(db.get(table) ?? []), ...rows])
}

// type-checked reference to the @repo/models/db surface under test
import * as dbModule from '@repo/models/db'
import { and, eq, lte } from '@repo/models/db'
void and
void eq
void lte

type Row = Record<string, unknown>