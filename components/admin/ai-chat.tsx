'use client'

import { useRef, useState, type FormEvent } from 'react'

type Message = { role: 'user' | 'assistant'; content: string }

export function AdminAiChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const pending = useRef(false)

  async function send(event: FormEvent) {
    event.preventDefault()
    const content = input.trim()
    if (!content || pending.current) return
    pending.current = true
    setBusy(true)
    setError('')
    const history: Message[] = [...messages, { role: 'user', content }].slice(-19)
    try {
      const response = await fetch('/api/admin/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
        signal: AbortSignal.timeout(35_000),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Unable to send message.')
      setMessages([...history, { role: 'assistant', content: data.reply }])
      setInput('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send message. Please retry.')
    } finally {
      pending.current = false
      setBusy(false)
    }
  }

  return (
    <section className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">AI Chat</h1>
        <button type="button" disabled={busy} onClick={() => { setMessages([]); setError(''); setInput('') }} className="rounded-md border px-3 py-2 text-sm disabled:opacity-50">New chat</button>
      </div>
      <p className="text-sm text-muted-foreground">Ask questions or draft customer replies. AI cannot access live business data or make changes. Do not share secrets or sensitive customer data. Messages are sent to the AI provider and are not saved by this dashboard.</p>
      <div role="log" aria-label="AI conversation" aria-live="polite" className="max-h-[55vh] min-h-48 space-y-4 overflow-y-auto rounded-lg border p-4">
        {!messages.length && <p className="text-muted-foreground">How can I help today?</p>}
        {messages.map((message, index) => (
          <div key={index} className="whitespace-pre-wrap break-words">
            <p className="text-sm font-semibold">{message.role === 'user' ? 'You' : 'AI assistant'}</p>
            <p>{message.content}</p>
          </div>
        ))}
        {busy && <p role="status">Thinking…</p>}
      </div>
      {error && <p role="alert" className="text-destructive">{error}</p>}
      <form onSubmit={send} className="space-y-2">
        <label htmlFor="ai-message" className="text-sm font-medium">Message</label>
        <textarea id="ai-message" value={input} onChange={(event) => setInput(event.target.value)} maxLength={4000} disabled={busy} rows={3} required className="w-full rounded-md border bg-background p-3" />
        <button type="submit" disabled={busy || !input.trim()} className="rounded-md bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50">{busy ? 'Sending…' : 'Send'}</button>
      </form>
    </section>
  )
}
