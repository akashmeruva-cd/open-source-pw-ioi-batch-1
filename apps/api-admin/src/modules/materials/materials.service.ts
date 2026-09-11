import { HttpError } from '@repo/http/http-error'
import { and, desc, eq, getDb, ilike, or, sql } from '@repo/models/db'
import { materials } from '@repo/models/schema'
import { getStorage } from '@repo/services/storage'
import type { MaterialType } from '@repo/validation/enums'
import type {
  CreateMaterialInput,
  Material,
  MaterialListQuery,
  UpdateMaterialInput,
  UploadSignatureInput,
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

export async function createUploadTicket(input: UploadSignatureInput) {
  const storage = getStorage()
  return storage.createUploadTicket({
    folder: 'materials',
    filename: input.filename,
  })
}

export async function createMaterial(userId: string, input: CreateMaterialInput) {
  const db = getDb()

  let fileMeta = input.file ?? null
  if (fileMeta && (!fileMeta.url || fileMeta.url === '')) {
    const storage = getStorage()
    fileMeta = {
      ...fileMeta,
      url: storage.urlFor(fileMeta.key),
    }
  }

  const [inserted] = await db
    .insert(materials)
    .values({
      subjectId: input.subjectId,
      sessionId: input.sessionId ?? null,
      title: input.title,
      description: input.description ?? null,
      type: input.type,
      file: fileMeta,
      externalUrl: input.externalUrl ?? null,
      uploadedBy: userId,
    })
    .returning()

  if (!inserted) {
    throw new HttpError(500, 'INTERNAL_ERROR', 'Failed to create material')
  }

  return toDto(inserted)
}

export async function updateMaterial(id: string, input: UpdateMaterialInput) {
  const db = getDb()

  const [existing] = await db.select().from(materials).where(eq(materials.id, id)).limit(1)
  if (!existing) {
    throw HttpError.notFound('Material not found')
  }

  let fileMeta = input.file !== undefined ? input.file : existing.file
  if (fileMeta && (!fileMeta.url || fileMeta.url === '')) {
    const storage = getStorage()
    fileMeta = {
      ...fileMeta,
      url: storage.urlFor(fileMeta.key),
    }
  }

  const [updated] = await db
    .update(materials)
    .set({
      ...(input.subjectId !== undefined && { subjectId: input.subjectId }),
      ...(input.sessionId !== undefined && { sessionId: input.sessionId }),
      ...(input.title !== undefined && { title: input.title }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.type !== undefined && { type: input.type }),
      ...(input.file !== undefined && { file: fileMeta }),
      ...(input.externalUrl !== undefined && { externalUrl: input.externalUrl }),
      updatedAt: new Date(),
    })
    .where(eq(materials.id, id))
    .returning()

  if (!updated) {
    throw HttpError.notFound('Material not found')
  }

  return toDto(updated)
}

export async function deleteMaterial(id: string) {
  const db = getDb()

  const [existing] = await db.select().from(materials).where(eq(materials.id, id)).limit(1)
  if (!existing) {
    throw HttpError.notFound('Material not found')
  }

  if (existing.file?.key) {
    try {
      const storage = getStorage()
      await storage.remove(existing.file.key)
    } catch {
      // Ignore storage cleanup failures
    }
  }

  await db.delete(materials).where(eq(materials.id, id))
  return { success: true }
}

export async function listMaterials(query: MaterialListQuery) {
  try {
    const db = getDb()
    const conditions = []

    if (query.subjectId) {
      conditions.push(eq(materials.subjectId, query.subjectId))
    }
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

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined
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
