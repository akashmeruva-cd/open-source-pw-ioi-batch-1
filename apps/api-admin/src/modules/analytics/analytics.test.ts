import { createHmac, randomUUID } from 'node:crypto'
import request from 'supertest'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Role } from '@repo/validation/enums'
import { createApp } from '../../app'

/**
 * Owner: Team 12 — Admin Analytics & Reports.
 *
 * Runs against an in-memory store instead of Postgres so CI (which has no
 * database) can execute the suite. The store is not a set of canned answers:
 * it evaluates the same predicates, joins, GROUP BY and aggregates the
 * production service builds, so the numbers asserted below are genuinely
 * computed from the seeded rows.
 */

type Row = Record<string, unknown>

vi.mock('@repo/models/db', () => {
  const store = new Map<string, Row[]>()

  const camel = (s: string) => s.replace(/_([a-z])/g, (_m, c: string) => c.toUpperCase())
  const tableName = (t: unknown): string =>
    (t as Record<PropertyKey, string>)[Symbol.for('drizzle:Name')] ?? ''
  const colRef = (col: unknown): { table: string; field: string } => {
    const c = col as { table: unknown; name: string }
    return { table: tableName(c.table), field: camel(c.name) }
  }
  const keyOf = (ref: { table: string; field: string }) => `${ref.table}|${ref.field}`

  function matches(row: Map<string, unknown>, pred: any): boolean {
    if (pred.op === 'and') return pred.children.every((c: any) => matches(row, c))
    const left = row.get(keyOf(pred.left))
    if (pred.op === 'eq') return pred.rightCol ? left === row.get(keyOf(pred.rightCol)) : left === pred.value
    if (pred.op === 'inArray') return (pred.value as unknown[]).includes(left)
    if (pred.op === 'lte') return (left as any) <= (pred.value as any)
    if (pred.op === 'gte') return (left as any) >= (pred.value as any)
    return true
  }

  const eq = (left: unknown, right: unknown) =>
    right && typeof right === 'object' && 'table' in right
      ? { op: 'eq', left: colRef(left), rightCol: colRef(right) }
      : { op: 'eq', left: colRef(left), value: right }
  const inArray = (left: unknown, value: unknown[]) => ({ op: 'inArray', left: colRef(left), value })
  const lte = (left: unknown, value: unknown) => ({ op: 'lte', left: colRef(left), value })
  const gte = (left: unknown, value: unknown) => ({ op: 'gte', left: colRef(left), value })
  const and = (...children: unknown[]) => ({ op: 'and', children })
  const count = (col?: unknown) => ({ agg: 'count', col: col ? colRef(col) : null })
  const countDistinct = (col: unknown) => ({ agg: 'countDistinct', col: colRef(col) })
  const avg = (col: unknown) => ({ agg: 'avg', col: colRef(col) })

  function aggValue(spec: any, group: Map<string, unknown>[]): unknown {
    if (spec.agg === 'count') return group.length
    const values = group.map((r) => (spec.col ? r.get(keyOf(spec.col)) : undefined))
    if (spec.agg === 'countDistinct') {
      return new Set(values.filter((v) => v !== undefined && v !== null)).size
    }
    const nums = values.filter((v): v is number => typeof v === 'number')
    return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : null
  }

  function project(config: any, group: Map<string, unknown>[]): Row {
    const out: Row = {}
    const first = group[0] ?? new Map<string, unknown>()
    for (const [key, spec] of Object.entries(config)) {
      if (spec && typeof spec === 'object' && 'agg' in (spec as object)) {
        out[key] = aggValue(spec, group)
      } else {
        out[key] = first.get(keyOf(colRef(spec)))
      }
    }
    return out
  }

  function single(table: string, row: Row): Map<string, unknown> {
    const map = new Map<string, unknown>()
    for (const [k, v] of Object.entries(row)) map.set(`${table}|${k}`, v)
    return map
  }

  function finalize(
    from: unknown,
    joins: { other: unknown; on: any }[],
    pred: any,
    config: any,
    groupCols: unknown[] | undefined,
  ): Row[] {
    const fromName = tableName(from)
    const base = store.get(fromName) ?? []
    if (!config) return base.filter((r) => matches(single(fromName, r), pred))

    let merged = base.map((r) => single(fromName, r))
    for (const join of joins) {
      const otherName = tableName(join.other)
      const otherRows = store.get(otherName) ?? []
      const next: Map<string, unknown>[] = []
      for (const row of merged) {
        for (const other of otherRows) {
          const combined = new Map(row)
          for (const [k, v] of Object.entries(other)) combined.set(`${otherName}|${k}`, v)
          if (matches(combined, join.on)) next.push(combined)
        }
      }
      merged = next
    }
    merged = merged.filter((r) => matches(r, pred))

    const hasAggregate = Object.values(config).some(
      (v) => v && typeof v === 'object' && 'agg' in (v as object),
    )

    if (groupCols && groupCols.length > 0) {
      const groups = new Map<string, Map<string, unknown>[]>()
      for (const row of merged) {
        const key = groupCols.map((c) => String(row.get(keyOf(colRef(c))))).join('\u0000')
        const bucket = groups.get(key) ?? []
        bucket.push(row)
        groups.set(key, bucket)
      }
      return [...groups.values()].map((group) => project(config, group))
    }

    if (hasAggregate) return [project(config, merged)]
    return merged.map((row) => project(config, [row]))
  }

  const getDb = () => ({
    select: (config?: Record<string, unknown>) => {
      const joins: { other: unknown; on: any }[] = []
      const build = (from: unknown) => ({
        innerJoin: (other: unknown, on: any) => {
          joins.push({ other, on })
          return build(from)
        },
        where: (pred: any) => {
          const run = (groupCols?: unknown[]) => finalize(from, joins, pred, config, groupCols)
          const node = { groupBy: (...cols: unknown[]) => thenable(run(cols)) }
          Object.defineProperty(node, 'then', {
            value: (res: (v: Row[]) => unknown, rej?: (e: unknown) => unknown) =>
              Promise.resolve(run()).then(res, rej),
            enumerable: false,
          })
          return node
        },
      })
      return { from: (t: unknown) => build(t) }
    },
  })

  const thenable = (rows: Row[]) => {
    const result = {} as Record<string, unknown>
    Object.defineProperty(result, 'then', {
      value: (res: (v: Row[]) => unknown, rej?: (e: unknown) => unknown) =>
        Promise.resolve(rows).then(res, rej),
      enumerable: false,
    })
    return result
  }

  return {
    getDb,
    eq,
    and,
    or: and,
    inArray,
    lte,
    gte,
    not: () => ({}),
    notInArray: () => ({}),
    sql: () => ({}),
    desc: () => ({}),
    asc: () => ({}),
    count,
    countDistinct,
    avg,
    getSupabaseAdmin: () => ({}),
    getSupabaseClient: () => ({}),
    disconnectFromDatabase: async () => {},
    __store: store,
  }
})

// Fixtures exposed by the mock; reading through the module guarantees the
// seeded rows live in the same store the service queries.
import * as dbModule from '@repo/models/db'
const mockDb = dbModule as unknown as { __store: Map<string, Row[]> }
const store = mockDb.__store

const app = createApp()

const DAY = 24 * 60 * 60 * 1000

function seed(table: string, rows: Row[]) {
  store.set(table, [...(store.get(table) ?? []), ...rows])
}

function attendanceRows(subjectId: string, studentId: string, statuses: string[]) {
  seed(
    'attendance',
    statuses.map((status) => ({ id: randomUUID(), subjectId, studentId, status, sessionId: randomUUID() })),
  )
}

function signTestToken(role: Role) {
  const sub = randomUUID()
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')
  const body = Buffer.from(
    JSON.stringify({
      sub,
      email: `${role.toLowerCase()}@college.edu`,
      role: 'authenticated',
      app_metadata: { role, batch_id: null },
      exp: Math.floor(Date.now() / 1000) + 3600,
    }),
  ).toString('base64url')
  const secret = process.env.SUPABASE_JWT_SECRET || 'test-jwt-secret-must-be-at-least-32-chars-long'
  const sig = createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url')
  return `${header}.${body}.${sig}`
}

const adminToken = () => signTestToken('ADMIN')

describe('GET /api/analytics/batch/:batchId', () => {
  it('returns average attendance, distribution, submission rate, marks and per-subject numbers', async () => {
    const batchId = randomUUID()
    const dbms = randomUUID()
    const os = randomUUID()
    const [s1, s2, s3, s4] = [randomUUID(), randomUUID(), randomUUID(), randomUUID()]

    seed('batches', [{ id: batchId, name: 'Batch A', year: 2026, program: 'B.Tech' }])
    seed('subjects', [
      { id: dbms, name: 'DBMS', code: 'CS202', batchId },
      { id: os, name: 'OS', code: 'CS203', batchId },
    ])
    seed('enrollments', [
      { studentId: s1, subjectId: dbms, batchId },
      { studentId: s2, subjectId: dbms, batchId },
      { studentId: s3, subjectId: dbms, batchId },
      { studentId: s4, subjectId: dbms, batchId },
      { studentId: s1, subjectId: os, batchId },
      { studentId: s2, subjectId: os, batchId },
    ])

    attendanceRows(dbms, s1, ['PRESENT', 'PRESENT', 'PRESENT', 'PRESENT'])
    attendanceRows(dbms, s2, ['PRESENT', 'PRESENT', 'ABSENT', 'ABSENT'])
    attendanceRows(dbms, s3, ['PRESENT', 'ABSENT', 'ABSENT', 'ABSENT'])
    attendanceRows(dbms, s4, ['ABSENT', 'ABSENT', 'ABSENT'])
    attendanceRows(os, s1, ['PRESENT', 'PRESENT'])
    attendanceRows(os, s2, ['ABSENT', 'ABSENT'])

    const a1 = randomUUID()
    const a3 = randomUUID()
    seed('assignments', [
      { id: a1, subjectId: dbms, title: 'DBMS 1' },
      { id: randomUUID(), subjectId: dbms, title: 'DBMS 2' },
      { id: a3, subjectId: os, title: 'OS 1' },
    ])
    seed('submissions', [
      { id: randomUUID(), assignmentId: a1, studentId: s1, status: 'GRADED', marks: 20 },
      { id: randomUUID(), assignmentId: a1, studentId: s2, status: 'GRADED', marks: 10 },
      { id: randomUUID(), assignmentId: a3, studentId: s1, status: 'SUBMITTED', marks: null },
    ])

    const res = await request(app)
      .get(`/api/analytics/batch/${batchId}`)
      .set('Authorization', `Bearer ${adminToken()}`)
      .expect(200)

    expect(res.body).toMatchObject({
      batchId,
      batchName: 'Batch A',
      studentCount: 4,
      attendance: {
        // per-student: 100, 33.3, 25, 0 -> mean 39.6
        averagePct: 39.6,
        distribution: [
          { bucket: '0-25', students: 1 },
          { bucket: '25-50', students: 2 },
          { bucket: '50-75', students: 0 },
          { bucket: '75-100', students: 1 },
        ],
      },
      submissions: { ratePct: 50, averageMarks: 15 },
    })
    expect(res.body.perSubject).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ subjectCode: 'CS202', attendancePct: 46.7, submissionRatePct: 50 }),
        expect.objectContaining({ subjectCode: 'CS203', attendancePct: 50, submissionRatePct: 50 }),
      ]),
    )
  })

  it('404s an unknown batch', async () => {
    await request(app)
      .get(`/api/analytics/batch/${randomUUID()}`)
      .set('Authorization', `Bearer ${adminToken()}`)
      .expect(404)
  })

  it('422s a malformed batch id', async () => {
    const res = await request(app)
      .get('/api/analytics/batch/not-a-uuid')
      .set('Authorization', `Bearer ${adminToken()}`)
      .expect(422)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })

  it('requires authentication', async () => {
    await request(app).get(`/api/analytics/batch/${randomUUID()}`).expect(401)
  })

  it('rejects a student token (403) — admin analytics are not student-visible', async () => {
    const token = signTestToken('STUDENT')
    const res = await request(app)
      .get(`/api/analytics/batch/${randomUUID()}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(403)
    expect(res.body.error.code).toBe('FORBIDDEN')
  })
})

describe('GET /api/analytics/subject/:subjectId', () => {
  it('returns subject-level attendance, distribution, submission rate, marks and sessions held', async () => {
    const batchId = randomUUID()
    const subjectId = randomUUID()
    const [s1, s2, s3, s4] = [randomUUID(), randomUUID(), randomUUID(), randomUUID()]

    seed('subjects', [{ id: subjectId, name: 'DBMS', code: 'CS202', batchId }])
    seed('enrollments', [s1, s2, s3, s4].map((studentId) => ({ studentId, subjectId, batchId })))

    attendanceRows(subjectId, s1, ['PRESENT', 'PRESENT', 'PRESENT', 'PRESENT'])
    attendanceRows(subjectId, s2, ['PRESENT', 'PRESENT', 'ABSENT', 'ABSENT'])
    attendanceRows(subjectId, s3, ['PRESENT', 'ABSENT', 'ABSENT', 'ABSENT'])
    attendanceRows(subjectId, s4, ['ABSENT', 'ABSENT', 'ABSENT'])

    seed('class_sessions', [
      { id: randomUUID(), subjectId, scheduledAt: new Date(Date.now() - 3 * DAY) },
      { id: randomUUID(), subjectId, scheduledAt: new Date(Date.now() - 2 * DAY) },
      { id: randomUUID(), subjectId, scheduledAt: new Date(Date.now() - 1 * DAY) },
      { id: randomUUID(), subjectId, scheduledAt: new Date(Date.now() + 5 * DAY) },
    ])

    const a1 = randomUUID()
    seed('assignments', [
      { id: a1, subjectId, title: 'A1' },
      { id: randomUUID(), subjectId, title: 'A2' },
    ])
    seed('submissions', [
      { id: randomUUID(), assignmentId: a1, studentId: s1, status: 'GRADED', marks: 20 },
      { id: randomUUID(), assignmentId: a1, studentId: s2, status: 'GRADED', marks: 10 },
    ])

    const res = await request(app)
      .get(`/api/analytics/subject/${subjectId}`)
      .set('Authorization', `Bearer ${adminToken()}`)
      .expect(200)

    expect(res.body).toMatchObject({
      subjectId,
      subjectName: 'DBMS',
      subjectCode: 'CS202',
      studentCount: 4,
      attendance: {
        // per-student: 100, 50, 25, 0 -> mean 43.75 -> 43.8
        averagePct: 43.8,
        distribution: [
          { bucket: '0-25', students: 1 },
          { bucket: '25-50', students: 1 },
          { bucket: '50-75', students: 1 },
          { bucket: '75-100', students: 1 },
        ],
      },
      submissions: { ratePct: 50, averageMarks: 15 },
      sessionsHeld: 3,
    })
  })

  it('404s an unknown subject', async () => {
    await request(app)
      .get(`/api/analytics/subject/${randomUUID()}`)
      .set('Authorization', `Bearer ${adminToken()}`)
      .expect(404)
  })

  it('requires authentication', async () => {
    await request(app).get(`/api/analytics/subject/${randomUUID()}`).expect(401)
  })
})

beforeEach(() => {
  store.clear()
})