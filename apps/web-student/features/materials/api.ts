import { api } from '@/lib/api-client'
import type { MaterialListResponse } from '@repo/validation/materials'

export function fetchMaterials(params?: {
  subjectId?: string
  type?: string
  search?: string
  page?: number
}) {
  const query = new URLSearchParams()
  if (params?.subjectId) query.set('subjectId', params.subjectId)
  if (params?.type) query.set('type', params.type)
  if (params?.search) query.set('search', params.search)
  if (params?.page) query.set('page', String(params.page))

  const qs = query.toString() ? `?${query.toString()}` : ''
  return api.get<MaterialListResponse>(`/api/materials${qs}`)
}

export function searchMaterials(
  q: string,
  params?: {
    subjectId?: string
    type?: string
    sessionId?: string
    page?: number
  },
) {
  const query = new URLSearchParams({ q })
  if (params?.subjectId) query.set('subjectId', params.subjectId)
  if (params?.type) query.set('type', params.type)
  if (params?.sessionId) query.set('sessionId', params.sessionId)
  if (params?.page) query.set('page', String(params.page))
  return api.get<MaterialListResponse>(`/api/materials/search?${query.toString()}`)
}
