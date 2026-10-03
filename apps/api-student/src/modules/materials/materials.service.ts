import { HttpError } from '@repo/http/http-error'
import { Material } from '@repo/models/material'
import type { ListMaterialsQuery, SearchMaterialsQuery } from '@repo/validation/materials'

/** Owner: Team 04 — Class Materials. */

export async function listMaterials(query: ListMaterialsQuery) {
  const { page = 1, limit = 20, subjectId, type, sessionId } = query

  const filter: Record<string, unknown> = {}
  if (subjectId) filter.subjectId = subjectId
  if (type) filter.type = type
  if (sessionId) filter.sessionId = sessionId

  const skip = (page - 1) * limit

  const [items, total] = await Promise.all([
    Material.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('subjectId', 'name code')
      .populate('uploadedBy', 'name role')
      .lean(),
    Material.countDocuments(filter),
  ])

  return {
    items,
    page,
    limit,
    total,
    hasMore: skip + items.length < total,
  }
}

export async function searchMaterials(query: SearchMaterialsQuery) {
  const { q, subjectId } = query

  const filter: Record<string, unknown> = {
    $or: [
      { title: { $regex: q, $options: 'i' } },
      { description: { $regex: q, $options: 'i' } },
    ],
  }
  if (subjectId) {
    filter.subjectId = subjectId
  }

  const items = await Material.find(filter)
    .sort({ createdAt: -1 })
    .limit(50)
    .populate('subjectId', 'name code')
    .populate('uploadedBy', 'name role')
    .lean()

  return items
}

export async function getMaterialById(id: string) {
  const material = await Material.findById(id)
    .populate('subjectId', 'name code')
    .populate('uploadedBy', 'name role')
    .lean()

  if (!material) {
    throw HttpError.notFound('Material not found')
  }

  return material
}
