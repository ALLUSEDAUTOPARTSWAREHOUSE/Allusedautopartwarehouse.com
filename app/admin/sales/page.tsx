import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getAdminSession } from '@/lib/admin-auth'
import { listOrders, listQuoteLeads } from '@/lib/followup'
import { StatusBadge } from '@/components/admin/status-badge'
import { FollowupAssignmentSelect } from '@/components/admin/followup-assignment-select'
import { getActiveSalesSupportStaff, getFollowupAssignments } from '@/lib/followup-assignments'
import { getQuoteProductInfo } from '@/lib/quote-product-info'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Sales & Support Workspace | AUAPW Admin', robots: { index: false } }

const money = (amount: number) => `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const when = (value: string) => value ? new Date(value).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : '—'

export default async function SalesSupportWorkspace() {
  if (!(await getAdminSession())) redirect('/admin/login')

  const [ordersResult, quotesResult] = await Promise.allSettled([
    listOrders(undefined, undefined, 50),
    listQuoteLeads(undefined, undefined, 50),
  ])
  const orders = ordersResult.status === 'fulfilled' ? ordersResult.value : null
  const quotes = quotesResult.status === 'fulfilled' ? quotesResult.value : null
  const [staff, orderAssignments, quoteAssignments, quoteProducts] = await Promise.all([
    getActiveSalesSupportStaff().catch(() => []),
    getFollowupAssignments('order', (orders ?? []).map((order) => order.id)).catch(() => new Map()),
    getFollowupAssignments('quote', (quotes ?? []).map((quote) => String(quote.id))).catch(() => new Map()),
    Promise.all((quotes ?? []).map(async (quote) => [String(quote.id), await getQuoteProductInfo(quote)] as const))
      .then((entries) => new Map(entries)),
  ])

  return (
    <div className="mx-auto max-w-[96rem] space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Sales &amp; Support Workspace</h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            One queue for customer product-page quote requests, cart orders, and reservations. Assign each record to an active sales agent or support team member and open the submitted product page directly.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          <Link href="/admin/team" className="rounded-md border border-border px-3 py-2 hover:bg-muted">Manage team</Link>
          <Link href="/admin/settings" className="rounded-md border border-border px-3 py-2 hover:bg-muted">Email/system health</Link>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Recent orders / reservations', count: orders?.length ?? 'Unavailable', href: '/admin/orders' },
          { label: 'Recent quote requests', count: quotes?.length ?? 'Unavailable', href: '/admin/quotes' },
          { label: 'Active sales/support members', count: staff.length, href: '/admin/team' },
          { label: 'Team email routing', count: staff.length ? 'Configured roster' : 'No active recipients', href: '/admin/settings' },
        ].map((card) => (
          <Link key={card.label} href={card.href} className="rounded-xl border border-border bg-card p-4 hover:bg-muted/40">
            <p className="text-xs text-muted-foreground">{card.label}</p>
            <p className="mt-1 text-xl font-bold">{card.count}</p>
          </Link>
        ))}
      </section>

      <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
        <h2 className="text-lg font-semibold">How assignments and emails work</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Every new order, reservation, and quote is saved in the database and appears in the relevant table below. Active Sales Agents and Support Team members are the notification recipients; Developer Team members are not included in customer-work alerts. Resend must have a valid API key and verified sender domain for email delivery. A failed email does not delete a customer request—use System Health to check sender configuration and the detailed orders/quotes pages to follow up.
        </p>
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">Recent orders &amp; reservations</h2>
            <p className="text-xs text-muted-foreground">Latest 50 database records · products, contact details, status, totals, timestamps and assignment.</p>
          </div>
          <Link href="/admin/orders" className="text-sm font-medium text-primary hover:underline">Search all orders →</Link>
        </div>
        {orders === null ? <p role="alert" className="rounded-lg border border-destructive/30 p-4 text-sm">Orders could not be loaded. Check Settings → System Health.</p>
        : orders.length === 0 ? <p className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">No customer orders or reservations have been recorded yet.</p>
        : <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="min-w-[1180px] w-full text-left text-sm">
            <thead className="bg-muted/50 text-xs text-muted-foreground"><tr>
              {['Order', 'Customer / contact', 'Products from catalog', 'Status', 'Total', 'Created', 'Updated', 'Assigned sales/support', 'Actions'].map((heading) => <th key={heading} scope="col" className="p-3 font-medium">{heading}</th>)}
            </tr></thead>
            <tbody>{orders.map((order) => (
              <tr key={order.id} className="border-t border-border align-top">
                <td className="p-3 font-mono text-xs">{order.orderNumber}</td>
                <td className="p-3"><div className="font-medium">{order.customerName || 'Not provided'}</div>
                  {order.customerEmail ? <a href={`mailto:${order.customerEmail}`} className="break-all text-xs text-primary hover:underline">{order.customerEmail}</a> : null}
                  {order.customerPhone ? <a href={`tel:${order.customerPhone.replace(/[^\d+]/g, '')}`} className="block text-xs text-primary hover:underline">{order.customerPhone}</a> : null}
                </td>
                <td className="max-w-72 p-3">{order.items.map((item) => (
                  <div key={item.productId} className="mb-1"><Link href={item.url} target="_blank" className="text-primary hover:underline">{item.name}</Link><span className="ml-1 whitespace-nowrap text-xs text-muted-foreground">×{item.quantity}</span></div>
                ))}</td>
                <td className="p-3"><StatusBadge status={order.status} /></td>
                <td className="p-3 whitespace-nowrap font-semibold">{money(order.totalAmount)}</td>
                <td className="p-3 whitespace-nowrap text-xs">{when(order.createdAt)}</td>
                <td className="p-3 whitespace-nowrap text-xs">{when(order.updatedAt)}</td>
                <td className="p-3"><FollowupAssignmentSelect compact recordType="order" recordId={order.id} staff={staff} assignment={orderAssignments.get(order.id) ?? null} /></td>
                <td className="p-3"><Link href={`/admin/orders?q=${encodeURIComponent(order.orderNumber)}`} className="whitespace-nowrap text-primary underline">Manage order →</Link></td>
              </tr>
            ))}</tbody>
          </table>
        </div>}
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">Recent quotes &amp; product-page inquiries</h2>
            <p className="text-xs text-muted-foreground">Latest 50 requests · source page, vehicle, requested part, quote status, and assignment.</p>
          </div>
          <Link href="/admin/quotes" className="text-sm font-medium text-primary hover:underline">Search all quotes →</Link>
        </div>
        {quotes === null ? <p role="alert" className="rounded-lg border border-destructive/30 p-4 text-sm">Quote requests could not be loaded. Check Settings → System Health.</p>
        : quotes.length === 0 ? <p className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">No customer quote requests have been recorded yet.</p>
        : <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="min-w-[1280px] w-full text-left text-sm">
            <thead className="bg-muted/50 text-xs text-muted-foreground"><tr>
              {['Quote #', 'Customer / contact', 'Vehicle / requested part', 'Related product / catalog price', 'Status', 'Quoted price', 'Created', 'Updated', 'Assigned sales/support', 'Actions'].map((heading) => <th key={heading} scope="col" className="p-3 font-medium">{heading}</th>)}
            </tr></thead>
            <tbody>{quotes.map((quote) => (
              <tr key={quote.id} className="border-t border-border align-top">
                <td className="p-3 font-mono text-xs">#{quote.id}</td>
                <td className="p-3"><div className="font-medium">{quote.fullName || 'Not provided'}</div>
                  {quote.email ? <a href={`mailto:${quote.email}`} className="break-all text-xs text-primary hover:underline">{quote.email}</a> : null}
                  {quote.phone ? <a href={`tel:${quote.phone.replace(/[^\d+]/g, '')}`} className="block text-xs text-primary hover:underline">{quote.phone}</a> : null}
                </td>
                <td className="p-3">{[quote.year, quote.make, quote.model].filter(Boolean).join(' ')}<div className="text-xs text-muted-foreground">{quote.partType}{quote.partOption ? ` · ${quote.partOption}` : ''}</div></td>
                <td className="p-3">
                  {quoteProducts.get(String(quote.id))?.url
                    ? <Link href={quoteProducts.get(String(quote.id))!.url!} target="_blank" className="font-medium text-primary underline">{quoteProducts.get(String(quote.id))?.name || "View related product"} ↗</Link>
                    : <span className="text-xs text-muted-foreground">{quote.source || "Website form"} (no catalog product linked)</span>}
                  {quoteProducts.get(String(quote.id))?.priceMissing && quoteProducts.get(String(quote.id))?.priceEditorUrl
                    ? <Link href={quoteProducts.get(String(quote.id))!.priceEditorUrl!} className="mt-2 block text-xs font-semibold text-amber-600 underline">Missing price — set it now →</Link>
                    : null}
                </td>
                <td className="p-3"><StatusBadge status={quote.status} /></td>
                <td className="p-3 whitespace-nowrap">{quote.quoteAmount === null ? 'Not quoted' : money(quote.quoteAmount)}</td>
                <td className="p-3 whitespace-nowrap text-xs">{when(quote.createdAt)}</td>
                <td className="p-3 whitespace-nowrap text-xs">{when(quote.updatedAt)}</td>
                <td className="p-3"><FollowupAssignmentSelect compact recordType="quote" recordId={String(quote.id)} staff={staff} assignment={quoteAssignments.get(String(quote.id)) ?? null} /></td>
                <td className="p-3"><Link href={`/admin/quotes?q=${encodeURIComponent(quote.email || quote.fullName)}`} className="whitespace-nowrap text-primary underline">Manage quote →</Link></td>
              </tr>
            ))}</tbody>
          </table>
        </div>}
      </section>
    </div>
  )
}
