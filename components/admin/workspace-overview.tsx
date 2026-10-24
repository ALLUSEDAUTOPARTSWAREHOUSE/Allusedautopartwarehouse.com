'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import type { DashboardMetrics } from '@/lib/admin-metrics'

type Summary = {
  checkedAt: string
  metrics: DashboardMetrics | null
  unreadConversations: number | null
  missingRequiredConfiguration: string[]
}
const money = (value: number) => value.toLocaleString('en-US', { style: 'currency', currency: 'USD' })

export function WorkspaceOverview() {
  const [data, setData] = useState<Summary | null>(null)
  const [error, setError] = useState(false)
  const load = useCallback(async (signal: AbortSignal) => {
    try {
      const response = await fetch('/api/admin/workspace-summary', { cache: 'no-store', credentials: 'include', signal })
      if (!response.ok) throw new Error('Unable to load overview')
      const summary: Summary = await response.json()
      if (!signal.aborted) { setData(summary); setError(false) }
    } catch {
      if (!signal.aborted) setError(true)
    }
  }, [])
  useEffect(() => {
    const controller = new AbortController()
    void load(controller.signal)
    const timer = setInterval(() => void load(controller.signal), 60_000)
    return () => { controller.abort(); clearInterval(timer) }
  }, [load])

  const metrics = data?.metrics
  // Partial query failures must not look like genuine zero totals.
  const available = (sections: string[]) => metrics && !metrics.errors.some(error => sections.includes(error.section))
  return <section aria-labelledby="workspace-live-heading" className="space-y-4 rounded-2xl border border-border bg-card p-6">
    <h2 id="workspace-live-heading" className="text-xl font-semibold">Live sales & support overview</h2>
    <p className="text-sm text-muted-foreground">Refreshes every 60 seconds. {data ? `Last checked: ${new Date(data.checkedAt).toLocaleString()}.` : 'Loading connected records…'}</p>
    {error && <p role="alert" className="text-sm text-destructive">Refresh failed. Previously loaded values may be stale. Check your session and connection.</p>}
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {[
        { label: 'Unread customer conversations', value: data?.unreadConversations, href: '/admin/chats' },
        { label: 'New quote leads', value: available(['Quote requests']) ? metrics?.actions.newQuotes : null, href: '/admin/quotes' },
        { label: 'Pending orders', value: available(['Orders']) ? metrics?.actions.pendingOrders : null, href: '/admin/orders?status=pending' },
        { label: 'Paid revenue · last 30 days', value: available(['Orders']) ? money(metrics!.last30.revenue) : null, href: '/admin/dashboard' },
      ].map(item => <Link key={item.label} href={item.href} className="rounded-xl border border-border p-4 hover:bg-muted">
        <p className="text-sm text-muted-foreground">{item.label}</p>
        <p className="mt-2 text-2xl font-semibold">{item.value ?? 'Unavailable'}</p>
      </Link>)}
    </div>
    <div className="space-y-2 text-sm">
      <h3 className="font-semibold">Revenue risks, not confirmed losses</h3>
      <p>Awaiting payment: {available(['Orders']) ? `${metrics!.awaitingPayment.orders} orders · ${money(metrics!.awaitingPayment.amount)}` : 'Unavailable'}. Unpaid orders and unworked leads are opportunities for follow-up, not measured revenue losses.</p>
      <p>Follow-ups over 24 hours: {available(['Orders', 'Quote requests']) ? `${metrics!.actions.staleNewQuotes} new quotes · ${metrics!.actions.stalePendingOrders} pending orders` : 'Unavailable'}.</p>
      {data?.missingRequiredConfiguration.length ? <p role="status">Required setup missing: {data.missingRequiredConfiguration.join(', ')}. <Link href="/admin/settings" className="underline">Review setup</Link></p> : null}
      {data && <p>Configuration checks show presence only, not working credentials or provider connectivity.</p>}
      {metrics?.errors.length ? <p role="status">Some business records are unavailable. <Link href="/admin/settings" className="underline">Review database health</Link>.</p> : null}
      <Link href="/admin/dashboard" className="inline-block text-primary underline">Full dashboard & business records →</Link>
    </div>
  </section>
}
