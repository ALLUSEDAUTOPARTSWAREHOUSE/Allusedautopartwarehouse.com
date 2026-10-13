'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type Summary = {
  checkedAt: string
  orders: { number: string; status: string; updatedAt: string }[] | null
  quotes: { id: number; status: string; updatedAt: string }[] | null
  missingConfiguration: string[]
}
export function AssistantSummary({ active }: { active: boolean }) {
  const [data, setData] = useState<Summary | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [refresh, setRefresh] = useState(0)
  useEffect(() => {
    if (!active) return
    const controller = new AbortController()
    setLoading(true); setError('')
    fetch('/api/admin/assistant-summary', { cache: 'no-store', signal: controller.signal }).then(async response => {
      if (!response.ok) throw new Error(response.status === 401 ? 'Session expired. Please sign in again.' : 'Summary unavailable.')
      return response.json()
    }).then(setData).catch(err => { if (err.name !== 'AbortError') setError(err.message) }).finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [active, refresh])
  return <section aria-label="Proactive business summary" className="border-b p-3 text-xs">
    <div className="flex items-center justify-between"><h3 className="font-semibold">Business updates</h3><button type="button" disabled={loading} onClick={() => setRefresh(value => value + 1)} className="rounded border px-2 py-1">{loading ? 'Checking…' : 'Refresh'}</button></div>
    {error && <p role="alert">{error}</p>}
    {data && <>
      <p className="mt-2 text-muted-foreground">Last successful check: {new Date(data.checkedAt).toLocaleString()}. Recorded data only; no automatic changes.</p>
      <h4 className="mt-2 font-semibold">Recent orders</h4>
      {data.orders === null ? <p>Orders unavailable.</p> : data.orders.length ? data.orders.map(order => <p key={order.number}>{order.number} · {order.status} · updated {order.updatedAt}</p>) : <p>No orders found.</p>}
      <h4 className="mt-2 font-semibold">Recent quote requests</h4>
      {data.quotes === null ? <p>Quotes unavailable.</p> : data.quotes.length ? data.quotes.map(quote => <p key={quote.id}>#{quote.id} · {quote.status} · updated {quote.updatedAt}</p>) : <p>No quotes found.</p>}
      <p className="mt-2">{data.missingConfiguration.length} configuration settings missing.</p>
      <div className="mt-2 flex gap-3"><Link href="/admin/sales" className="text-primary underline">Review sales</Link><Link href="/admin/settings" className="text-primary underline">Review settings</Link><Link href="/admin/merchant" className="text-primary underline">Check feed issues</Link></div>
    </>}
  </section>
}
