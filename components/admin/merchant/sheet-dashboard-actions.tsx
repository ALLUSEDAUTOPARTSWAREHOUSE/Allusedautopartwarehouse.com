'use client'

import { useActionState } from 'react'
import { syncProducts } from '@/app/admin/catalog-actions'

export function SheetDashboardActions() {
  const [state, action, pending] = useActionState(syncProducts, { ok: false, message: '' })
  return <section aria-label="Publishing and development" className="space-y-3 rounded-2xl border bg-card p-5">
    <h2 className="text-lg font-semibold">Publish & develop</h2>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <form action={action}><button disabled={pending} className="w-full rounded-xl bg-primary px-4 py-4 font-semibold text-primary-foreground disabled:opacity-50">{pending ? 'Refreshing website…' : 'Website sync'}</button></form>
      <a href="/admin/ads" className="rounded-xl border px-4 py-4 text-center font-semibold">Ads product feed · setup</a>
      <a href="https://merchants.google.com/" target="_blank" rel="noopener noreferrer" className="rounded-xl border px-4 py-4 text-center font-semibold">Google Merchant sync ↗</a>
      <a href="https://v0.app/" target="_blank" rel="noopener noreferrer" className="rounded-xl border px-4 py-4 text-center font-semibold">Build sheet / develop in v0 ↗</a>
    </div>
    <p role="status" className="text-sm">{state.message}</p>
    <p className="text-xs text-muted-foreground">Website sync refreshes saved catalog caches, not staged sheets. Google and ads buttons open setup/account pages; they do not send products automatically. v0 opens separately; sign in and start or select your chat. No sheet or credentials are sent to v0.</p>
  </section>
}
