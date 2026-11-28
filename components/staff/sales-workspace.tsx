import Link from "next/link"
import { Mail, Phone } from "lucide-react"
import type { CustomerSummary } from "@/lib/admin-customers"
import type { StaffOrder, StaffQuote } from "@/lib/staff-workspace"
import { money, productPagePath } from "@/lib/invoice"
import { RecordWorkPanel } from "@/components/admin/record-work-panel"
import { StatusBadge } from "@/components/admin/status-badge"
import { Button } from "@/components/ui/button"

const when = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }) : "—"

export function SalesWorkspace({
  staffName,
  staffEmail,
  tab,
  query,
  customers,
  orders,
  quotes,
  counts,
  unavailable = false,
  page = 1,
  hasMore = false,
}: {
  staffName: string
  staffEmail: string
  tab: "orders" | "customers" | "quotes"
  query?: string
  customers: CustomerSummary[]
  orders: StaffOrder[]
  quotes: StaffQuote[]
  counts: { orders: number; customers: number; quotes: number }
  unavailable?: boolean
  page?: number
  hasMore?: boolean
}) {
  const tabs = [
    { id: "orders" as const, label: "Orders", count: counts.orders },
    { id: "customers" as const, label: "Customers", count: counts.customers },
    { id: "quotes" as const, label: "Quote requests", count: counts.quotes },
  ]

  return (
    <main className="mx-auto max-w-6xl px-5 py-10">
      <p className="text-sm text-muted-foreground">AUAPW · Sales portal</p>
      <h1 className="mt-2 text-3xl font-bold">Welcome, {staffName}</h1>
      <p className="mt-2 text-muted-foreground">Sales Agent · {staffEmail}</p>
      <p className="mt-3 max-w-3xl text-sm text-muted-foreground">
        Orders, quote requests and customer summaries here cover your current assignments. Open a work record to log
        your activity and report an outcome. Recorded order status and your reported outcome are shown separately.
      </p>

      <nav className="mt-8 flex flex-wrap gap-2">
        {tabs.map((item) => (
          <Link
            key={item.id}
            href={query ? `/staff/sales?tab=${item.id}&q=${encodeURIComponent(query)}` : `/staff/sales?tab=${item.id}`}
            className={`rounded-full border px-4 py-1.5 text-sm ${
              tab === item.id ? "border-primary bg-primary/10 font-semibold text-primary" : "border-border text-muted-foreground"
            }`}
          >
            {item.label}{unavailable ? "" : ` (${item.count} on this page)`}
          </Link>
        ))}
      </nav>

      <form action="/staff/sales" className="mt-6 max-w-md">
        <input type="hidden" name="tab" value={tab} />
        <label htmlFor="sales-search" className="sr-only">
          Search customers and orders
        </label>
        <input
          id="sales-search"
          name="q"
          defaultValue={query}
          placeholder="Search name, email, phone, order #"
          className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm"
        />
      </form>

      {unavailable ? (
        <p role="alert" className="mt-8 rounded-lg border border-destructive/40 bg-destructive/5 p-6 text-sm">Assigned records could not be loaded. This does not mean you have no work. Refresh the page or ask an administrator to check database and assignment access.</p>
      ) : tab === "customers" ? (
        <CustomerTable customers={customers} query={query} />
      ) : tab === "quotes" ? (
        <QuoteList quotes={quotes} query={query} />
      ) : (
        <OrderList orders={orders} query={query} />
      )}

      {!unavailable && <nav aria-label="Assigned records pagination" className="mt-6 flex items-center gap-4 text-sm">
        {page > 1 && <Link className="text-primary underline" href={`/staff/sales?tab=${tab}&page=${page - 1}${query ? `&q=${encodeURIComponent(query)}` : ''}`}>Previous page</Link>}
        <span className="text-muted-foreground">Page {page} · up to 50 assigned records per tab</span>
        {hasMore && <Link className="text-primary underline" href={`/staff/sales?tab=${tab}&page=${page + 1}${query ? `&q=${encodeURIComponent(query)}` : ''}`}>Next page</Link>}
      </nav>}

      <form
        action={async () => {
          "use server"
          const { cookies } = await import("next/headers")
          ;(await cookies()).delete("auapw_staff_session")
          const { redirect } = await import("next/navigation")
          redirect("/staff/login")
        }}
        className="mt-10"
      >
        <Button type="submit" variant="outline">
          Sign out
        </Button>
      </form>
    </main>
  )
}

function CustomerTable({ customers, query }: { customers: CustomerSummary[]; query?: string }) {
  if (customers.length === 0) {
    return (
      <p className="mt-8 rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
        {query ? `No assigned customers match “${query}” on this page.` : "No assigned customers on this page."}
      </p>
    )
  }
  return (
    <ul className="mt-8 flex flex-col gap-3">
      {customers.map((customer) => (
        <li key={customer.key} className="rounded-xl border border-border bg-card p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-semibold">{customer.name || "Unnamed"}</p>
              <div className="mt-1 flex flex-col gap-1 text-sm">
                {customer.email ? (
                  <a href={`mailto:${customer.email}`} className="inline-flex items-center gap-1 text-primary">
                    <Mail className="size-3.5" aria-hidden="true" />
                    {customer.email}
                  </a>
                ) : null}
                {customer.phone ? (
                  <a href={`tel:${customer.phone.replace(/[^\d+]/g, "")}`} className="inline-flex items-center gap-1 text-primary">
                    <Phone className="size-3.5" aria-hidden="true" />
                    {customer.phone}
                  </a>
                ) : null}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Last activity {when(customer.lastActivity)}</p>
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <div>
              <dt className="text-muted-foreground">Orders</dt>
              <dd className="font-semibold">{customer.orders}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Recorded paid total</dt>
              <dd className="font-semibold">{money(customer.paidTotal)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Quotes</dt>
              <dd className="font-semibold">{customer.quotes}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Quotes won</dt>
              <dd className="font-semibold">{customer.quotesWon}</dd>
            </div>
          </dl>
        </li>
      ))}
    </ul>
  )
}

function OrderList({ orders, query }: { orders: StaffOrder[]; query?: string }) {
  if (orders.length === 0) {
    return (
      <p className="mt-8 rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
        {query ? `No assigned orders match “${query}” on this page.` : "No assigned orders on this page."}
      </p>
    )
  }
  return (
    <ul className="mt-8 flex flex-col gap-4">
      {orders.map((order) => (
        <li key={order.id} className="rounded-xl border border-border bg-card p-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm font-semibold">{order.orderNumber}</span>
            <StatusBadge status={order.status} />
            {order.emailVerifiedAt ? (
              <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-400">
                Email verified
              </span>
            ) : (
              <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-xs text-amber-400">
                Awaiting email verification
              </span>
            )}
            <span className="ml-auto text-lg font-bold">{money(order.totalAmount)}</span>
          </div>
          <p className="mt-2 font-medium">{order.customerName}</p>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm">
            {order.customerEmail ? (
              <a href={`mailto:${order.customerEmail}`} className="text-primary">
                {order.customerEmail}
              </a>
            ) : null}
            {order.customerPhone ? (
              <a href={`tel:${order.customerPhone.replace(/[^\d+]/g, "")}`} className="text-primary">
                {order.customerPhone}
              </a>
            ) : null}
          </div>
          {order.shippingAddress ? <p className="mt-2 text-sm text-muted-foreground">{order.shippingAddress}</p> : null}
          <ul className="mt-4 space-y-2 text-sm">
            {order.items.map((line) => (
              <li key={`${order.id}-${line.productId}`} className="flex flex-wrap items-baseline justify-between gap-2">
                <Link href={productPagePath(line)} className="font-medium text-primary underline underline-offset-2">
                  {line.name}
                </Link>
                <span>
                  {line.quantity} × {money(line.unitPrice)}
                </span>
              </li>
            ))}
          </ul>
          {order.itemsOmitted > 0 && <p role="status" className="mt-2 text-xs text-amber-700">{order.itemsOmitted} line item{order.itemsOmitted === 1 ? '' : 's'} could not be displayed. Ask an administrator to review the original record.</p>}
          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            <span className="text-muted-foreground">Placed {when(order.createdAt)}</span>
            <span className="text-muted-foreground">Updated {when(order.updatedAt)}</span>
          </div>
          <RecordWorkPanel recordType="order" recordId={order.id} />
        </li>
      ))}
    </ul>
  )
}

function QuoteList({ quotes, query }: { quotes: StaffQuote[]; query?: string }) {
  if (quotes.length === 0) {
    return (
      <p className="mt-8 rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
        {query ? `No assigned quotes match “${query}” on this page.` : "No assigned quote requests on this page."}
      </p>
    )
  }
  return (
    <ul className="mt-8 flex flex-col gap-3">
      {quotes.map((quote) => (
        <li key={quote.id} className="rounded-xl border border-border bg-card p-5 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold">Quote #{quote.id}</span>
            <StatusBadge status={quote.status} />
            <span className="text-xs text-muted-foreground">{when(quote.createdAt)}</span>
          </div>
          <p className="mt-2 font-medium">{quote.fullName}</p>
          <p className="text-muted-foreground">{[quote.email, quote.phone].filter(Boolean).join(' · ')}</p>
          <p className="text-muted-foreground">
            {[quote.year, quote.make, quote.model, quote.partType].filter(Boolean).join(" ")}
          </p>
          <p className="mt-2">Recorded quote amount: {quote.quoteAmount === null ? 'Not quoted' : money(quote.quoteAmount)}</p>
          {quote.notes && <p className="mt-2 whitespace-pre-wrap text-muted-foreground">{quote.notes}</p>}
          {quote.productUrl ? (
            <Link href={quote.productUrl} className="mt-2 inline-block text-primary underline" target="_blank">
              {quote.productName || "Product page"}
            </Link>
          ) : null}
          <RecordWorkPanel recordType="quote" recordId={String(quote.id)} />
        </li>
      ))}
    </ul>
  )
}
