import { HttpError } from '@repo/http/http-error'
import { and, desc, eq, getDb, ilike, inArray, or, sql } from '@repo/models/db'
import { enrollments, materials } from '@repo/models/schema'
import type { MaterialType } from '@repo/validation/enums'
import type {
  Material,
  MaterialListQuery,
  MaterialSearchQuery,
} from '@repo/validation/materials'

function toDto(m: typeof materials.$inferSelect): Material {
  return {
    id: m.id,
    subjectId: m.subjectId,
    sessionId: m.sessionId ?? null,
    title: m.title,
    description: m.description ?? null,
    type: m.type as MaterialType,
    file: m.file ?? null,
    externalUrl: m.externalUrl ?? null,
    uploadedBy: m.uploadedBy,
    createdAt: m.createdAt.toISOString(),
    updatedAt: m.updatedAt.toISOString(),
  }
}

async function getEnrolledSubjectIds(studentId: string): Promise<string[]> {
  try {
    const db = getDb()
    const rows = await db
      .select({ subjectId: enrollments.subjectId })
      .from(enrollments)
      .where(eq(enrollments.studentId, studentId))

    return rows.map((r) => r.subjectId)
  } catch {
    return []
  }
}

export async function listMaterialsForStudent(studentId: string, query: MaterialListQuery) {
  const allowed = await getEnrolledSubjectIds(studentId)

  if (query.subjectId && !allowed.includes(query.subjectId)) {
    throw HttpError.notFound('Subject not found')
  }

  if (allowed.length === 0) {
    return {
      items: [],
      page: query.page,
      limit: query.limit,
      total: 0,
      hasMore: false,
    }
  }

  try {
    const db = getDb()
    const conditions = [
      query.subjectId
        ? eq(materials.subjectId, query.subjectId)
        : inArray(materials.subjectId, allowed),
    ]

    if (query.type) {
      conditions.push(eq(materials.type, query.type))
    }
    if (query.sessionId) {
      conditions.push(eq(materials.sessionId, query.sessionId))
    }
    if (query.search) {
      conditions.push(
        or(
          ilike(materials.title, `%${query.search}%`),
          ilike(materials.description, `%${query.search}%`),
        )!,
      )
    }

    const whereClause = and(...conditions)
    const offset = (query.page - 1) * query.limit

    const [items, countResult] = await Promise.all([
      db
        .select()
        .from(materials)
        .where(whereClause)
        .orderBy(desc(materials.createdAt))
        .limit(query.limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(materials)
        .where(whereClause),
    ])

    const total = countResult[0]?.count ?? 0

    return {
      items: items.map(toDto),
      page: query.page,
      limit: query.limit,
      total,
      hasMore: offset + items.length < total,
    }
  } catch {
    return {
      items: [],
      page: query.page,
      limit: query.limit,
      total: 0,
      hasMore: false,
    }
  }
}

export async function searchMaterialsForStudent(
  studentId: string,
  query: MaterialSearchQuery,
) {
  const allowed = await getEnrolledSubjectIds(studentId)

  if (allowed.length === 0) {
    return {
      items: [],
      page: query.page,
      limit: query.limit,
      total: 0,
      hasMore: false,
    }
  }

  try {
    const db = getDb()
    const searchTerm = query.q.trim()
    const conditions = [inArray(materials.subjectId, allowed)]

    if (searchTerm) {
      conditions.push(
        or(
          ilike(materials.title, `%${searchTerm}%`),
          ilike(materials.description, `%${searchTerm}%`),
        )!,
      )
    }

    const whereClause = and(...conditions)
    const offset = (query.page - 1) * query.limit

    const [items, countResult] = await Promise.all([
      db
        .select()
        .from(materials)
        .where(whereClause)
        .orderBy(desc(materials.createdAt))
        .limit(query.limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(materials)
        .where(whereClause),
    ])

    const total = countResult[0]?.count ?? 0

    return {
      items: items.map(toDto),
      page: query.page,
      limit: query.limit,
      total,
      hasMore: offset + items.length < total,
    }
  } catch {
    return {
      items: [],
      page: query.page,
      limit: query.limit,
      total: 0,
      hasMore: false,
    }
  }
}

export async function getMaterialByIdForStudent(studentId: string, materialId: string) {
  const allowed = await getEnrolledSubjectIds(studentId)

  if (allowed.length === 0) {
    throw HttpError.notFound('Material not found')
  }

  try {
    const db = getDb()
    const [item] = await db
      .select()
      .from(materials)
      .where(and(eq(materials.id, materialId), inArray(materials.subjectId, allowed)))
      .limit(1)

    if (!item) {
      throw HttpError.notFound('Material not found')
    }

    return toDto(item)
  } catch (err) {
    if (err instanceof HttpError) throw err
    throw HttpError.notFound('Material not found')
  }
}
