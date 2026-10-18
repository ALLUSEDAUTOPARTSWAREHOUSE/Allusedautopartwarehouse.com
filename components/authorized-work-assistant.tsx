'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { Bot, Loader2, Send, X } from 'lucide-react'

interface AssistantSession {
  authorized: boolean
  audience: 'team' | 'customer' | null
}

const fetcher = (url: string) => fetch(url).then((res) => res.json() as Promise<AssistantSession>)

export function AuthorizedWorkAssistant() {
  const { data: session, isLoading } = useSWR<AssistantSession>('/api/authorized-assistant/session', fetcher, {
    revalidateOnFocus: false,
  })
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({ api: '/api/authorized-assistant' }),
  })
  const busy = status === 'submitted' || status === 'streaming'

  if (isLoading || !session?.authorized) return null

  const isTeam = session.audience === 'team'

  function submit() {
    const text = input.trim()
    if (!text || busy) return
    void sendMessage({ text })
    setInput('')
  }

  return (
    <>
      {!open && <button type="button" onClick={() => setOpen(true)} aria-label="Open AUAPW Assistant" className="fixed bottom-5 right-5 z-[9980] flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-xl transition hover:scale-105"><Bot className="size-4" />Assistant</button>}
      {open && <section aria-label="AUAPW Assistant" className="fixed bottom-5 right-5 z-[9990] flex h-[min(620px,calc(100vh-2rem))] w-[min(420px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
        <header className="flex items-center justify-between border-b border-border bg-primary px-4 py-3 text-primary-foreground"><div><p className="font-semibold">AUAPW Assistant</p><p className="text-xs opacity-80">{isTeam ? 'Team workspace help' : 'Help with your orders and parts'}</p></div><button type="button" onClick={() => setOpen(false)} aria-label="Close assistant" className="rounded-md p-1 hover:bg-primary-foreground/10"><X className="size-4" /></button></header>
        <div className="flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite">{messages.length === 0 ? <p className="rounded-xl bg-muted p-3 text-sm text-muted-foreground">{isTeam ? 'Ask for help organizing your work, researching parts, drafting a customer reply, or understanding an AUAPW process.' : 'Ask about finding the right part, your order, or how AUAPW works.'}</p> : messages.map((message) => <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[88%] whitespace-pre-wrap rounded-xl px-3 py-2 text-sm ${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}>{message.parts.filter((part) => part.type === 'text').map((part, index) => part.type === 'text' ? <span key={index}>{part.text}</span> : null)}</div></div>)}{status === 'submitted' && <p className="flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="size-3 animate-spin" />Thinking…</p>}{error && <p className="text-xs text-destructive">Assistant unavailable. Please try again.</p>}</div>
        <form onSubmit={(event) => { event.preventDefault(); submit() }} className="border-t border-border p-3">
          <div className="flex gap-2"><label htmlFor="authorized-assistant-input" className="sr-only">Ask the assistant</label><input id="authorized-assistant-input" value={input} onChange={(event) => setInput(event.target.value)} placeholder={isTeam ? 'How can I help with your work?' : 'How can I help today?'} className="min-h-10 flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm" /><button type="submit" disabled={busy || !input.trim()} aria-label="Send message" className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground disabled:opacity-50">{busy ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}</button></div>
          <p className="mt-2 text-[11px] leading-4 text-muted-foreground">Messages are processed by a third-party AI provider. Don&apos;t share passwords, payment details, or customer personal data.</p>
        </form>
      </section>}
    </>
  )
}
