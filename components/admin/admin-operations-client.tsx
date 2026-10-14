'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Activity, ArrowUpRight, Boxes, CircleDollarSign, ClipboardList, Package, RefreshCw, Search, Users } from 'lucide-react'

type Quote = { id: string; userId: string; vin: string; year: number | null; make: string | null; model: string | null; trim: string | null; parts: unknown; status: string | null; createdAt: string; updatedAt: string }
type Order = { id: string; userId: string; orderNumber: string; status: string | null; total: string; paymentStatus: string | null; createdAt: string; updatedAt: string }
type Product = { id: string; sku: string; title: string; category: string; price: string; quantity: number; status: string | null; updatedAt: string }
type Customer = { id: string; userId: string; firstName: string | null; lastName: string | null; email: string; phone: string | null; businessName: string | null; createdAt: string }
type Tab = 'quotes' | 'orders' | 'inventory' | 'customers'
type Data = { quotes: Quote[]; orders: Order[]; products: Product[]; customers: Customer[] }

const quoteStatuses = ['pending', 'reviewed', 'quoted', 'converted', 'closed', 'rejected']
const orderStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']
const productStatuses = ['active', 'inactive', 'sold', 'delisted']
const money = (value: string | number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value) || 0)
const date = (value: string) => value ? new Date(value).toLocaleDateString() : '—'

export function AdminOperationsClient() {
  const router = useRouter()
  const [data, setData] = useState<Data>({ quotes: [], orders: [], products: [], customers: [] })
  const [tab, setTab] = useState<Tab>('quotes')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/admin/operations', { credentials: 'include', cache: 'no-store' })
      if (response.status === 401) { router.push('/admin/login'); return }
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Could not load records.')
      setData({ quotes: result.quotes ?? [], orders: result.orders ?? [], products: result.products ?? [], customers: result.customers ?? [] })
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not load records.')
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => { void load() }, [load])

  const update = async (type: 'quote' | 'order' | 'product' | 'customer', id: string, changes: Record<string, string | number>) => {
    setBusy(id)
    setError('')
    setNotice('')
    try {
      const response = await fetch('/api/admin/operations', {
        method: 'PATCH', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, id, ...changes }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Could not save the change.')
      setNotice('Saved successfully.')
      await load()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not save the change.')
    } finally {
      setBusy(null)
    }
  }

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase()
    if (!needle) return data
    const includes = (values: unknown[]) => values.some(value => String(value ?? '').toLowerCase().includes(needle))
    return {
      quotes: data.quotes.filter(item => includes([item.vin, item.make, item.model, item.year, item.status, item.userId])),
      orders: data.orders.filter(item => includes([item.orderNumber, item.status, item.paymentStatus, item.userId])),
      products: data.products.filter(item => includes([item.title, item.sku, item.category, item.status])),
      customers: data.customers.filter(item => includes([item.firstName, item.lastName, item.email, item.phone, item.businessName])),
    }
  }, [data, search])

  const tabs: { id: Tab; label: string; count: number; icon: typeof ClipboardList }[] = [
    { id: 'quotes', label: 'Quotes & leads', count: data.quotes.length, icon: ClipboardList },
    { id: 'orders', label: 'Orders', count: data.orders.length, icon: CircleDollarSign },
    { id: 'inventory', label: 'Products & inventory', count: data.products.length, icon: Boxes },
    { id: 'customers', label: 'Customers', count: data.customers.length, icon: Users },
  ]

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-5 py-8">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-primary">AUAPW · OPERATIONS</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Sales &amp; store operations</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Work customer quote requests, track order fulfilment, adjust missing or incorrect product prices, manage stock, and review customer records in one place.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/team" className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted">Team &amp; access <ArrowUpRight className="size-4" /></Link>
          <button onClick={() => void load()} disabled={loading} className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"><RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} /> Refresh</button>
        </div>
      </header>

      {error && <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}
      {notice && <div role="status" className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm">{notice}</div>}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Quote requests', value: data.quotes.filter(item => ['pending', 'reviewed'].includes(item.status || 'pending')).length, detail: 'Awaiting sales action', icon: ClipboardList },
          { label: 'Orders', value: data.orders.filter(item => !['delivered', 'cancelled', 'refunded'].includes(item.status || 'pending')).length, detail: 'Still in fulfilment', icon: CircleDollarSign },
          { label: 'Low / no stock', value: data.products.filter(item => item.quantity <= 3).length, detail: '3 units or fewer', icon: Package },
          { label: 'Customer records', value: data.customers.length, detail: 'Latest 100 records loaded', icon: Users },
        ].map(card => {
          const Icon = card.icon
          return <article key={card.label} className="rounded-xl border border-border bg-card p-4"><div className="flex items-center justify-between text-sm text-muted-foreground"><span>{card.label}</span><Icon className="size-4" /></div><p className="mt-3 text-3xl font-bold tabular-nums">{loading ? '—' : card.value}</p><p className="mt-1 text-xs text-muted-foreground">{card.detail}</p></article>
        })}
      </section>

      <section className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {tabs.map(item => {
              const Icon = item.icon
              return <button key={item.id} onClick={() => setTab(item.id)} className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${tab === item.id ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:bg-muted'}`}><Icon className="size-4" />{item.label}<span className={`rounded-md px-1.5 py-0.5 text-xs ${tab === item.id ? 'bg-primary-foreground/15' : 'bg-muted'}`}>{item.count}</span></button>
            })}
          </div>
          <label className="flex min-w-0 items-center gap-2 rounded-lg border border-border px-3 py-2 lg:w-72"><Search className="size-4 shrink-0 text-muted-foreground" /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search current records…" className="min-w-0 flex-1 bg-transparent text-sm outline-none" /></label>
        </div>

        {loading ? <div className="flex items-center justify-center gap-2 p-14 text-sm text-muted-foreground"><RefreshCw className="size-4 animate-spin" /> Loading operational records…</div> : (
          <div className="overflow-x-auto">
            {tab === 'quotes' && <table className="w-full min-w-[780px] text-left text-sm"><thead className="bg-muted/40 text-xs uppercase text-muted-foreground"><tr><th className="p-3">Vehicle / VIN</th><th className="p-3">Customer ID</th><th className="p-3">Received</th><th className="p-3">Quote status</th></tr></thead><tbody>{filtered.quotes.map(item => <tr key={item.id} className="border-t border-border"><td className="p-3"><p className="font-semibold">{[item.year, item.make, item.model, item.trim].filter(Boolean).join(' ') || 'Vehicle details missing'}</p><p className="mt-1 font-mono text-xs text-muted-foreground">{item.vin}</p></td><td className="p-3 font-mono text-xs">{item.userId}</td><td className="p-3">{date(item.createdAt)}</td><td className="p-3"><select aria-label={`Quote status ${item.vin}`} disabled={busy === item.id} value={item.status || 'pending'} onChange={event => void update('quote', item.id, { status: event.target.value })} className="rounded-md border border-border bg-background px-2 py-2 text-sm">{quoteStatuses.map(status => <option key={status} value={status}>{status}</option>)}</select></td></tr>)}</tbody></table>}

            {tab === 'orders' && <table className="w-full min-w-[780px] text-left text-sm"><thead className="bg-muted/40 text-xs uppercase text-muted-foreground"><tr><th className="p-3">Order</th><th className="p-3">Customer ID</th><th className="p-3">Total</th><th className="p-3">Payment</th><th className="p-3">Order status</th></tr></thead><tbody>{filtered.orders.map(item => <tr key={item.id} className="border-t border-border"><td className="p-3"><p className="font-semibold">{item.orderNumber}</p><p className="mt-1 text-xs text-muted-foreground">{date(item.createdAt)}</p></td><td className="p-3 font-mono text-xs">{item.userId}</td><td className="p-3 font-semibold">{money(item.total)}</td><td className="p-3"><span className="rounded-full bg-muted px-2 py-1 text-xs">{item.paymentStatus || 'unknown'}</span></td><td className="p-3"><select aria-label={`Order status ${item.orderNumber}`} disabled={busy === item.id} value={item.status || 'pending'} onChange={event => void update('order', item.id, { status: event.target.value })} className="rounded-md border border-border bg-background px-2 py-2 text-sm">{orderStatuses.map(status => <option key={status} value={status}>{status}</option>)}</select></td></tr>)}</tbody></table>}

            {tab === 'inventory' && <table className="w-full min-w-[850px] text-left text-sm"><thead className="bg-muted/40 text-xs uppercase text-muted-foreground"><tr><th className="p-3">Product</th><th className="p-3">SKU</th><th className="p-3">Price (USD)</th><th className="p-3">Quantity</th><th className="p-3">Status</th></tr></thead><tbody>{filtered.products.map(item => <tr key={item.id} className="border-t border-border"><td className="p-3"><p className="font-semibold">{item.title}</p><p className="mt-1 text-xs text-muted-foreground">{item.category}</p></td><td className="p-3 font-mono text-xs">{item.sku}</td><td className="p-3"><input aria-label={`Price for ${item.title}`} key={`price-${item.id}-${item.price}`} type="number" min="0" step="0.01" defaultValue={item.price} disabled={busy === item.id} onBlur={event => { if (event.currentTarget.value !== item.price) void update('product', item.id, { price: event.currentTarget.value }) }} className="w-28 rounded-md border border-border bg-background px-2 py-2" /></td><td className="p-3"><input aria-label={`Quantity for ${item.title}`} key={`qty-${item.id}-${item.quantity}`} type="number" min="0" step="1" defaultValue={item.quantity} disabled={busy === item.id} onBlur={event => { if (Number(event.currentTarget.value) !== item.quantity) void update('product', item.id, { quantity: event.currentTarget.value }) }} className="w-24 rounded-md border border-border bg-background px-2 py-2" /></td><td className="p-3"><select aria-label={`Product status ${item.title}`} disabled={busy === item.id} value={item.status || 'active'} onChange={event => void update('product', item.id, { status: event.target.value })} className="rounded-md border border-border bg-background px-2 py-2">{productStatuses.map(status => <option key={status} value={status}>{status}</option>)}</select></td></tr>)}</tbody></table>}

            {tab === 'customers' && <table className="w-full min-w-[780px] text-left text-sm"><thead className="bg-muted/40 text-xs uppercase text-muted-foreground"><tr><th className="p-3">Customer</th><th className="p-3">Business</th><th className="p-3">Email / phone</th><th className="p-3">Joined</th></tr></thead><tbody>{filtered.customers.map(item => <tr key={item.id} className="border-t border-border"><td className="p-3"><p className="font-semibold">{[item.firstName, item.lastName].filter(Boolean).join(' ') || 'Customer'}</p><p className="mt-1 font-mono text-xs text-muted-foreground">{item.userId}</p></td><td className="p-3"><input aria-label={`Business name for ${item.email}`} key={`business-${item.userId}-${item.businessName ?? ''}`} defaultValue={item.businessName ?? ''} placeholder="Business name" disabled={busy === item.userId} onBlur={event => { if (event.currentTarget.value !== (item.businessName ?? '')) void update('customer', item.userId, { businessName: event.currentTarget.value }) }} className="w-44 rounded-md border border-border bg-background px-2 py-2" /></td><td className="p-3"><p>{item.email}</p><input aria-label={`Phone for ${item.email}`} key={`phone-${item.userId}-${item.phone ?? ''}`} defaultValue={item.phone ?? ''} placeholder="Add phone" disabled={busy === item.userId} onBlur={event => { if (event.currentTarget.value !== (item.phone ?? '')) void update('customer', item.userId, { phone: event.currentTarget.value }) }} className="mt-1 w-40 rounded-md border border-border bg-background px-2 py-2 text-xs" /></td><td className="p-3">{date(item.createdAt)}</td></tr>)}</tbody></table>}

            {filtered[tab].length === 0 && <div className="p-12 text-center"><Activity className="mx-auto size-7 text-muted-foreground" /><p className="mt-3 font-medium">No matching records</p><p className="mt-1 text-sm text-muted-foreground">Try another search or refresh the data.</p></div>}
          </div>
        )}
        <footer className="border-t border-border px-4 py-3 text-xs text-muted-foreground">Latest 100 records per section. Status and inventory changes are saved to the database immediately.</footer>
      </section>
    </div>
  )
}
