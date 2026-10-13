'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { authClient } from '@/lib/auth-client'
import {
  LogOut,
  ShoppingCart,
  Package,
  Settings,
  FileText,
  Search,
  RefreshCw,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  Clock3,
} from 'lucide-react'

type AccountOrderItem = { name: string; quantity: number; url: string | null }
type AccountOrder = {
  orderNumber: string
  status: string
  createdAt: string | null
  total: number
  items: AccountOrderItem[]
  itemCount: number
}
type AccountQuote = {
  id: number
  partType: string
  make: string | null
  model: string | null
  year: string | null
  productName: string | null
  productUrl: string | null
  status: string
  quoteAmount: number | null
  createdAt: string | null
  updatedAt: string | null
}
type DashboardData = {
  customer: { name: string; email: string }
  orders: AccountOrder[]
  quotes: AccountQuote[]
  limitations: string
}

const money = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const when = (value: string | null) => value ? new Date(value).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : '—'
const statusClass = (status: string) => {
  if (['paid', 'shipped', 'delivered', 'won', 'quoted'].includes(status)) return 'border-green-600/30 bg-green-600/10 text-green-700 dark:text-green-400'
  if (['cancelled', 'lost'].includes(status)) return 'border-destructive/30 bg-destructive/10 text-destructive'
  return 'border-amber-600/30 bg-amber-600/10 text-amber-700 dark:text-amber-400'
}
const prettyStatus = (status: string) => status.replace(/_/g, ' ')

export default function CustomerDashboard() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'quotes' | 'profile'>('overview')
  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadDashboard = useCallback(async (refresh = false) => {
    setError(null)
    if (refresh) setIsRefreshing(true)
    else setIsLoading(true)
    try {
      const response = await fetch('/api/customer/dashboard', {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      })
      const result = await response.json().catch(() => ({}))
      if (response.status === 401) {
        router.replace('/sign-in?redirectTo=%2Fcustomer%2Fdashboard')
        return
      }
      if (!response.ok) throw new Error(result.error || 'Could not load your account right now.')
      setData(result as DashboardData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load your account right now.')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [router])

  useEffect(() => {
    void loadDashboard()
  }, [loadDashboard])

  const handleLogout = async () => {
    await authClient.signOut()
    router.replace('/sign-in')
    router.refresh()
  }

  const totalOrderValue = data?.orders.reduce((sum, order) => sum + order.total, 0) ?? 0
  const openQuotes = data?.quotes.filter((quote) => !['won', 'lost'].includes(quote.status)).length ?? 0
  const tabs = [
    { id: 'overview', label: 'Overview', icon: ShoppingCart },
    { id: 'orders', label: 'Order history', icon: Package },
    { id: 'quotes', label: 'My quotes', icon: FileText },
    { id: 'profile', label: 'Account', icon: Settings },
  ] as const

  if (isLoading) {
    return <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="text-center">
        <RefreshCw className="mx-auto mb-4 size-8 animate-spin text-primary" aria-hidden="true" />
        <p className="text-sm text-muted-foreground">Loading your secure customer dashboard…</p>
      </div>
    </main>
  }

  return (
    <main className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">AUAPW Customer Portal</p>
            <h1 className="mt-1 truncate text-xl font-bold text-foreground sm:text-2xl">My Account</h1>
            <p className="truncate text-sm text-muted-foreground">{data?.customer.name || data?.customer.email}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button type="button" onClick={() => void loadDashboard(true)} disabled={isRefreshing} className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted disabled:opacity-60">
              <RefreshCw className={`size-4 ${isRefreshing ? 'animate-spin' : ''}`} aria-hidden="true" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button type="button" onClick={() => void handleLogout()} className="inline-flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/20">
              <LogOut className="size-4" aria-hidden="true" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
        {error ? <div role="alert" className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-foreground">
          <AlertCircle className="mt-0.5 size-5 shrink-0 text-destructive" aria-hidden="true" />
          <div className="flex-1">{error}<button className="ml-2 font-semibold text-primary underline" onClick={() => void loadDashboard(true)}>Try again</button></div>
        </div> : null}

        <nav aria-label="Customer dashboard sections" className="flex gap-2 overflow-x-auto border-b border-border pb-1">
          {tabs.map(({ id, label, icon: Icon }) => <button key={id} type="button" onClick={() => setActiveTab(id)} aria-current={activeTab === id ? 'page' : undefined} className={`inline-flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-sm font-medium transition-colors ${activeTab === id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
            <Icon className="size-4" aria-hidden="true" />{label}
          </button>)}
        </nav>

        {activeTab === 'overview' ? <section className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: 'Orders / reservations', value: data?.orders.length ?? 0, icon: Package, detail: 'Linked to this account' },
              { label: 'Order total', value: money(totalOrderValue), icon: ShoppingCart, detail: 'Total of your linked orders' },
              { label: 'Quote requests', value: data?.quotes.length ?? 0, icon: FileText, detail: 'Requests made while signed in' },
              { label: 'Quotes in progress', value: openQuotes, icon: Clock3, detail: 'Not yet won or closed' },
            ].map(({ label, value, icon: Icon, detail }) => <article key={label} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">{label}</p>
                <Icon className="size-5 text-primary" aria-hidden="true" />
              </div>
              <p className="mt-2 text-2xl font-bold tabular-nums text-foreground">{value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
            </article>)}
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            <section className="rounded-xl border border-border bg-card">
              <div className="flex items-center justify-between gap-3 border-b border-border p-4">
                <div><h2 className="font-semibold">Recent orders</h2><p className="text-xs text-muted-foreground">Latest 5 linked orders and reservations</p></div>
                <button type="button" onClick={() => setActiveTab('orders')} className="text-sm font-semibold text-primary hover:underline">View all</button>
              </div>
              <div className="divide-y divide-border">
                {(data?.orders ?? []).slice(0, 5).map((order) => <div key={order.orderNumber} className="space-y-2 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div><p className="font-mono text-sm font-semibold">{order.orderNumber}</p><p className="mt-1 text-xs text-muted-foreground">{when(order.createdAt)}</p></div>
                    <span className={`rounded-full border px-2 py-1 text-xs capitalize ${statusClass(order.status)}`}>{prettyStatus(order.status)}</span>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                    <span className="text-muted-foreground">{order.itemCount} item(s)</span><strong>{money(order.total)}</strong>
                  </div>
                </div>)}
                {data?.orders.length === 0 ? <p className="p-5 text-sm text-muted-foreground">No orders are linked to this account yet.</p> : null}
              </div>
            </section>

            <section className="rounded-xl border border-border bg-card">
              <div className="flex items-center justify-between gap-3 border-b border-border p-4">
                <div><h2 className="font-semibold">Recent quote requests</h2><p className="text-xs text-muted-foreground">Latest 5 requests</p></div>
                <button type="button" onClick={() => setActiveTab('quotes')} className="text-sm font-semibold text-primary hover:underline">View all</button>
              </div>
              <div className="divide-y divide-border">
                {(data?.quotes ?? []).slice(0, 5).map((quote) => <div key={quote.id} className="space-y-2 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div><p className="font-semibold text-foreground">Quote #{quote.id}</p><p className="mt-1 text-xs text-muted-foreground">{when(quote.createdAt)}</p></div>
                    <span className={`rounded-full border px-2 py-1 text-xs capitalize ${statusClass(quote.status)}`}>{prettyStatus(quote.status)}</span>
                  </div>
                  <p className="text-sm">{[quote.year, quote.make, quote.model, quote.productName || quote.partType].filter(Boolean).join(' ')}</p>
                  {quote.quoteAmount !== null ? <p className="text-sm font-semibold">{money(quote.quoteAmount)}</p> : <p className="text-xs text-muted-foreground">Price not quoted yet</p>}
                </div>)}
                {data?.quotes.length === 0 ? <p className="p-5 text-sm text-muted-foreground">No quote requests are linked to this account yet.</p> : null}
              </div>
            </section>
          </div>

          {data?.limitations ? <p className="rounded-lg border border-border bg-muted/30 p-4 text-xs leading-5 text-muted-foreground">{data.limitations}</p> : null}
        </section> : null}

        {activeTab === 'orders' ? <section className="space-y-4">
          <div><h2 className="text-xl font-bold">Order history</h2><p className="text-sm text-muted-foreground">Orders and reservations associated with your signed-in account.</p></div>
          {(data?.orders ?? []).length ? (data?.orders ?? []).map((order) => <article key={order.orderNumber} className="rounded-xl border border-border bg-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><p className="font-mono font-bold">{order.orderNumber}</p><p className="mt-1 text-xs text-muted-foreground">{when(order.createdAt)}</p></div>
              <div className="text-right"><span className={`rounded-full border px-2 py-1 text-xs capitalize ${statusClass(order.status)}`}>{prettyStatus(order.status)}</span><p className="mt-2 text-lg font-bold">{money(order.total)}</p></div>
            </div>
            <div className="mt-4 divide-y divide-border rounded-md border border-border">
              {order.items.map((item, index) => <div key={`${order.orderNumber}-${index}`} className="flex flex-wrap items-center justify-between gap-3 p-3 text-sm">
                {item.url ? <Link href={item.url} className="text-primary hover:underline">{item.name}</Link> : <span>{item.name}</span>}
                <span className="text-muted-foreground">Qty {item.quantity}</span>
              </div>)}
            </div>
          </article>) : <div className="rounded-xl border border-dashed border-border p-10 text-center"><Package className="mx-auto mb-3 size-8 text-muted-foreground" aria-hidden="true" /><p className="font-semibold">No linked orders yet</p><p className="mt-1 text-sm text-muted-foreground">When you place an order while signed in, it will appear here.</p><Link href="/parts" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"><Search className="size-4" />Browse parts</Link></div>}
        </section> : null}

        {activeTab === 'quotes' ? <section className="space-y-4">
          <div><h2 className="text-xl font-bold">My quote requests</h2><p className="text-sm text-muted-foreground">Submitted product details, quote status and prices when your team has quoted them.</p></div>
          {(data?.quotes ?? []).length ? (data?.quotes ?? []).map((quote) => <article key={quote.id} className="rounded-xl border border-border bg-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><p className="font-semibold">Quote #{quote.id}</p><p className="mt-1 text-xs text-muted-foreground">Submitted {when(quote.createdAt)}</p></div>
              <span className={`rounded-full border px-2 py-1 text-xs capitalize ${statusClass(quote.status)}`}>{prettyStatus(quote.status)}</span>
            </div>
            <p className="mt-4 font-semibold">{quote.productName || quote.partType}</p>
            <p className="mt-1 text-sm text-muted-foreground">{[quote.year, quote.make, quote.model, quote.partType].filter(Boolean).join(' · ')}</p>
            {quote.productUrl ? <Link href={quote.productUrl} className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">View related product <ExternalLink className="size-3.5" aria-hidden="true" /></Link> : null}
            <div className="mt-4 border-t border-border pt-3"><p className="text-xs text-muted-foreground">Quoted price</p><p className="mt-1 text-lg font-bold">{quote.quoteAmount === null ? 'Awaiting quote' : money(quote.quoteAmount)}</p></div>
          </article>) : <div className="rounded-xl border border-dashed border-border p-10 text-center"><FileText className="mx-auto mb-3 size-8 text-muted-foreground" aria-hidden="true" /><p className="font-semibold">No linked quote requests yet</p><p className="mt-1 text-sm text-muted-foreground">Submit a quote while signed in to track it here.</p><Link href="/quote" className="mt-4 inline-flex text-sm font-semibold text-primary hover:underline">Request a quote</Link></div>}
        </section> : null}

        {activeTab === 'profile' ? <section className="max-w-2xl space-y-4">
          <h2 className="text-xl font-bold">Account details</h2>
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-xs text-muted-foreground">Name</p><p className="mt-1 font-medium">{data?.customer.name || 'Not provided'}</p>
            <p className="mt-4 text-xs text-muted-foreground">Email</p><p className="mt-1 break-all font-medium">{data?.customer.email}</p>
            <p className="mt-4 text-xs text-muted-foreground">Account security</p><p className="mt-1 text-sm text-muted-foreground">Your records are loaded from your signed-in session. The dashboard does not use browser-stored customer ID tokens.</p>
          </div>
          <Link href="/parts" className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"><Search className="size-4" />Browse parts</Link>
        </section> : null}
      </div>
    </main>
  )
}
