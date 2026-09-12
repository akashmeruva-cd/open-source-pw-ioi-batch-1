'use client'

import { useRef, useEffect, useState } from 'react'
import { Button } from '@repo/ui/button'
import { cn } from '@repo/ui/cn'
import { useChat } from './useChat'

export function ChatPanel() {
  const { messages, isLoading, error, sendMessage, clearError } = useChat()
  const [inputValue, setInputValue] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const content = inputValue.trim()
    if (!content || isLoading) return
    setInputValue('')
    sendMessage(content)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      const content = e.currentTarget.value.trim()
      if (!content || isLoading) return
      setInputValue('')
      sendMessage(content)
    }
  }

  return (
    <div className="flex h-full flex-col bg-surface">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-fg-muted py-12">
            <p className="text-lg font-medium text-fg">How can I help?</p>
            <p className="mt-1 text-sm">Ask me about your attendance, upcoming deadlines, or course materials.</p>
            <div className="mt-4 flex flex-wrap gap-2 justify-center">
              <button
                className="text-xs px-3 py-1.5 rounded-full border border-line bg-surface hover:bg-surface-2 transition-colors"
                onClick={() => sendMessage("What&apos;s my attendance in DBMS?")}
              >
                {'"What&apos;s my attendance in DBMS?"'}
              </button>
              <button
                className="text-xs px-3 py-1.5 rounded-full border border-line bg-surface hover:bg-surface-2 transition-colors"
                onClick={() => sendMessage("What&apos;s due this week?")}
              >
                {'"What&apos;s due this week?"'}
              </button>
              <button
                className="text-xs px-3 py-1.5 rounded-full border border-line bg-surface hover:bg-surface-2 transition-colors"
                onClick={() => sendMessage("Find the slides on normalization")}
              >
                {'"Find the slides on normalization"'}
              </button>
            </div>
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={index}
            className={cn('flex gap-3', message.role === 'user' ? 'flex-row-reverse' : '')}
          >
            <div
              className={cn(
                'flex max-w-[80%] flex-col gap-1',
                message.role === 'user' ? 'items-end' : 'items-start',
              )}
            >
              <div
                className={cn(
                  'rounded-2xl px-4 py-2 text-sm',
                  message.role === 'user'
                    ? 'bg-brand text-white rounded-tr-sm'
                    : 'bg-surface-2 text-fg rounded-tl-sm',
                )}
              >
                {message.content}
                {message.toolsUsed && message.toolsUsed.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {message.toolsUsed.map((tool) => (
                      <span
                        key={tool}
                        className="text-xs px-2 py-0.5 rounded bg-surface text-fg-muted border border-line"
                      >
                        {tool}
                      </span>
                    ))}
                  </div>
                )}
                {message.isStreaming && (
                  <span className="inline-block animate-pulse text-brand" aria-hidden="true">
                    ▋
                  </span>
                )}
              </div>
              <span className="text-xs text-fg-subtle">
                {message.role === 'user' ? 'You' : 'Assistant'}
              </span>
            </div>
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {error && (
        <div className="mx-4 mb-4 p-3 rounded-lg bg-danger/10 border border-danger/30 text-danger text-sm flex items-center justify-between">
          <span>{error}</span>
          <Button variant="ghost" size="sm" onClick={clearError}>
            Dismiss
          </Button>
        </div>
      )}

      <div className="border-t border-line p-4 bg-surface">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about attendance, deadlines, materials..."
            disabled={isLoading}
            className={cn(
              'flex-1 min-h-[44px] max-h-32 rounded-lg border bg-surface px-3 py-2 text-sm text-fg placeholder:text-fg-subtle',
              'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand',
              'resize-none disabled:opacity-60',
              'border-line',
            )}
            rows={1}
            aria-label="Chat input"
          />
          <Button
            type="submit"
            size="lg"
            disabled={isLoading || !inputValue.trim()}
            aria-busy={isLoading}
          >
            {isLoading ? 'Sending...' : 'Send'}
          </Button>
        </form>
        <p className="mt-2 text-xs text-fg-subtle text-center">
          Chats are stored for quality and safety. Rate limit: 20 messages/hour.
        </p>
      </div>
    </div>
  )
}