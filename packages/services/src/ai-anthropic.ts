import Anthropic from '@anthropic-ai/sdk'
import type { AiChatRequest, AiDriver, AiReply, AiToolCall } from './ai'

/**
 * LOCKED FILE — Team 01 (Core Platform) + a maintainer review.
 *
 * Real Claude calls via the official SDK.
 *
 * `ANTHROPIC_API_KEY` is read from the environment by the SDK and must only
 * ever be set on `api-student`. Never prefix it with `NEXT_PUBLIC_`.
 */

/**
 * Default model. Claude Opus 5 is the current default choice; override with
 * ANTHROPIC_MODEL if you want to trade capability for cost (`claude-sonnet-5`
 * is cheaper, `claude-haiku-4-5` cheaper still).
 */
const DEFAULT_MODEL = 'claude-opus-5'

/**
 * Effort controls how much the model thinks, and therefore what a chat message
 * costs. `low` is the right default for "what is my attendance in DBMS" — the
 * hard work is the tool call, not the reasoning. Raise it if answers get shallow.
 */
const DEFAULT_EFFORT = 'low'

export function createAnthropicAi(): AiDriver {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is not set. Use AI_DRIVER=stub locally — it needs no key.')
  }

  const client = new Anthropic()
  const model = process.env.ANTHROPIC_MODEL || DEFAULT_MODEL
  const effort = process.env.ANTHROPIC_EFFORT || DEFAULT_EFFORT

  return {
    name: 'anthropic',

    async chat({
      system,
      messages,
      tools = [],
      toolResults = [],
      maxTokens = 4096,
    }: AiChatRequest): Promise<AiReply> {
      // The conversation the API sees. Tool results are a user turn carrying
      // tool_result blocks, which is how the loop continues after we run a tool.
      const apiMessages: Anthropic.MessageParam[] = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }))

      if (toolResults.length > 0) {
        apiMessages.push({
          role: 'user',
          content: toolResults.map((r) => ({
            type: 'tool_result' as const,
            tool_use_id: r.id,
            content: r.content,
            ...(r.isError ? { is_error: true } : {}),
          })),
        })
      }

      const response = await client.messages.create({
        model,
        max_tokens: maxTokens,
        system,
        output_config: { effort: effort as 'low' | 'medium' | 'high' },
        ...(tools.length > 0
          ? {
              tools: tools.map((t) => ({
                name: t.name,
                description: t.description,
                input_schema: t.inputSchema,
              })),
            }
          : {}),
        messages: apiMessages,
      })

      // Safety classifiers can decline a request: that arrives as a normal 200
      // with stop_reason "refusal" and an empty content array. Reading
      // content[0] without this check throws.
      if (response.stop_reason === 'refusal') {
        return {
          text: "I can't help with that request.",
          toolCalls: [],
          stopReason: 'refusal',
          usage: {
            inputTokens: response.usage.input_tokens,
            outputTokens: response.usage.output_tokens,
          },
        }
      }

      let text = ''
      const toolCalls: AiToolCall[] = []

      for (const block of response.content) {
        if (block.type === 'text') {
          text += block.text
        } else if (block.type === 'tool_use') {
          toolCalls.push({
            id: block.id,
            name: block.name,
            input: block.input as Record<string, unknown>,
          })
        }
      }

      return {
        text,
        toolCalls,
        stopReason: response.stop_reason,
        usage: {
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
        },
      }
    },
  }
}
