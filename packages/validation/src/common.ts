import { z } from 'zod'

/** A UUID as it appears over the wire (PostgreSQL / Supabase standard). */
export const uuidSchema = z.string().uuid('must be a valid UUID')

/** Alias for backward compatibility with existing feature imports. */
export const objectIdSchema = uuidSchema

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})
export type PaginationQuery = z.infer<typeof paginationQuerySchema>

export function paginatedSchema<T extends z.ZodTypeAny>(item: T) {
  return z.object({
    items: z.array(item),
    page: z.number().int(),
    limit: z.number().int(),
    total: z.number().int(),
    hasMore: z.boolean(),
  })
}

/** The error body every endpoint returns on failure. Keep this stable. */
export const apiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
  }),
})
export type ApiError = z.infer<typeof apiErrorSchema>
