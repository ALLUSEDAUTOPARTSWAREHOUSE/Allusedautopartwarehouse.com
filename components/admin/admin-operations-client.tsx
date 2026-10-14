'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Activity, ArrowUpRight, Boxes, CircleDollarSign, ClipboardList, Package, RefreshCw, Search, Users } from 'lucide-react'

type Quote = {
  id: number; fullName: string; phone: string; email: string; partType: string; make: string | null
  model: string | null; year: string | null; partOption: string | null; state: string | null
  zip: string | null; notes: string | null; productName: string | null; productUrl: string | null
  status: string; quoteAmount: number | null; internalNotes: string | null; createdAt: string; updatedAt: string
}
type OrderLine = { productId: string; name: string; make: string; unitPrice: number; quantity: number; lineTotal: number; url: string }
type Order = {
  id: string; orderNumber: string; status: string; customerName: string | null; customerEmail: string | null
  customerPhone: string | null; shippingAddress: string | null; customerNotes: string | null; internalNotes: string | null
  items: OrderLine[]; subtotal: number; tax: number; shippingCost: number; totalAmount: number
  paymentGateway: string | null; createdAt: string; updatedAt: string
}
type Product = { id: string; sku: string; title: string; category: string; price: string; quantity: number; status: string | null; updatedAt: string }
type Customer = { key: string; name: string; email: string | null; phone: string | null; orders: number; paidTotal: number; quotes: number; quotesWon: number; lastActivity: string | null }
type Tab = 'quotes' | 'orders' | 'inventory' | 'customers'
type Data = { quotes: Quote[]; orders: Order[]; products: Product[]; customers: Customer[]; quoteCounts: Record<string, number>; orderCounts: Record<string, number> }

const quoteStatuses = ['new', 'contacted', 'quoted', 'won', 'lost']
const orderStatuses = ['pending', 'reserved_pending_fitment', 'confirmed', 'paid', 'shipped', 'delivered', 'cancelled']
const productStatuses = ['active', 'inactive', 'sold', 'delisted']
const money = (value: string | number | null | undefined) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value) || 0)
const date = (value: string | null) => value ? new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'

export function AdminOperationsClient() {
  const router = useRouter()
  const [data, setData] = useState<Data>({ quotes: [], orders: [], products: [], customers: [], quoteCounts: {}, orderCounts: {} })
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
      setData({
        quotes: result.quotes ?? [], orders: result.orders ?? [], products: result.products ?? [],
        customers: result.customers ?? [], quoteCounts: result.quoteCounts ?? {}, orderCounts: result.orderCounts ?? {},
      })
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not load records.')
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => { void load() }, [load])

  const update = async (type: 'quote' | 'order' | 'product', id: string | number, changes: Record<string, string | number | null>) => {
    setBusy(String(id)); setError(''); setNotice('')
    try {
      const response = await fetch('/api/admin/operations', {
        method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, id: String(id), ...changes }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Could not save the change.')
      setNotice('Saved successfully.')
      await load()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not save the change.')
    } finally { setBusy(null) }
  }

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase()
    if (!needle) return data
    const includes = (values: unknown[]) => values.some(value => String(value ?? '').toLowerCase().includes(needle))
    return {
      ...data,
      quotes: data.quotes.filter(item => includes([item.id, item.fullName, item.phone, item.email, item.partType, item.make, item.model, item.year, item.productName, item.status])),
      orders: data.orders.filter(item => includes([item.orderNumber, item.customerName, item.customerEmail, item.customerPhone, item.status, ...item.items.map(line => line.name)])),
      products: data.products.filter(item => includes([item.title, item.sku, item.category, item.status])),
      customers: data.customers.filter(item => includes([item.name, item.email, item.phone])),
    }
  }, [data, search])

  const tabs: { id: Tab; label: string; count: number; icon: typeof ClipboardList }[] = [
    { id: 'quotes', label: 'Quotes & leads', count: data.quotes.length, icon: ClipboardList },
    { id: 'orders', label: 'Orders', count: data.orders.length, icon: CircleDollarSign },
    { id: 'inventory', label: 'Inventory', count: data.products.length, icon: Boxes },
    { id: 'customers', label: 'Customers', count: data.customers.length, icon: Users },
  ]

  const pendingQuotes = Object.entries(data.quoteCounts).filter(([status]) => ['new', 'contacted'].includes(status)).reduce((n, [, count]) => n + Number(count), 0)
  const activeOrders = Object.entries(data.orderCounts).filter(([status]) => !['delivered', 'cancelled'].includes(status)).reduce((n, [, count]) => n + Number(count), 0)

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-5 py-8">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-primary">AUAPW · OPERATIONS</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Sales &amp; store operations</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Review real quote leads, manage order fulfilment, adjust inventory, and track customers in one place.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/quotes" className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted">Full quote workflow <ArrowUpRight className="size-4" /></Link>
          <Link href="/admin/team" className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted">Team &amp; access <ArrowUpRight className="size-4" /></Link>
          <button onClick={() => void load()} disabled={loading} className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"><RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} /> Refresh</button>
        </div>
      </header>

      {error && <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}
      {notice && <div role="status" className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm">{notice}</div>}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Open quote leads', value: pendingQuotes, detail: 'New or awaiting contact', icon: ClipboardList, href: '/admin/quotes' },
          { label: 'Active orders', value: activeOrders, detail: 'Not delivered or cancelled', icon: CircleDollarSign, href: '/admin/orders' },
          { label: 'Low / no stock', value: data.products.filter(item => item.quantity <= 3).length, detail: '3 units or fewer', icon: Package, href: '/admin/operations' },
          { label: 'Customer records', value: data.customers.length, detail: 'Matched across leads and orders', icon: Users, href: '/admin/customers' },
        ].map(card => {
          const Icon = card.icon
          return <Link href={card.href} key={card.label} className="rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40"><div className="flex items-center justify-between text-sm text-muted-foreground"><span>{card.label}</span><Icon className="size-4" /></div><p className="mt-3 text-3xl font-bold tabular-nums">{loading ? '—' : card.value}</p><p className="mt-1 text-xs text-muted-foreground">{card.detail}</p></Link>
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
          <label className="flex min-w-0 items-center gap-2 rounded-lg border border-border px-3 py-2 lg:w-72"><Search className="size-4 shrink-0 text-muted-foreground" /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search name, phone, SKU, order…" className="min-w-0 flex-1 bg-transparent text-sm outline-none" /></label>
        </div>

        {loading ? <div className="flex items-center justify-center gap-2 p-14 text-sm text-muted-foreground"><RefreshCw className="size-4 animate-spin" /> Loading operational records…</div> : (
          <div className="overflow-x-auto">
            {tab === 'quotes' && <table className="w-full min-w-[1050px] text-left text-sm"><thead className="bg-muted/40 text-xs uppercase text-muted-foreground"><tr><th className="p-3">Lead / requested part</th><th className="p-3">Customer contact</th><th className="p-3">Received</th><th className="p-3">Quote amount (USD)</th><th className="p-3">Status</th><th className="p-3">Full workflow</th></tr></thead><tbody>{filtered.quotes.map(item => <tr key={item.id} className="border-t border-border align-top"><td className="p-3"><p className="font-semibold">#{item.id} · {item.partType}</p><p className="mt-1">{[item.year, item.make, item.model].filter(Boolean).join(' ') || 'Vehicle not specified'}</p>{item.partOption && <p className="mt-1 text-xs text-muted-foreground">Option: {item.partOption}</p>}{item.productName && <p className="mt-1 text-xs text-primary">{item.productName}</p>}{item.notes && <p className="mt-2 max-w-xs text-xs text-muted-foreground">{item.notes}</p>}</td><td className="p-3"><p className="font-medium">{item.fullName}</p><a className="mt-1 block text-xs text-primary hover:underline" href={`tel:${item.phone.replace(/[^\d+]/g, '')}`}>{item.phone}</a>{item.email && <a className="mt-1 block text-xs text-primary hover:underline" href={`mailto:${item.email}`}>{item.email}</a>}</td><td className="p-3 whitespace-nowrap">{date(item.createdAt)}</td><td className="p-3"><input aria-label={`Quote amount for lead ${item.id}`} key={`quote-${item.id}-${item.quoteAmount ?? ''}`} type="number" min="0" step="0.01" defaultValue={item.quoteAmount ?? ''} placeholder="Not quoted" disabled={busy === String(item.id)} onBlur={event => { const raw = event.currentTarget.value; if (raw !== '' && Number(raw) !== item.quoteAmount || raw === '' && item.quoteAmount !== null) void update('quote', item.id, { status: item.status, quoteAmount: raw === '' ? null : raw }) }} className="w-32 rounded-md border border-border bg-background px-2 py-2" /></td><td className="p-3"><select aria-label={`Lead status ${item.id}`} disabled={busy === String(item.id)} value={item.status || 'new'} onChange={event => void update('quote', item.id, { status: event.target.value })} className="rounded-md border border-border bg-background px-2 py-2">{quoteStatuses.map(status => <option key={status} value={status}>{status}</option>)}</select></td><td className="p-3"><Link className="text-primary underline" href="/admin/quotes">Open lead →</Link></td></tr>)}</tbody></table>}

            {tab === 'orders' && <table className="w-full min-w-[1050px] text-left text-sm"><thead className="bg-muted/40 text-xs uppercase text-muted-foreground"><tr><th className="p-3">Order / products</th><th className="p-3">Customer</th><th className="p-3">Total</th><th className="p-3">Payment</th><th className="p-3">Order status</th><th className="p-3">Full workflow</th></tr></thead><tbody>{filtered.orders.map(item => <tr key={item.id} className="border-t border-border align-top"><td className="p-3"><p className="font-semibold">{item.orderNumber}</p><p className="mt-1 text-xs text-muted-foreground">{date(item.createdAt)} · {item.items.length} item(s)</p><ul className="mt-2 space-y-1">{item.items.slice(0, 3).map((line, index) => <li key={line.productId + index} className="text-xs">{line.name} × {line.quantity}</li>)}</ul>{item.items.length > 3 && <p className="text-xs text-muted-foreground">+{item.items.length - 3} more</p>}</td><td className="p-3"><p className="font-medium">{item.customerName || 'Customer'}</p>{item.customerPhone && <a className="mt-1 block text-xs text-primary" href={`tel:${item.customerPhone.replace(/[^\d+]/g, '')}`}>{item.customerPhone}</a>}{item.customerEmail && <a className="mt-1 block text-xs text-primary" href={`mailto:${item.customerEmail}`}>{item.customerEmail}</a>}</td><td className="p-3 whitespace-nowrap font-semibold">{money(item.totalAmount)}</td><td className="p-3">{item.paymentGateway || '—'}</td><td className="p-3"><select aria-label={`Order status ${item.orderNumber}`} disabled={busy === item.id} value={item.status || 'pending'} onChange={event => void update('order', item.id, { status: event.target.value })} className="max-w-48 rounded-md border border-border bg-background px-2 py-2">{orderStatuses.map(status => <option key={status} value={status}>{status.replaceAll('_', ' ')}</option>)}</select></td><td className="p-3"><Link className="text-primary underline" href={`/admin/orders?q=${encodeURIComponent(item.orderNumber)}`}>Open order →</Link></td></tr>)}</tbody></table>}

            {tab === 'inventory' && <><div className="flex items-center justify-between gap-3 border-b border-border bg-muted/20 px-4 py-3 text-sm"><span className="text-muted-foreground">Quick edit for marketplace listings. For the live brand catalog, prices, missing-price fixes and feed sync, use Products.</span><Link href="/admin/products" className="shrink-0 font-semibold text-primary underline">Open full product catalog →</Link></div><table className="w-full min-w-[850px] text-left text-sm"><thead className="bg-muted/40 text-xs uppercase text-muted-foreground"><tr><th className="p-3">Product</th><th className="p-3">SKU</th><th className="p-3">Price (USD)</th><th className="p-3">Quantity</th><th className="p-3">Status</th></tr></thead><tbody>{filtered.products.map(item => <tr key={item.id} className="border-t border-border"><td className="p-3"><p className="font-semibold">{item.title}</p><p className="mt-1 text-xs text-muted-foreground">{item.category}</p></td><td className="p-3 font-mono text-xs">{item.sku}</td><td className="p-3"><input aria-label={`Price for ${item.title}`} key={`price-${item.id}-${item.price}`} type="number" min="0" step="0.01" defaultValue={item.price} disabled={busy === item.id} onBlur={event => { if (event.currentTarget.value !== item.price) void update('product', item.id, { price: event.currentTarget.value }) }} className="w-28 rounded-md border border-border bg-background px-2 py-2" /></td><td className="p-3"><input aria-label={`Quantity for ${item.title}`} key={`qty-${item.id}-${item.quantity}`} type="number" min="0" step="1" defaultValue={item.quantity} disabled={busy === item.id} onBlur={event => { if (Number(event.currentTarget.value) !== item.quantity) void update('product', item.id, { quantity: event.currentTarget.value }) }} className="w-24 rounded-md border border-border bg-background px-2 py-2" /></td><td className="p-3"><select aria-label={`Product status ${item.title}`} disabled={busy === item.id} value={item.status || 'active'} onChange={event => void update('product', item.id, { status: event.target.value })} className="rounded-md border border-border bg-background px-2 py-2">{productStatuses.map(status => <option key={status} value={status}>{status}</option>)}</select></td></tr>)}</tbody></table></>}

            {tab === 'customers' && <><div className="border-b border-border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">Customers are matched across quotes and orders using email or phone, so each customer appears once.</div><table className="w-full min-w-[800px] text-left text-sm"><thead className="bg-muted/40 text-xs uppercase text-muted-foreground"><tr><th className="p-3">Customer</th><th className="p-3">Email / phone</th><th className="p-3">Orders</th><th className="p-3">Paid total</th><th className="p-3">Quotes</th><th className="p-3">Last activity</th></tr></thead><tbody>{filtered.customers.map(item => <tr key={item.key} className="border-t border-border"><td className="p-3 font-semibold">{item.name || 'Unnamed customer'}</td><td className="p-3">{item.email && <a className="block text-primary hover:underline" href={`mailto:${item.email}`}>{item.email}</a>}{item.phone && <a className="mt-1 block text-xs text-primary hover:underline" href={`tel:${item.phone.replace(/[^\d+]/g, '')}`}>{item.phone}</a>}</td><td className="p-3"><Link className="text-primary underline" href={`/admin/orders?q=${encodeURIComponent(item.email || item.phone || item.name)}`}>{item.orders}</Link></td><td className="p-3 font-semibold">{money(item.paidTotal)}</td><td className="p-3"><Link className="text-primary underline" href={`/admin/quotes?q=${encodeURIComponent(item.email || item.phone || item.name)}`}>{item.quotes} ({item.quotesWon} won)</Link></td><td className="p-3">{date(item.lastActivity)}</td></tr>)}</tbody></table></>}

            {filtered[tab === 'inventory' ? 'products' : tab].length === 0 && <div className="p-12 text-center"><Activity className="mx-auto size-7 text-muted-foreground" /><p className="mt-3 font-medium">No matching records</p><p className="mt-1 text-sm text-muted-foreground">Try another search or refresh the data.</p></div>}
          </div>
        )}
        <footer className="border-t border-border px-4 py-3 text-xs text-muted-foreground">Latest 100 records per section. Changes save immediately. Use the dedicated quote and order workspaces for assignment, notes and customer email workflows.</footer>
      </section>
    </div>
  )
}
