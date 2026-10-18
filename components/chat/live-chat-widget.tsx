'use client'

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import useSWR from 'swr'
import { Send, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { QuoteForm } from '@/components/quote-form'
import { ChatPartsPanel } from '@/components/chat/chat-parts-panel'

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

type ChatTab = 'chat' | 'parts' | 'quote'

const fetcher = (url: string) => fetch(url, { cache: 'no-store' }).then((r) => r.json() as Promise<WidgetData>)

function ChatBody({ text }: { text: string }) {
  const parts = text.split(/((?:https?:\/\/[^\s<]+)|(?:\/(?:brands|used-engines|used-transmissions|quote|shop|catalog)[^\s<]*))/g)
  return (
    <span className="whitespace-pre-wrap break-words">
      {parts.map((part, i) => {
        if (part.startsWith('http') || part.startsWith('/')) {
          const href = part.replace(/[.,;:!?)]+$/, '')
          const trailing = part.slice(href.length)
          return (
            <span key={i}>
              <a
                href={href}
                className="underline underline-offset-2"
                target={href.startsWith('http') ? '_blank' : undefined}
                rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
              >
                {href}
              </a>
              {trailing}
            </span>
          )
        }
        return <span key={i}>{part}</span>
      })}
    </span>
  )
}

export function LiveChatWidget() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<ChatTab>('chat')
  const [draft, setDraft] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pendingBody, setPendingBody] = useState<string | null>(null)
  const [quotePart, setQuotePart] = useState<'' | 'Engine' | 'Transmission'>('')
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
  }, [messages.length, open, sending, tab])

  if (pathname?.startsWith('/admin')) return null

  async function send(e?: FormEvent, preset?: string) {
    e?.preventDefault()
    const body = (preset ?? draft).trim()
    if (!body || sending) return
    setTab('chat')
    setSending(true)
    setError(null)
    setPendingBody(body)
    if (!preset) setDraft('')
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
      if (!preset) setDraft(body)
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

  function openQuote(part: '' | 'Engine' | 'Transmission') {
    setQuotePart(part)
    setTab('quote')
  }

  return (
    <div className="fixed bottom-5 right-4 z-[9995] flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      {open ? (
        <section
          aria-label="AUAPW parts chatbot"
          className="flex h-[min(42rem,calc(100dvh-8.5rem))] w-[min(26rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-2xl"
        >
          <header className="flex items-center justify-between gap-3 border-b border-border bg-primary px-4 py-3 text-primary-foreground">
            <div className="flex items-center gap-3">
              <img
                src="/images/icon-chat-mechanic.jpg"
                alt=""
                width={48}
                height={48}
                className="size-12 shrink-0 rounded-full object-cover"
              />
              <div className="flex flex-col">
                <h2 className="text-sm font-bold">AUAPW parts specialist</h2>
                <p className="text-xs opacity-80">Parts, prices, links, and quotes — whenever you need them.</p>
              </div>
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

          <div className="flex border-b border-border bg-muted/40">
            {(
              [
                { id: 'chat', label: 'Chat' },
                { id: 'parts', label: 'Parts & links' },
                { id: 'quote', label: 'Quote form' },
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={cn(
                  'flex-1 px-2 py-2 text-xs font-semibold',
                  tab === item.id ? 'border-b-2 border-primary text-foreground' : 'text-muted-foreground',
                )}
              >
                {item.label}
              </button>
            ))}
          </div>

          {tab === 'chat' ? (
            <>
              <div ref={listRef} className="flex flex-1 flex-col gap-2 overflow-y-auto p-4" aria-live="polite">
                {messages.length === 0 ? (
                  <div className="flex flex-col gap-3">
                    <p className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
                      Hi! I can show product links, full part details, and a quote form. Tell me the year, make, and model plus the part you need.
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      <button type="button" onClick={() => setTab('parts')} className="rounded-full border border-border bg-background px-3 py-1.5 text-[11px] font-semibold">
                        Browse parts & links
                      </button>
                      <button type="button" onClick={() => openQuote('')} className="rounded-full border border-border bg-background px-3 py-1.5 text-[11px] font-semibold">
                        Fill quote form
                      </button>
                      <Link href="/used-engines" className="rounded-full border border-border bg-background px-3 py-1.5 text-[11px] font-semibold">
                        Used engines
                      </Link>
                      <Link href="/used-transmissions" className="rounded-full border border-border bg-background px-3 py-1.5 text-[11px] font-semibold">
                        Used transmissions
                      </Link>
                    </div>
                  </div>
                ) : (
                  messages.map((m) => (
                    <div
                      key={m.id}
                      className={cn(
                        'max-w-[85%] rounded-lg px-3 py-2 text-sm',
                        m.sender === 'customer'
                          ? 'self-end bg-primary text-primary-foreground'
                          : 'self-start bg-muted text-foreground',
                      )}
                    >
                      <span className="sr-only">{m.sender === 'customer' ? 'You: ' : 'AUAPW: '}</span>
                      <ChatBody text={m.body} />
                    </div>
                  ))
                )}
                {pendingBody ? (
                  <div className="max-w-[85%] self-end rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground opacity-80">
                    <ChatBody text={pendingBody} />
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
                    placeholder="Ask for a part, a link, or a quote…"
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
            </>
          ) : null}

          {tab === 'parts' ? <ChatPartsPanel onQuote={openQuote} /> : null}

          {tab === 'quote' ? (
            <div className="min-h-0 flex-1 overflow-y-auto p-2">
              <QuoteForm key={quotePart || 'any'} defaultPart={quotePart} compact source="chat-widget" />
            </div>
          ) : null}
        </section>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? 'Close live chat' : 'Open AUAPW parts chatbot'}
        className={cn(
          'relative flex size-24 items-center justify-center overflow-hidden rounded-full border-2 border-primary/40 bg-black text-primary-foreground shadow-2xl transition-transform hover:scale-105 sm:size-28',
          !open && 'chat-float',
        )}
      >
        {open ? (
          <X className="size-8" />
        ) : (
          <img
            src="/images/icon-chat-mechanic.jpg"
            alt=""
            width={112}
            height={112}
            className="size-full object-cover"
          />
        )}
        {hasUnread ? (
          <span className="absolute right-1 top-1 size-4 rounded-full border-2 border-background bg-destructive">
            <span className="sr-only">New reply</span>
          </span>
        ) : null}
      </button>
    </div>
  )
}
