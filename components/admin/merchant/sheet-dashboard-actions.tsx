'use client'

import { useActionState, useState } from 'react'
import { syncProducts } from '@/app/admin/catalog-actions'

const PROJECT_CONTEXT = `Project: All Used Auto Parts Warehouse
Repository: https://github.com/ALLUSEDAUTOPARTSWAREHOUSE/Allusedautopartwarehouse.com
Website: https://www.allusedautopartswarehouse.com
Upload dashboard: https://www.allusedautopartswarehouse.com/admin/uploads
AI workspace: https://www.allusedautopartswarehouse.com/admin/ai-chat
Google feed: https://www.allusedautopartswarehouse.com/feeds/google-shopping.xml
Workflow: upload to private storage, preview without changes, then explicitly confirm import.
Limits: 500 MB storage; 20 MB synchronous workbook import. Storage is not proof of import or external acceptance.
Help improve this same project. Inspect the current source and verify live status before claiming success. Preserve products and order history. Never request passwords or tokens in chat.
Context contains public project links only, not live sheet status, customer data, or credentials.`

export function SheetDashboardActions() {
  const [copyMessage, setCopyMessage] = useState('')
  async function copyContext() {
    try { await navigator.clipboard.writeText(PROJECT_CONTEXT); setCopyMessage('Project context copied. Paste into your v0 or ChatGPT chat.') }
    catch { setCopyMessage('Clipboard unavailable. Select and copy the project context below.') }
  }
  const [state, action, pending] = useActionState(syncProducts, { ok: false, message: '' })
  return <section aria-label="Publishing and development" className="space-y-3 rounded-2xl border bg-card p-5">
    <h2 className="text-lg font-semibold">Publish & develop</h2>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <form action={action}><button disabled={pending} className="w-full rounded-xl bg-primary px-4 py-4 font-semibold text-primary-foreground disabled:opacity-50">{pending ? 'Refreshing website…' : 'Website sync'}</button></form>
      <a href="/admin/ads" className="rounded-xl border px-4 py-4 text-center font-semibold">Ads product feed · setup</a>
      <a href="https://merchants.google.com/" target="_blank" rel="noopener noreferrer" className="rounded-xl border px-4 py-4 text-center font-semibold">Google Merchant sync ↗</a>
      <a href="https://v0.app/" target="_blank" rel="noopener noreferrer" className="rounded-xl border px-4 py-4 text-center font-semibold">Build sheet / develop in v0 ↗</a>
    </div>
    <div className="space-y-3 rounded-xl border p-4">
      <h3 className="font-semibold">Same-project AI workspace</h3>
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={() => void copyContext()} className="rounded-lg border px-4 py-2 font-semibold">Copy project context & links</button>
        <a href="https://chatgpt.com/" target="_blank" rel="noopener noreferrer" className="rounded-lg border px-4 py-2 font-semibold">Open ChatGPT ↗</a>
        <a href="/admin/ai-chat" className="rounded-lg border px-4 py-2 font-semibold">Cloud AI · project assistant</a>
        <a href="/admin/operations-center" className="rounded-lg border px-4 py-2 font-semibold">AI Operations Center</a>
      </div>
      <p role="status" className="text-sm">{copyMessage}</p>
      <details><summary className="cursor-pointer text-sm">Review project context before sharing</summary><textarea readOnly aria-label="Public project context" value={PROJECT_CONTEXT} rows={12} className="mt-3 w-full rounded border bg-background p-3 text-sm" /></details>
      <p className="text-xs text-muted-foreground">Copy context, open v0 or ChatGPT, then paste into the chat for this repository. External accounts, chat history, files and credentials are not automatically synced. The existing cloud assistant requires configured AI access; opening it does not guarantee model availability.</p>
    </div>
    <p role="status" className="text-sm">{state.message}</p>
    <p className="text-xs text-muted-foreground">Website sync refreshes saved catalog caches, not staged sheets. Google and ads buttons open setup/account pages; they do not send products automatically. v0 opens separately; sign in and start or select your chat. No sheet or credentials are sent to v0.</p>
  </section>
}
