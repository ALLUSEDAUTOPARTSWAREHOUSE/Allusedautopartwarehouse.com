'use client'

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { usePathname } from 'next/navigation'
import useSWR from 'swr'
import { MessageCircle, Send, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface WidgetMessage {
  id: string
  sender: 'customer' | 'admin'
  body: string
  createdAt: string
}

interface WidgetData {
  conversation: {
    id: string
    customerName: string | null
    customerEmail: string | null
    unreadForCustomer: boolean
  } | null
  messages: WidgetMessage[]
}

const fetcher = (url: string) => fetch(url, { cache: 'no-store' }).then((r) => r.json() as Promise<WidgetData>)

export function LiveChatWidget() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pendingBody, setPendingBody] = useState<string | null>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const { data, mutate } = useSWR<WidgetData>(open ? '/api/chat?markRead=1' : '/api/chat', fetcher, {
    refreshInterval: open ? 4000 : 20000,
    revalidateOnFocus: true,
  })

  const messages = data?.messages ?? []
  const conversation = data?.conversation ?? null
  const hasUnread = !open && Boolean(conversation?.unreadForCustomer)

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight })
  }, [messages.length, open, sending])

  if (pathname?.startsWith('/admin')) return null

  async function send(e?: FormEvent) {
    e?.preventDefault()
    const body = draft.trim()
    if (!body || sending) return
    setSending(true)
    setError(null)
    setPendingBody(body)
    setDraft('')
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          body,
          name: conversation ? undefined : name,
          email: conversation ? undefined : email,
          pageUrl: window.location.href,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Could not send message')
      await mutate()
    } catch (err) {
      setDraft(body)
      setError(err instanceof Error ? err.message : 'Could not send message')
    } finally {
      setPendingBody(null)
      setSending(false)
    }
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      if (e.nativeEvent.isComposing || e.keyCode === 229) return
      e.preventDefault()
      void send()
    }
  }

  return (
    <div className="fixed bottom-24 right-4 z-[9995] flex flex-col items-end gap-3 sm:bottom-28 sm:right-6">
      {open ? (
        <section
          aria-label="Live chat with AUAPW"
          className="flex h-[min(32rem,calc(100dvh-10rem))] w-[min(22rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-2xl"
        >
          <header className="flex items-center justify-between gap-3 border-b border-border bg-primary px-4 py-3 text-primary-foreground">
            <div className="flex flex-col">
              <h2 className="text-sm font-bold">Chat with a parts specialist</h2>
              <p className="text-xs opacity-80">We usually reply within a few minutes.</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-md p-1 hover:bg-black/10"
              aria-label="Close chat"
            >
              <X className="size-4" />
            </button>
          </header>

          <div ref={listRef} className="flex flex-1 flex-col gap-2 overflow-y-auto p-4" aria-live="polite">
            {messages.length === 0 ? (
              <p className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
                {"Hi! Tell us the year, make, and model plus the part you need, and we'll check fitment and stock for you."}
              </p>
            ) : (
              messages.map((m) => (
                <div
                  key={m.id}
                  className={cn(
                    'max-w-[85%] whitespace-pre-wrap break-words rounded-lg px-3 py-2 text-sm',
                    m.sender === 'customer'
                      ? 'self-end bg-primary text-primary-foreground'
                      : 'self-start bg-muted text-foreground',
                  )}
                >
                  <span className="sr-only">{m.sender === 'customer' ? 'You: ' : 'AUAPW: '}</span>
                  {m.body}
                </div>
              ))
            )}
            {pendingBody ? (
              <div className="max-w-[85%] self-end whitespace-pre-wrap break-words rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground opacity-80">
                {pendingBody}
              </div>
            ) : null}
            {sending ? (
              <div className="flex items-center gap-1 self-start rounded-lg bg-muted px-3 py-3" role="status">
                <span className="sr-only">AUAPW is typing</span>
                <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
                <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
                <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground" />
              </div>
            ) : null}
          </div>

          <form onSubmit={send} className="flex flex-col gap-2 border-t border-border p-3">
            {!conversation ? (
              <div className="flex gap-2">
                <label className="sr-only" htmlFor="chat-name">Your name</label>
                <input
                  id="chat-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Name (optional)"
                  maxLength={120}
                  autoComplete="name"
                  className="min-w-0 flex-1 rounded-md border border-input bg-background px-2 py-1.5 text-sm"
                />
                <label className="sr-only" htmlFor="chat-email">Your email</label>
                <input
                  id="chat-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email (optional)"
                  maxLength={200}
                  autoComplete="email"
                  className="min-w-0 flex-1 rounded-md border border-input bg-background px-2 py-1.5 text-sm"
                />
              </div>
            ) : null}
            {error ? <p className="text-xs text-destructive" role="alert">{error}</p> : null}
            <div className="flex items-end gap-2">
              <label className="sr-only" htmlFor="chat-message">Message</label>
              <textarea
                id="chat-message"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={onKeyDown}
                rows={2}
                maxLength={2000}
                placeholder="Type your message…"
                className="min-h-10 flex-1 resize-none rounded-md border border-input bg-background px-2 py-1.5 text-sm"
              />
              <button
                type="submit"
                disabled={sending || !draft.trim()}
                className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground disabled:opacity-50"
                aria-label="Send message"
              >
                <Send className="size-4" />
              </button>
            </div>
          </form>
        </section>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? 'Close live chat' : 'Open live chat'}
        className="relative flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105"
      >
        {open ? <X className="size-6" /> : <MessageCircle className="size-6" />}
        {hasUnread ? (
          <span className="absolute -right-0.5 -top-0.5 size-3.5 rounded-full border-2 border-background bg-destructive">
            <span className="sr-only">New reply</span>
          </span>
        ) : null}
      </button>
    </div>
  )
}
