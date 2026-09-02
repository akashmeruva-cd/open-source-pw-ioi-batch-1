import { z } from 'zod'
import { objectIdSchema } from './common'

export const createNoteSchema = z.object({
    subjectId: objectIdSchema.nullable().optional(),
    sessionId: objectIdSchema.nullable().optional(),
    title: z.string().min(1).max(200),
    body: z.string(),
    pinned: z.boolean().optional(),
})

export type CreateNoteInput = z.infer<typeof createNoteSchema>

export const updateNoteSchema = z.object({
    subjectId: objectIdSchema.nullable().optional(),
    sessionId: objectIdSchema.nullable().optional(),
    title: z.string().min(1).max(200).optional(),
    body: z.string().optional(),
    pinned: z.boolean().optional(),
})

export type UpdateNoteInput = z.infer<typeof updateNoteSchema>