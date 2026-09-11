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

export function searchMaterials(q: string) {
  return api.get<MaterialListResponse>(`/api/materials/search?q=${encodeURIComponent(q)}`)
}
