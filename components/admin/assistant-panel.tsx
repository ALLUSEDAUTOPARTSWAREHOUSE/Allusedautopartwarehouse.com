'use client'

import { useState, type FormEvent, type KeyboardEvent } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport, lastAssistantMessageIsCompleteWithApprovalResponses } from 'ai'
import { Bot, Check, Loader2, Send, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AdminAssistantMessage } from '@/lib/admin-assistant'

const SUGGESTIONS = [
  'Check website configuration and database readiness',
  'How healthy is the Google feed right now?',
  'Show the latest reservations and orders',
  'Any open quote requests or unread chats?',
  'Which BMW pages are missing a price?',
]

const TOOL_LABELS: Record<string, string> = {
  checkWebsiteConfiguration: 'Checked website configuration',
  findOrderByNumber: 'Looked up order status',
  getFeedStats: 'Checked feed health',
  searchProducts: 'Searched catalog',
  listRecentOrders: 'Looked up orders',
  listOpenQuotes: 'Looked up quotes',
  listOpenChats: 'Looked up chats',
  bulkExcludeFromGoogle: 'Update Google feed',
  setProductHidden: 'Change page visibility',
}

type Part = AdminAssistantMessage['parts'][number]
type ToolPart = Extract<Part, { toolCallId: string }>

function describeAction(part: ToolPart): string {
  const input = part.input as Record<string, unknown> | undefined
  if (part.type === 'tool-bulkExcludeFromGoogle' && input) {
    const items = Array.isArray(input.items) ? input.items : []
    return `${input.exclude ? 'Exclude' : 'Re-include'} ${items.length} page${items.length === 1 ? '' : 's'} ${input.exclude ? 'from' : 'in'} the Google feed`
  }
  if (part.type === 'tool-setProductHidden' && input) {
    return `${input.hidden ? 'Hide' : 'Unhide'} ${String(input.brand)}/${String(input.slug)}`
  }
  return 'Run this action'
}

export function AssistantPanel() {
  const [input, setInput] = useState('')
  const { messages, sendMessage, addToolApprovalResponse, status, error } = useChat<AdminAssistantMessage>({
    transport: new DefaultChatTransport({ api: '/api/admin/assistant' }),
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses,
  })
  const busy = status === 'submitted' || status === 'streaming'

  function submit(text: string) {
    const t = text.trim()
    if (!t || busy) return
    void sendMessage({ text: t })
    setInput('')
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    submit(input)
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      if (e.nativeEvent.isComposing || e.keyCode === 229) return
      e.preventDefault()
      submit(input)
    }
  }

  return (
    <section
      aria-label="AI assistant"
      className="flex flex-col overflow-hidden rounded-xl border border-border bg-card"
    >
      <header className="flex items-center gap-3 border-b border-border px-4 py-3">
        <span className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Bot className="size-4" />
        </span>
        <div>
          <h2 className="text-sm font-bold text-foreground">Store Assistant</h2>
          <p className="text-xs text-muted-foreground">
            Ask about the feed, catalog, orders, quotes, and chats. Changes always need your approval.
          </p>
        </div>
      </header>

      <div className="flex max-h-[28rem] min-h-40 flex-col gap-3 overflow-y-auto p-4" aria-live="polite">
        {messages.length === 0 ? (
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => submit(s)}
                className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                {s}
              </button>
            ))}
          </div>
        ) : (
          messages.map((m) => (
            <div key={m.id} className={cn('flex flex-col gap-2', m.role === 'user' ? 'items-end' : 'items-start')}>
              {m.parts.map((part, i) => {
                if (part.type === 'text') {
                  if (!part.text) return null
                  return (
                    <div
                      key={i}
                      className={cn(
                        'max-w-[85%] whitespace-pre-wrap break-words rounded-lg px-3 py-2 text-sm',
                        m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground',
                      )}
                    >
                      {part.text}
                    </div>
                  )
                }
                if (!('toolCallId' in part)) return null
                return <ToolPartView key={part.toolCallId} part={part} onRespond={addToolApprovalResponse} />
              })}
            </div>
          ))
        )}
        {status === 'submitted' ? (
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="size-3 animate-spin" /> Thinking…
          </p>
        ) : null}
        {error ? (
          <p className="text-xs text-destructive" role="alert">
            Something went wrong. Please try again.
          </p>
        ) : null}
      </div>

      <form onSubmit={onSubmit} className="flex items-end gap-2 border-t border-border p-3">
        <label htmlFor="assistant-input" className="sr-only">Ask the assistant</label>
        <textarea
          id="assistant-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          rows={1}
          placeholder="e.g. Exclude all Audi pages with illustrative images from Google"
          className="min-h-10 flex-1 resize-none rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          <span className="sr-only sm:not-sr-only">Ask</span>
        </button>
      </form>
    </section>
  )
}

function ToolPartView({
  part,
  onRespond,
}: {
  part: ToolPart
  onRespond: (r: { id: string; approved: boolean }) => void
}) {
  const name = part.type.replace(/^tool-/, '')
  const label = TOOL_LABELS[name] ?? name

  if (part.state === 'approval-requested' && 'approval' in part && part.approval && !part.approval.isAutomatic) {
    const approvalId = part.approval.id
    return (
      <div className="flex w-full max-w-[85%] flex-col gap-2 rounded-lg border border-primary/40 bg-primary/5 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">Approval needed</p>
        <p className="text-sm text-foreground">{describeAction(part)}</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onRespond({ id: approvalId, approved: true })}
            className="flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
          >
            <Check className="size-3" /> Approve
          </button>
          <button
            type="button"
            onClick={() => onRespond({ id: approvalId, approved: false })}
            className="flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"
          >
            <X className="size-3" /> Cancel
          </button>
        </div>
      </div>
    )
  }

  let detail = ''
  if (part.state === 'output-available') {
    const out = part.output as { message?: string } | undefined
    detail = out && typeof out === 'object' && 'message' in out && out.message ? ` — ${out.message}` : ''
  } else if (part.state === 'output-denied') {
    detail = ' — cancelled'
  } else if (part.state === 'output-error') {
    detail = ' — failed'
  }
  const pending = part.state === 'input-streaming' || part.state === 'input-available' || part.state === 'approval-responded'

  return (
    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
      {pending ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3" />}
      {label}
      {detail}
    </p>
  )
}
