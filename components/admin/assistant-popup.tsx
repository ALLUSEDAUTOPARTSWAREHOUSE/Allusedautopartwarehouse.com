'use client'

import { useRef, useState } from 'react'
import { Bot, X } from 'lucide-react'
import { AssistantPanel } from '@/components/admin/assistant-panel'

export function AssistantPopup() {
  const [open, setOpen] = useState(false)
  const trigger = useRef<HTMLButtonElement>(null)
  function close() {
    setOpen(false)
    trigger.current?.focus()
  }
  return (
    <aside aria-label="Store assistant" className="fixed bottom-4 right-4 z-40">
      <section
        id="admin-assistant-popup"
        hidden={!open}
        aria-label="AI assistant panel"
        onKeyDown={event => { if (event.key === 'Escape') close() }}
        className="mb-3 max-h-[75dvh] w-[min(26rem,calc(100vw-2rem))] overflow-auto rounded-xl border bg-card shadow-xl"
      >
        <div className="flex items-center justify-between border-b p-3">
          <h2 className="font-semibold">Store assistant</h2>
          <button type="button" autoFocus={open} onClick={close} aria-label="Close assistant" className="rounded-md p-2 focus-visible:outline"><X className="size-4" /></button>
        </div>
        <AssistantPanel />
      </section>
      <button
        ref={trigger}
        type="button"
        aria-expanded={open}
        aria-controls="admin-assistant-popup"
        onClick={() => setOpen(value => !value)}
        className="ml-auto flex items-center gap-2 rounded-full bg-primary px-4 py-3 font-semibold text-primary-foreground shadow-lg"
      >
        <Bot className="size-5" aria-hidden="true" />{open ? 'Hide AI' : 'Ask AI'}
      </button>
    </aside>
  )
}
