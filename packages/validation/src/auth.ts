import { z } from 'zod'
import { objectIdSchema } from './common'
import { roleSchema } from './enums'

export const registerSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email().toLowerCase(),
  password: z.string().min(8).max(128),
})
export type RegisterInput = z.infer<typeof registerSchema>

export const loginSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(1),
})
export type LoginInput = z.infer<typeof loginSchema>

/** The public shape of a user. Never contains `passwordHash`. */
export const publicUserSchema = z.object({
  id: objectIdSchema,
  name: z.string(),
  email: z.string().email(),
  role: roleSchema,
  batchId: objectIdSchema.nullable(),
  avatarUrl: z.string().url().nullable(),
})
export type PublicUser = z.infer<typeof publicUserSchema>

export const authResponseSchema = z.object({
  user: publicUserSchema,
  accessToken: z.string(),
})
export type AuthResponse = z.infer<typeof authResponseSchema>

export const passwordResetRequestSchema = z.object({
  email: z.string().email().toLowerCase(),
})
export type PasswordResetRequestInput = z.infer<typeof passwordResetRequestSchema>

export const passwordResetSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8).max(128),
})
export type PasswordResetInput = z.infer<typeof passwordResetSchema>

export const changePasswordSchema = z.object({
  oldPassword: z.string().min(1),
  newPassword: z.string().min(8).max(128),
})
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>
