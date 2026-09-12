'use client'

import { useCallback, useRef, useState } from 'react'
import { api } from '@/lib/api-client'
import { ApiRequestError } from '@repo/client/api-client'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  toolsUsed?: string[]
  isStreaming?: boolean
}

interface UseChatReturn {
  messages: ChatMessage[]
  isLoading: boolean
  error: string | null
  sendMessage: (content: string) => Promise<void>
  clearError: () => void
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

export function useChat(): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const conversationIdRef = useRef<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const clearError = useCallback(() => setError(null), [])

  const sendMessage = useCallback(async (content: string) => {
    if (isLoading) return

    setError(null)
    setIsLoading(true)

    const userMessage: ChatMessage = { role: 'user', content }
    setMessages((prev) => [...prev, userMessage])

    const assistantMessage: ChatMessage = { role: 'assistant', content: '', isStreaming: true }
    setMessages((prev) => [...prev, assistantMessage])

    try {
      abortControllerRef.current = new AbortController()

      const response = await fetch(`${API_BASE_URL}/api/assistant/chat`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(api.getAccessToken() ? { Authorization: `Bearer ${api.getAccessToken()}` } : {}),
        },
        body: JSON.stringify({
          conversationId: conversationIdRef.current ?? undefined,
          message: content,
        }),
        signal: abortControllerRef.current.signal,
      })

      if (!response.ok) {
        const retryAfterHeader = response.headers.get('Retry-After')
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.error?.message ?? 'Failed to send message'

        if (response.status === 429) {
          const retryAfter = retryAfterHeader ? parseInt(retryAfterHeader, 10) : (errorData.error?.retryAfter ?? 3600)
          setError(`Rate limited. Try again in ${Math.ceil(retryAfter / 60)} minutes.`)
        } else {
          setError(errorMessage)
        }

        setMessages((prev) => prev.slice(0, -1))
        setIsLoading(false)
        return
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No response body')

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })

        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6)

          try {
            const event = JSON.parse(data)

            if (event.type === 'delta' && event.delta) {
              setMessages((prev) => {
                const updated = [...prev]
                const lastIndex = updated.length - 1
                const lastMsg = updated[lastIndex]
                if (lastIndex >= 0 && lastMsg && lastMsg.role === 'assistant') {
                  updated[lastIndex] = {
                    ...lastMsg,
                    content: lastMsg.content + event.delta,
                  }
                }
                return updated
              })
            } else if (event.type === 'done') {
              if (event.conversationId) {
                conversationIdRef.current = event.conversationId
              }
              setMessages((prev) => {
                const updated = [...prev]
                const lastIndex = updated.length - 1
                const lastMsg = updated[lastIndex]
                if (lastIndex >= 0 && lastMsg && lastMsg.role === 'assistant') {
                  updated[lastIndex] = {
                    ...lastMsg,
                    isStreaming: false,
                    toolsUsed: event.toolsUsed ?? lastMsg.toolsUsed,
                  }
                }
                return updated
              })
              setIsLoading(false)
            } else if (event.type === 'error') {
              const errorMsg = event.error?.message ?? 'An error occurred'
              setError(errorMsg)
              setMessages((prev) => prev.slice(0, -1))
              setIsLoading(false)
            }
          } catch {
          }
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return

      if (err instanceof ApiRequestError) {
        if (err.status === 429) {
          setError(`Rate limited. Try again later.`)
        } else {
          setError(err.message)
        }
      } else {
        setError('Failed to send message. Please try again.')
      }
      setMessages((prev) => prev.slice(0, -1))
      setIsLoading(false)
    }
  }, [isLoading])

  return { messages, isLoading, error, sendMessage, clearError }
}