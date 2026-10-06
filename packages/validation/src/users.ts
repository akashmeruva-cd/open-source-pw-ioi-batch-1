import { z } from 'zod'
import { objectIdSchema, paginationQuerySchema } from './common'
import { roleSchema } from './enums'

export const userListQuerySchema = paginationQuerySchema.extend({
  role: roleSchema.optional(),
  batchId: objectIdSchema.optional(),
  isActive: z.coerce.boolean().optional(),
})
export type UserListQuery = z.infer<typeof userListQuerySchema>

export const createUserSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email().toLowerCase(),
  password: z.string().min(8).max(128),
  role: roleSchema,
  batchId: objectIdSchema.optional().nullable(),
  avatarUrl: z.string().url().optional().nullable(),
  isActive: z.boolean().optional().default(true),
})
export type CreateUserInput = z.infer<typeof createUserSchema>

export const updateUserSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  email: z.string().email().toLowerCase().optional(),
  role: roleSchema.optional(),
  batchId: objectIdSchema.optional().nullable(),
  avatarUrl: z.string().url().optional().nullable(),
  isActive: z.boolean().optional(),
})
export type UpdateUserInput = z.infer<typeof updateUserSchema>

export const resetPasswordSchema = z.object({
  password: z.string().min(8).max(128),
})
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
