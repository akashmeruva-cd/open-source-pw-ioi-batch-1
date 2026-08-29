import { z } from 'zod'

/**
 * Owner: Team 13 — AI Assistant.
 *
 * Contract for the chat window. The student's identity is bound on the server
 * from `currentUser(req).sub` — there is deliberately no `studentId` here, so
 * the model can never choose whose data to read.
 */

export const assistantChatSchema = z.object({
  message: z.string().trim().min(1).max(4000),
})
export type AssistantChatInput = z.infer<typeof assistantChatSchema>
