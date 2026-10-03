import { z } from 'zod'
import { objectIdSchema, paginationQuerySchema } from './common'
import { materialTypeSchema } from './enums'

/** Owner: Team 04 — Class Materials. */

export const listMaterialsQuerySchema = paginationQuerySchema.extend({
  subjectId: objectIdSchema.optional(),
  type: materialTypeSchema.optional(),
  sessionId: objectIdSchema.optional(),
})
export type ListMaterialsQuery = z.infer<typeof listMaterialsQuerySchema>

export const searchMaterialsQuerySchema = z.object({
  q: z.string().trim().min(1, 'Search query cannot be empty'),
  subjectId: objectIdSchema.optional(),
})
export type SearchMaterialsQuery = z.infer<typeof searchMaterialsQuerySchema>

export const materialIdParamsSchema = z.object({
  id: objectIdSchema,
})
export type MaterialIdParams = z.infer<typeof materialIdParamsSchema>

export const uploadSignatureSchema = z.object({
  filename: z.string().trim().min(1, 'Filename is required'),
  folder: z.string().trim().default('materials'),
})
export type UploadSignatureInput = z.infer<typeof uploadSignatureSchema>

export const createMaterialSchema = z.object({
  subjectId: objectIdSchema,
  sessionId: objectIdSchema.nullable().optional(),
  title: z.string().trim().min(1, 'Title is required').max(200),
  description: z.string().trim().nullable().optional(),
  type: materialTypeSchema,
  cloudinary: z
    .object({
      publicId: z.string().min(1),
      url: z.string().url(),
      bytes: z.number().positive(),
      format: z.string().min(1),
    })
    .nullable()
    .optional(),
  externalUrl: z.string().url().nullable().optional(),
})
export type CreateMaterialInput = z.infer<typeof createMaterialSchema>

export const updateMaterialSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().nullable().optional(),
  type: materialTypeSchema.optional(),
  sessionId: objectIdSchema.nullable().optional(),
  externalUrl: z.string().url().nullable().optional(),
  cloudinary: z
    .object({
      publicId: z.string().min(1),
      url: z.string().url(),
      bytes: z.number().positive(),
      format: z.string().min(1),
    })
    .nullable()
    .optional(),
})
export type UpdateMaterialInput = z.infer<typeof updateMaterialSchema>
