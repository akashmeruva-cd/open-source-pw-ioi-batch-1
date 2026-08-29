import { Types } from 'mongoose'
import { describe, expect, it } from 'vitest'
import { HttpError } from '@repo/http/http-error'
import { Conversation } from '@repo/models/conversation'
import {
  appendMessage,
  createConversation,
  getUserConversation,
  listUserConversations,
  recordTokensUsed,
} from './conversation.service'

/**
 * Owner: Team 13 — AI Assistant.
 *
 * The abuse case here is the cross-student one: conversation ids are opaque
 * strings the model never sees, but a leaked id must still never let one
 * student read or write another student's history. Every query is scoped by
 * `userId`, so a wrong id resolves to "not found", not someone else's data.
 */

const alice = new Types.ObjectId().toString()
const mallory = new Types.ObjectId().toString()

describe('conversation store', () => {
  it('creates a conversation with empty history and zeroed token usage', async () => {
    const conv = await createConversation(alice)

    expect(conv.userId.toString()).toBe(alice)
    expect(conv.title).toBe('New chat')
    expect(conv.messages).toEqual([])
    expect(conv.tokensUsed).toMatchObject({ input: 0, output: 0 })
  })

  it('persists messages and accumulates token usage', async () => {
    const conv = await createConversation(alice, "What's my attendance?")

    await appendMessage(alice, conv._id.toString(), {
      role: 'user',
      content: "what's my attendance in DBMS?",
    })
    await appendMessage(alice, conv._id.toString(), {
      role: 'assistant',
      content: 'Your attendance in DBMS is 80.0%.',
      toolsUsed: ['get_my_attendance'],
    })
    const updated = await recordTokensUsed(alice, conv._id.toString(), {
      input: 120,
      output: 30,
    })

    expect(updated.messages).toHaveLength(2)
    expect(updated.messages[1]!.content).toBe('Your attendance in DBMS is 80.0%.')
    expect(updated.messages[1]!.toolsUsed).toEqual(['get_my_attendance'])
    expect(updated.tokensUsed).toMatchObject({ input: 120, output: 30 })
  })

  it("lists only the caller's conversations, newest first", async () => {
    await createConversation(alice, 'first')
    const second = await createConversation(alice, 'second')
    const other = await createConversation(mallory, 'hidden')

    const mine = await listUserConversations(alice)
    const mineIds = mine.map((c) => c._id.toString())

    expect(mineIds).toContain(second._id.toString())
    expect(mineIds).not.toContain(other._id.toString())
    expect(mineIds[0]).toBe(second._id.toString())

    const theirs = await listUserConversations(mallory)
    expect(theirs.map((c) => c._id.toString())).toContain(other._id.toString())
  })

  it("refuses to read another student's conversation", async () => {
    const victim = await createConversation(mallory, 'alice should not see this')

    await expect(getUserConversation(alice, victim._id.toString())).rejects.toMatchObject({
      status: 404,
      code: 'NOT_FOUND',
    })
  })

  it("refuses to write to another student's conversation", async () => {
    const victim = await createConversation(mallory)

    await expect(
      appendMessage(alice, victim._id.toString(), { role: 'user', content: 'hi' }),
    ).rejects.toBeInstanceOf(HttpError)
    await expect(
      recordTokensUsed(alice, victim._id.toString(), { input: 5, output: 5 }),
    ).rejects.toBeInstanceOf(HttpError)

    const untouched = await Conversation.findById(victim._id)
    expect(untouched!.messages).toHaveLength(0)
    expect(untouched!.tokensUsed).toMatchObject({ input: 0, output: 0 })
  })
})
