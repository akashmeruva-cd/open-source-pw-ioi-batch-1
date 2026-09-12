import type { Request, Response } from 'express'
import { currentUser } from '@repo/auth/middleware'
import { getAi, type AiChatRequest, type AiMessage, type AiToolCall } from '@repo/services/ai'
import type { AssistantChatInput } from '@repo/validation/assistant'
import { buildTools } from './assistant.tools'

/**
 * Owner: Team 13 — AI Assistant.
 *
 * Chat runs the tool-use loop entirely on the server and streams the assistant's
 * answer as an SSE stream (`POST /api/assistant/chat`). The caller's id — read
 * from the verified token only, as `currentUser(req).sub` — is bound into the
 * tools; it is never something the model can provide.
 */

const SYSTEM_PROMPT =
  'You are a helpful assistant inside a student portal. You can read the student’s own ' +
  'academic data through tools. Never ask for or accept a student id — you only ever see ' +
  'the logged-in student’s data. Answer briefly and clearly using the tool results.'

/** The model can in principle loop forever calling tools — cap the rounds. */
const MAX_TOOL_ROUNDS = 5

function writeSse(res: Response, event: string, data: unknown) {
  res.write(`event: ${event}\n`)
  res.write(`data: ${JSON.stringify(data)}\n\n`)
}

type BuiltTools = ReturnType<typeof buildTools>

/**
 * Run the model, executing every tool call it makes, until it stops asking for
 * tools. The transcript accumulates the assistant's tool_use blocks so the next
 * turn has context; each round's results are passed to the driver to close the
 * loop.
 */
async function runTurn(
  initial: AiChatRequest,
  tools: BuiltTools,
): Promise<{ text: string; inputTokens: number; outputTokens: number }> {
  const ai = getAi()
  let messages = initial.messages
  let inputTokens = 0
  let outputTokens = 0
  let pendingResults: NonNullable<AiChatRequest['toolResults']> | undefined

  for (let round = 0; ; round++) {
    const reply = await ai.chat({
      system: initial.system,
      messages,
      tools: tools.map((t) => t.definition),
      toolResults: round === 0 ? undefined : pendingResults,
    })

    inputTokens += reply.usage.inputTokens
    outputTokens += reply.usage.outputTokens

    if (reply.toolCalls.length === 0 || round >= MAX_TOOL_ROUNDS) {
      return { text: reply.text, inputTokens, outputTokens }
    }

    const results: NonNullable<AiChatRequest['toolResults']> = []
    for (const call of reply.toolCalls) {
      results.push(await runToolCall(call, tools))
    }
    pendingResults = results
    messages = [...messages, assistantToolUseTurn(reply.toolCalls)]
  }
}

async function runToolCall(
  call: AiToolCall,
  tools: BuiltTools,
): Promise<{ id: string; content: string; isError?: boolean }> {
  const tool = tools.find((t) => t.definition.name === call.name)
  if (!tool) {
    return { id: call.id, content: `Unknown tool: ${call.name}`, isError: true }
  }
  try {
    return { id: call.id, content: await tool.execute(call.input) }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Tool execution failed'
    return { id: call.id, content: message, isError: true }
  }
}

/** Persist the model's tool_use blocks so the next turn knows what it called. */
function assistantToolUseTurn(calls: AiToolCall[]): AiMessage {
  return {
    role: 'assistant',
    content: JSON.stringify(
      calls.map((c) => ({ type: 'tool_use', id: c.id, name: c.name, input: c.input })),
    ),
  }
}

export async function chat(req: Request, res: Response) {
  const { sub } = currentUser(req)
  const { message } = req.body as AssistantChatInput

  const tools = buildTools({ studentId: sub })

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache, no-transform')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders()

  writeSse(res, 'start', { ok: true })

  try {
    const { text, inputTokens, outputTokens } = await runTurn(
      { system: SYSTEM_PROMPT, messages: [{ role: 'user', content: message }] },
      tools,
    )
    writeSse(res, 'message', { text })
    writeSse(res, 'usage', { inputTokens, outputTokens })
  } catch (err) {
    writeSse(res, 'error', {
      message: err instanceof Error ? err.message : 'Assistant request failed',
    })
  } finally {
    writeSse(res, 'done', {})
    res.end()
  }
}
