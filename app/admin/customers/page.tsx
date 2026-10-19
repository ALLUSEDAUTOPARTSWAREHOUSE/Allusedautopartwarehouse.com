import { CustomerInviteForm } from '@/components/admin/customer-invite-form'
import Link from "next/link"
import { redirect } from "next/navigation"
import { Mail, Phone, Search } from "lucide-react"
import { getAdminSession } from "@/lib/admin-auth"
import { listCustomers } from "@/lib/admin-customers"
import { ExportLink } from "@/components/admin/export-link"

export const dynamic = "force-dynamic"
export const metadata = { title: "Customers | AUAPW Admin", robots: { index: false } }

const money = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const when = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"

export default async function AdminCustomersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  if (!(await getAdminSession())) redirect("/admin/login")

  const { q } = await searchParams
  const query = q?.trim().slice(0, 100) || undefined
  let customers: Awaited<ReturnType<typeof listCustomers>> = []
  let loadError: string | null = null
  try {
    customers = await listCustomers(query)
  } catch (error) {
    loadError = error instanceof Error ? error.message : String(error)
  }
  const lookup = (c: (typeof customers)[number]) => encodeURIComponent(c.email || c.phone || c.name)

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Customers</h1>
          <p className="text-sm text-muted-foreground">
            Everyone who ordered or asked for a quote, matched by email (or phone), newest activity first.
          </p>
        </div>
        <ExportLink kind="customers" query={query} />
      </header>

      <CustomerInviteForm />

      <form action="/admin/customers" className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <label htmlFor="customer-search" className="sr-only">
          Search customers
        </label>
        <input
          id="customer-search"
          name="q"
          defaultValue={query}
          placeholder="Search name, email, phone…"
          className="w-full rounded-md border border-border bg-card py-2 pl-9 pr-3 text-sm text-foreground"
        />
      </form>

      {loadError ? (
        <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          Couldn&apos;t read customers: <code className="text-xs">{loadError}</code>. Settings → System health shows which
          table or column is missing.
        </p>
      ) : customers.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          {query ? `No customers match “${query}”.` : "No customers yet."}
        </p>
      ) : (
        <>
        {/* Phones: one card per customer instead of a wide table. */}
        <ul className="flex flex-col gap-3 md:hidden">
          {customers.map((c) => (
            <li key={c.key} className="rounded-lg border border-border bg-card p-4 text-sm">
              <p className="font-medium text-foreground">{c.name || "Unnamed"}</p>
              <p className="mt-1 flex flex-col gap-1 text-xs">
                {c.email && (
                  <a href={`mailto:${c.email}`} className="inline-flex items-center gap-1 break-all text-primary">
                    <Mail className="h-3 w-3 shrink-0" aria-hidden="true" />
                    {c.email}
                  </a>
                )}
                {c.phone && (
                  <a href={`tel:${c.phone.replace(/[^\d+]/g, "")}`} className="inline-flex items-center gap-1 text-primary">
                    <Phone className="h-3 w-3 shrink-0" aria-hidden="true" />
                    {c.phone}
                  </a>
                )}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                {c.orders} order{c.orders === 1 ? "" : "s"}
                {c.paidTotal ? ` · ${money(c.paidTotal)} paid` : ""} · {c.quotes} quote{c.quotes === 1 ? "" : "s"} · last{" "}
                {when(c.lastActivity)}
              </p>
              <p className="mt-2 flex gap-4 text-xs">
                {c.orders > 0 && (
                  <Link href={`/admin/orders?q=${lookup(c)}`} className="text-primary hover:underline">
                    Orders
                  </Link>
                )}
                {c.quotes > 0 && (
                  <Link href={`/admin/quotes?q=${lookup(c)}`} className="text-primary hover:underline">
                    Quotes
                  </Link>
                )}
              </p>
            </li>
          ))}
        </ul>
        <div className="hidden overflow-x-auto rounded-lg border border-border bg-card md:block">
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-muted-foreground">
              <tr className="border-b border-border">
                <th scope="col" className="px-4 py-3 font-medium">Customer</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">Orders</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">Paid total</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">Quotes</th>
                <th scope="col" className="px-4 py-3 font-medium">Last activity</th>
                <th scope="col" className="px-4 py-3"><span className="sr-only">History</span></th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.key} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{c.name || "Unnamed"}</p>
                    <p className="flex flex-wrap gap-x-3 text-xs">
                      {c.email && (
                        <a href={`mailto:${c.email}`} className="inline-flex items-center gap-1 text-primary hover:underline">
                          <Mail className="h-3 w-3" aria-hidden="true" />
                          {c.email}
                        </a>
                      )}
                      {c.phone && (
                        <a
                          href={`tel:${c.phone.replace(/[^\d+]/g, "")}`}
                          className="inline-flex items-center gap-1 text-primary hover:underline"
                        >
                          <Phone className="h-3 w-3" aria-hidden="true" />
                          {c.phone}
                        </a>
                      )}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{c.orders}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{c.paidTotal ? money(c.paidTotal) : "—"}</td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {c.quotes}
                    {c.quotesWon ? <span className="text-xs text-muted-foreground"> ({c.quotesWon} won)</span> : null}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{when(c.lastActivity)}</td>
                  <td className="px-4 py-3 text-right text-xs">
                    {c.orders > 0 && (
                      <Link href={`/admin/orders?q=${lookup(c)}`} className="mr-3 text-primary hover:underline">
                        Orders
                      </Link>
                    )}
                    {c.quotes > 0 && (
                      <Link href={`/admin/quotes?q=${lookup(c)}`} className="text-primary hover:underline">
                        Quotes
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
      )}
    </div>
  )
}
