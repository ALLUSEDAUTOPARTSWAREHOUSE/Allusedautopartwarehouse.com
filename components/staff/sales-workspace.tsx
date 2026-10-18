import Link from "next/link"
import { Mail, Phone } from "lucide-react"
import type { CustomerSummary } from "@/lib/admin-customers"
import type { CustomerOrder, QuoteLead } from "@/lib/followup"
import { invoiceUrl, money } from "@/lib/invoice"
import { StatusBadge } from "@/components/admin/status-badge"

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
}: {
  staffName: string
  staffEmail: string
  tab: "orders" | "customers" | "quotes"
  query?: string
  customers: CustomerSummary[]
  orders: CustomerOrder[]
  quotes: QuoteLead[]
  counts: { orders: number; customers: number; quotes: number }
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
        Every checkout customer lands here as soon as they place an order. Customers verify their email to confirm the
        order. Unpaid orders are processed after payment confirmation.
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
            {item.label} ({item.count})
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

      {tab === "customers" ? (
        <CustomerTable customers={customers} query={query} />
      ) : tab === "quotes" ? (
        <QuoteList quotes={quotes} query={query} />
      ) : (
        <OrderList orders={orders} query={query} />
      )}

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
        <button className="rounded-lg border border-border px-4 py-2 text-sm">Sign out</button>
      </form>
    </main>
  )
}

function CustomerTable({ customers, query }: { customers: CustomerSummary[]; query?: string }) {
  if (customers.length === 0) {
    return (
      <p className="mt-8 rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
        {query ? `No customers match “${query}”.` : "No checkout customers yet."}
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
              <dt className="text-muted-foreground">Paid total</dt>
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

function OrderList({ orders, query }: { orders: CustomerOrder[]; query?: string }) {
  if (orders.length === 0) {
    return (
      <p className="mt-8 rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
        {query ? `No orders match “${query}”.` : "No checkout orders yet."}
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
                <Link href={line.url} className="font-medium text-primary underline underline-offset-2" target="_blank">
                  {line.name}
                </Link>
                <span>
                  {line.quantity} × {money(line.unitPrice)}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            <Link href={invoiceUrl(order, "")} className="font-semibold text-primary underline">
              Open branded invoice
            </Link>
            <span className="text-muted-foreground">Placed {when(order.createdAt)}</span>
          </div>
        </li>
      ))}
    </ul>
  )
}

function QuoteList({ quotes, query }: { quotes: QuoteLead[]; query?: string }) {
  if (quotes.length === 0) {
    return (
      <p className="mt-8 rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
        {query ? `No quotes match “${query}”.` : "No quote requests yet."}
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
          <p className="text-muted-foreground">
            {[quote.year, quote.make, quote.model, quote.partType].filter(Boolean).join(" ")}
          </p>
          {quote.productUrl ? (
            <Link href={quote.productUrl} className="mt-2 inline-block text-primary underline" target="_blank">
              {quote.productName || "Product page"}
            </Link>
          ) : null}
        </li>
      ))}
    </ul>
  )
}
