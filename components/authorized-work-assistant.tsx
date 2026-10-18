'use client'

import { useMemo, useState } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { Bot, Loader2, Send, X } from 'lucide-react'
import useSWR from 'swr'
import { useAuth } from '@/lib/auth-context'

type SessionResponse = {
  authorized: boolean
  department: string | null
}

const sessionFetcher = async (url: string): Promise<SessionResponse> => {
  const response = await fetch(url, { credentials: 'include' })
  if (!response.ok) return { authorized: false, department: null }
  return response.json()
}

export function AuthorizedWorkAssistant() {
  const { user, isLoading } = useAuth()
  const { data: workspace, isLoading: workspaceLoading } = useSWR(
    '/api/authorized-assistant',
    sessionFetcher,
    { revalidateOnFocus: true },
  )
  const authorized = Boolean(user) || Boolean(workspace?.authorized)

  if (isLoading || (!user && workspaceLoading) || !authorized) return null
  return <WorkAssistantChat />
}

function WorkAssistantChat() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const transport = useMemo(
    () => new DefaultChatTransport({ api: '/api/authorized-assistant', credentials: 'include' }),
    [],
  )
  const { messages, sendMessage, status, error } = useChat({ transport })
  const busy = status === 'submitted' || status === 'streaming'

  function submit() {
    const text = input.trim()
    if (!text || busy) return
    void sendMessage({ text })
    setInput('')
  }

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open AUAPW Work Assistant"
          className="fixed bottom-5 right-5 z-[9980] flex items-center gap-3 rounded-full bg-primary px-5 py-3.5 text-sm font-semibold text-primary-foreground shadow-xl transition hover:scale-105"
        >
          <Bot className="size-4" />
          Work Assistant
        </button>
      )}
      {open && (
        <section
          aria-label="AUAPW Work Assistant"
          className="fixed bottom-5 right-5 z-[9990] flex h-[min(680px,calc(100vh-2rem))] w-[min(460px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
        >
          <header className="flex items-center justify-between border-b border-border bg-primary px-4 py-3 text-primary-foreground">
            <div>
              <p className="font-semibold">AUAPW Work Assistant</p>
              <p className="text-xs opacity-80">Portal team help · AI replies may take a little longer</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close assistant"
              className="rounded-md p-1 hover:bg-primary-foreground/10"
            >
              <X className="size-4" />
            </button>
          </header>
          <div className="flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite">
            {messages.length === 0 ? (
              <p className="rounded-xl bg-muted p-3 text-sm text-muted-foreground">
                Use this for portal work: organize tasks, research parts, draft customer replies, or understand an AUAPW process. For quick customer questions, use Chat with a parts specialist.
              </p>
            ) : (
              messages.map((message) => (
                <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[88%] whitespace-pre-wrap rounded-xl px-3 py-2 text-sm ${
                      message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
                    }`}
                  >
                    {message.parts
                      .filter((part) => part.type === 'text')
                      .map((part, index) => (part.type === 'text' ? <span key={index}>{part.text}</span> : null))}
                  </div>
                </div>
              ))
            )}
            {status === 'submitted' && (
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="size-3 animate-spin" />
                Thinking…
              </p>
            )}
            {error && <p className="text-xs text-destructive">Assistant unavailable. Sign in to the portal and try again.</p>}
          </div>
          <form
            onSubmit={(event) => {
              event.preventDefault()
              submit()
            }}
            className="flex gap-2 border-t border-border p-3"
          >
            <label htmlFor="authorized-assistant-input" className="sr-only">
              Ask the work assistant
            </label>
            <input
              id="authorized-assistant-input"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="How can I help with your work?"
              className="min-h-10 flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              aria-label="Send message"
              className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground disabled:opacity-50"
            >
              {busy ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            </button>
          </form>
        </section>
      )}
    </>
  )
}
