import { z } from 'zod'

const objectIdPattern = /^[0-9a-fA-F]{24}$/

const objectIdSchema = z
  .string()
  .regex(objectIdPattern, { message: 'Invalid ObjectId format' })

export const createBatchSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  year: z.number().int().min(2000).max(2100),
  program: z.string().min(1, 'Program is required').max(100, 'Program is too long'),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().nullable().optional(),
  isActive: z.boolean().default(true),
})

export type CreateBatchInput = z.infer<typeof createBatchSchema>

export const updateBatchSchema = createBatchSchema.partial()

export type UpdateBatchInput = z.infer<typeof updateBatchSchema>

export const createSubjectSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  code: z.string().min(1, 'Code is required').max(20),
  batchId: objectIdSchema,
  facultyId: objectIdSchema.nullable().optional(),
  credits: z.number().int().min(0).default(3),
})

export type CreateSubjectInput = z.infer<typeof createSubjectSchema>

export const updateSubjectSchema = createSubjectSchema.partial()

export type UpdateSubjectInput = z.infer<typeof updateSubjectSchema>

export const createEnrollmentSchema = z.object({
  studentId: objectIdSchema,
  subjectId: objectIdSchema,
  batchId: objectIdSchema,
})

export type CreateEnrollmentInput = z.infer<typeof createEnrollmentSchema>

export const bulkCreateEnrollmentsSchema = z.object({
  enrollments: z.array(createEnrollmentSchema).min(1),
})

export type BulkCreateEnrollmentsInput = z.infer<typeof bulkCreateEnrollmentsSchema>

export const importStudentRowSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email format'),
})

export type ImportStudentRowInput = z.infer<typeof importStudentRowSchema>

export const importStudentsSchema = z.object({
  batchId: objectIdSchema,
  students: z.array(importStudentRowSchema).min(1, 'At least one student is required'),
})

export type ImportStudentsInput = z.infer<typeof importStudentsSchema>
