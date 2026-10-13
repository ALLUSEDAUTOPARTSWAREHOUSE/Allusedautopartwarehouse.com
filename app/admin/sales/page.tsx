import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getAdminSession } from '@/lib/admin-auth'
import {
  ORDER_STATUSES,
  QUOTE_STATUSES,
  countByStatus,
  listOrders,
  listQuoteLeads,
  type CustomerOrder,
  type QuoteLead,
} from '@/lib/followup'
import { FollowupFilters } from '@/components/admin/followup-filters'
import { OrderCard } from '@/components/admin/order-card'
import { QuoteLeadCard } from '@/components/admin/quote-lead-card'
import { getActiveSalesSupportStaff, getFollowupAssignments } from '@/lib/followup-assignments'
import { getQuoteProductInfo } from '@/lib/quote-product-info'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Sales & Support Workspace | AUAPW Admin', robots: { index: false } }

type QueueItem =
  | { kind: 'order'; id: string; createdAt: string; order: CustomerOrder }
  | { kind: 'quote'; id: string; createdAt: string; quote: QuoteLead }

const sumCounts = (counts: Record<string, number>) =>
  Object.values(counts).reduce((sum, value) => sum + Number(value || 0), 0)

export default async function SalesSupportWorkspace({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>
}) {
  if (!(await getAdminSession())) redirect('/admin/login')

  const params = await searchParams
  const query = params.q?.trim().slice(0, 100) || undefined
  const orderStatus = ORDER_STATUSES.find((status) => status === params.status)
  const quoteStatus = QUOTE_STATUSES.find((status) => status === params.status)
  const activeStatus = orderStatus ?? quoteStatus

  // One shared queue, while keeping each record's existing status validation/action form.
  // Filtering one kind never accidentally includes the other kind's records.
  const [ordersResult, quotesResult, orderCountsResult, quoteCountsResult, staffResult] = await Promise.allSettled([
    quoteStatus ? Promise.resolve([] as CustomerOrder[]) : listOrders(orderStatus, query, 100),
    orderStatus ? Promise.resolve([] as QuoteLead[]) : listQuoteLeads(quoteStatus, query, 100),
    countByStatus('orders'),
    countByStatus('leads'),
    getActiveSalesSupportStaff(),
  ])

  const orders = ordersResult.status === 'fulfilled' ? ordersResult.value : []
  const quotes = quotesResult.status === 'fulfilled' ? quotesResult.value : []
  const orderCounts = orderCountsResult.status === 'fulfilled' ? orderCountsResult.value : {}
  const quoteCounts = quoteCountsResult.status === 'fulfilled' ? quoteCountsResult.value : {}
  const staff = staffResult.status === 'fulfilled' ? staffResult.value : []
  const counts = { ...orderCounts, ...quoteCounts }
  const statusOptions = [...ORDER_STATUSES, ...QUOTE_STATUSES]

  const [staffOrderAssignments, staffQuoteAssignments, quoteProductEntries] = await Promise.all([
    getFollowupAssignments('order', orders.map((order) => order.id)).catch(() => new Map()),
    getFollowupAssignments('quote', quotes.map((quote) => String(quote.id))).catch(() => new Map()),
    Promise.all(quotes.map(async (quote) => [String(quote.id), await getQuoteProductInfo(quote)] as const))
      .then((entries) => new Map(entries)),
  ])

  const queue: QueueItem[] = [
    ...orders.map((order): QueueItem => ({ kind: 'order', id: order.id, createdAt: order.createdAt, order })),
    ...quotes.map((quote): QueueItem => ({ kind: 'quote', id: String(quote.id), createdAt: quote.createdAt, quote })),
  ].sort((a, b) => {
    const aTime = Date.parse(a.createdAt) || 0
    const bTime = Date.parse(b.createdAt) || 0
    return bTime - aTime
  })

  return (
    <div className="mx-auto max-w-[96rem] space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Sales &amp; Support Workspace</h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            One searchable queue for quote leads, product-page enquiries, purchases, and reservations. Each record keeps its own status, pricing, customer details, product links, notes, and assignment controls.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          <Link href="/admin/team" className="rounded-md border border-border px-3 py-2 hover:bg-muted">Manage team</Link>
          <Link href="/admin/settings" className="rounded-md border border-border px-3 py-2 hover:bg-muted">Email / system health</Link>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Customer work summary">
        {[
          { label: 'Orders & reservations', count: orderCountsResult.status === 'fulfilled' ? sumCounts(orderCounts) : 'Unavailable', href: '/admin/orders' },
          { label: 'Quote leads', count: quoteCountsResult.status === 'fulfilled' ? sumCounts(quoteCounts) : 'Unavailable', href: '/admin/quotes' },
          { label: 'Active sales / support staff', count: staffResult.status === 'fulfilled' ? staff.length : 'Unavailable', href: '/admin/team' },
          { label: 'Currently shown in queue', count: queue.length, href: '/admin/sales' },
        ].map((card) => (
          <Link key={card.label} href={card.href} className="rounded-xl border border-border bg-card p-4 hover:bg-muted/40">
            <p className="text-xs text-muted-foreground">{card.label}</p>
            <p className="mt-1 text-xl font-bold">{card.count}</p>
          </Link>
        ))}
      </section>

      <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
        <h2 className="text-lg font-semibold">Every customer request in one place</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Purchased items link to the exact product pages and retain quantity and unit pricing. Quote leads show their related product page and a quick link to fix a missing catalog price. Use each card to update the record's status, save notes, email a customer quote/update, and assign an active Sales Agent or Support Team member. Developer Team members are not included in customer-work alerts.
        </p>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">All customer activity</h2>
            <p className="text-xs text-muted-foreground">
              Orders, reservations, and quote leads are combined by newest activity. Filter by either order or quote status, or search across customer names and contact details.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-sm">
            <Link href="/admin/orders" className="text-primary underline">Detailed orders →</Link>
            <Link href="/admin/quotes" className="text-primary underline">Detailed quote leads →</Link>
          </div>
        </div>

        <FollowupFilters
          basePath="/admin/sales"
          statuses={statusOptions}
          counts={counts}
          activeStatus={activeStatus}
          query={query}
          searchPlaceholder="Search order #, customer, phone, email, make, model…"
        />

        <section className="overflow-hidden rounded-xl border border-border bg-card" aria-label="Sales and support activity table">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
            <div>
              <h3 className="font-semibold">Activity table</h3>
              <p className="mt-1 text-xs text-muted-foreground">A compact view of customer, product, owner, value, and next-step status.</p>
            </div>
            <span className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground">{queue.length} records</span>
          </div>
          {queue.length === 0 ? (
            <p className="p-5 text-sm text-muted-foreground">No matching activity to display.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px] text-left text-sm">
                <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Type / Reference</th>
                    <th className="px-4 py-3 font-semibold">Customer</th>
                    <th className="px-4 py-3 font-semibold">Product / Request</th>
                    <th className="px-4 py-3 font-semibold">Assigned owner</th>
                    <th className="px-4 py-3 text-right font-semibold">Value</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {queue.map((item) => {
                    const isOrder = item.kind === 'order'
                    const customer = isOrder ? item.order.customerName : item.quote.fullName
                    const contact = isOrder ? (item.order.customerEmail || item.order.customerPhone || 'No contact') : (item.quote.email || item.quote.phone || 'No contact')
                    const product = isOrder
                      ? item.order.items.map((line) => line.name).join(', ') || 'Items not listed'
                      : [item.quote.year, item.quote.make, item.quote.model, item.quote.partType, item.quote.partOption].filter(Boolean).join(' · ') || 'Part request'
                    const assignment = isOrder ? staffOrderAssignments.get(item.id) : staffQuoteAssignments.get(item.id)
                    const amount = isOrder ? item.order.totalAmount : item.quote.quoteAmount
                    const status = isOrder ? item.order.status : item.quote.status
                    const reference = isOrder ? item.order.orderNumber : `Quote #${item.id}`
                    return (
                      <tr key={`activity-${item.kind}-${item.id}`} className="align-top hover:bg-muted/20">
                        <td className="whitespace-nowrap px-4 py-3">
                          <span className="block font-mono text-xs font-semibold">{reference}</span>
                          <span className="mt-1 inline-flex rounded-full border border-border px-2 py-0.5 text-[11px] capitalize text-muted-foreground">{isOrder ? 'Order' : 'Quote lead'}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="block max-w-[190px] truncate font-medium" title={customer}>{customer}</span>
                          <span className="mt-1 block max-w-[190px] truncate text-xs text-muted-foreground" title={contact}>{contact}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="block max-w-[300px] truncate" title={product}>{product}</span>
                          {isOrder ? (
                            <span className="mt-1 block text-xs text-muted-foreground">{item.order.items.length} line item(s)</span>
                          ) : quoteProductEntries.get(item.id)?.url ? (
                            <Link href={quoteProductEntries.get(item.id)!.url!} target="_blank" className="mt-1 inline-block text-xs text-primary underline">Open related product ↗</Link>
                          ) : (
                            <span className="mt-1 block text-xs text-muted-foreground">{item.quote.source || 'Customer request'}</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {assignment?.staffName ? (
                            <>
                              <span className="block font-medium">{assignment.staffName}</span>
                              <span className="mt-1 block text-xs capitalize text-muted-foreground">{assignment.staffRole?.replace('_', ' ') || 'Team member'}</span>
                            </>
                          ) : <span className="text-xs text-amber-600">Unassigned</span>}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right font-semibold tabular-nums">
                          {amount == null ? <span className="font-normal text-amber-600">Not quoted</span> : `${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex max-w-[150px] rounded-full border border-border px-2.5 py-1 text-xs capitalize">{status.replaceAll('_', ' ')}</span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {ordersResult.status === 'rejected' ? (
          <p role="alert" className="rounded-lg border border-destructive/30 p-4 text-sm">
            Orders and reservations could not be loaded. Check Settings → System Health.
          </p>
        ) : null}
        {quotesResult.status === 'rejected' ? (
          <p role="alert" className="rounded-lg border border-destructive/30 p-4 text-sm">
            Quote leads could not be loaded. Check Settings → System Health.
          </p>
        ) : null}

        {queue.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            No customer records match this filter yet. Choose All to see both orders and quote leads.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {queue.map((item) => item.kind === 'order' ? (
              <OrderCard
                key={`order-${item.id}`}
                order={item.order}
                statuses={ORDER_STATUSES}
                staffOptions={staff}
                assignment={staffOrderAssignments.get(item.id) ?? null}
              />
            ) : (
              <QuoteLeadCard
                key={`quote-${item.id}`}
                lead={item.quote}
                statuses={QUOTE_STATUSES}
                staffOptions={staff}
                assignment={staffQuoteAssignments.get(item.id) ?? null}
                productInfo={quoteProductEntries.get(item.id) ?? null}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
