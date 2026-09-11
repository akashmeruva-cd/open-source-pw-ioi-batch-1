import { api } from '@/lib/api-client'
import type {
  CreateMaterialInput,
  Material,
  MaterialListResponse,
  UpdateMaterialInput,
} from '@repo/validation/materials'

export function fetchAdminMaterials(params?: { subjectId?: string; search?: string }) {
  const query = new URLSearchParams()
  if (params?.subjectId) query.set('subjectId', params.subjectId)
  if (params?.search) query.set('search', params.search)
  const qs = query.toString() ? `?${query.toString()}` : ''
  return api.get<MaterialListResponse>(`/api/materials${qs}`)
}

export function requestUploadTicket(filename: string, contentType?: string) {
  return api.post<{
    method: 'POST' | 'PUT'
    uploadUrl: string
    fields: Record<string, string>
    key: string
  }>('/api/materials/upload-signature', { filename, contentType })
}

export function createMaterial(data: CreateMaterialInput) {
  return api.post<Material>('/api/materials', data)
}

export function updateMaterial(id: string, data: UpdateMaterialInput) {
  return api.patch<Material>(`/api/materials/${id}`, data)
}

export function deleteMaterial(id: string) {
  return api.delete<{ success: boolean }>(`/api/materials/${id}`)
}
