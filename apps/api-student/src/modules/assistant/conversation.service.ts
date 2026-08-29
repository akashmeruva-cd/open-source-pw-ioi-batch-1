import { HttpError } from '@repo/http/http-error'
import { Conversation, type ConversationDoc } from '@repo/models/conversation'

/**
 * Owner: Team 13 — AI Assistant.
 *
 * Persistence for chat history and token usage, scoped to the caller on every
 * operation. The chat handler's own tests cover the endpoint; these cover the
 * store it builds on. `userId` is always bound by the request handler (from the
 * verified token) — it is never something the model chooses.
 *
 * Students' chats are stored so we can debug bad answers and review abuse, and
 * `tokensUsed` is what the per-user rate limit and monthly budget alert are
 * computed from — keep it accurate.
 */

export type AssistantMessage = ConversationDoc['messages'][number]

export interface AssistantMessageInput {
  role: 'user' | 'assistant'
  content: string
  toolsUsed?: string[]
}

export interface TokenUsage {
  input: number
  output: number
}

export function createConversation(userId: string, title = 'New chat') {
  return Conversation.create({
    userId,
    title,
    messages: [],
    tokensUsed: { input: 0, output: 0 },
  })
}

export async function listUserConversations(userId: string) {
  return Conversation.find({ userId })
    .sort({ updatedAt: -1 })
    .select('title tokensUsed createdAt updatedAt')
    .lean()
}

export async function getUserConversation(userId: string, conversationId: string) {
  const conversation = await Conversation.findOne({ _id: conversationId, userId })
  if (!conversation) throw HttpError.notFound('Conversation not found')
  return conversation
}

export async function appendMessage(
  userId: string,
  conversationId: string,
  message: AssistantMessageInput,
): Promise<ConversationDoc> {
  const conversation = await Conversation.findOneAndUpdate(
    { _id: conversationId, userId },
    {
      $push: {
        messages: {
          role: message.role,
          content: message.content,
          toolsUsed: message.toolsUsed ?? [],
          createdAt: new Date(),
        },
      },
    },
    { new: true },
  )
  if (!conversation) throw HttpError.notFound('Conversation not found')
  return conversation
}

export async function recordTokensUsed(
  userId: string,
  conversationId: string,
  usage: TokenUsage,
): Promise<ConversationDoc> {
  const conversation = await Conversation.findOneAndUpdate(
    { _id: conversationId, userId },
    { $inc: { 'tokensUsed.input': usage.input, 'tokensUsed.output': usage.output } },
    { new: true },
  )
  if (!conversation) throw HttpError.notFound('Conversation not found')
  return conversation
}
