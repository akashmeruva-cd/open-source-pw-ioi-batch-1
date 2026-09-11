import { z } from 'zod'
import { uuidSchema, paginatedSchema, paginationQuerySchema } from './common'
import { materialTypeSchema } from './enums'

/** Query params for GET /api/materials */
export const materialListQuerySchema = paginationQuerySchema.extend({
  subjectId: uuidSchema.optional(),
  type: materialTypeSchema.optional(),
  sessionId: uuidSchema.optional(),
  search: z.string().optional(),
})
export type MaterialListQuery = z.infer<typeof materialListQuerySchema>

/** Query params for GET /api/materials/search */
export const materialSearchQuerySchema = paginationQuerySchema.extend({
  q: z.string().default(''),
})
export type MaterialSearchQuery = z.infer<typeof materialSearchQuerySchema>

export const materialFileSchema = z.object({
  key: z.string(),
  url: z.string(),
  bytes: z.number(),
  format: z.string(),
})
export type MaterialFile = z.infer<typeof materialFileSchema>

export const materialSchema = z.object({
  id: uuidSchema,
  subjectId: uuidSchema,
  sessionId: uuidSchema.nullable(),
  title: z.string(),
  description: z.string().nullable(),
  type: materialTypeSchema,
  file: materialFileSchema.nullable(),
  externalUrl: z.string().nullable(),
  uploadedBy: uuidSchema,
  createdAt: z.string(),
  updatedAt: z.string().optional(),
})
export type Material = z.infer<typeof materialSchema>

export const materialListResponseSchema = paginatedSchema(materialSchema)
export type MaterialListResponse = z.infer<typeof materialListResponseSchema>

export const createMaterialSchema = z.object({
  subjectId: uuidSchema,
  sessionId: uuidSchema.optional().nullable(),
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().optional().nullable(),
  type: materialTypeSchema.default('OTHER'),
  file: materialFileSchema.optional().nullable(),
  externalUrl: z.string().url('Must be a valid URL').optional().nullable(),
})
export type CreateMaterialInput = z.infer<typeof createMaterialSchema>

export const updateMaterialSchema = createMaterialSchema.partial()
export type UpdateMaterialInput = z.infer<typeof updateMaterialSchema>

export const uploadSignatureSchema = z.object({
  filename: z.string().min(1),
  contentType: z.string().optional(),
  subjectId: uuidSchema.optional(),
})
export type UploadSignatureInput = z.infer<typeof uploadSignatureSchema>
