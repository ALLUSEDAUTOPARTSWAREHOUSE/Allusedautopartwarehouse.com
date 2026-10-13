import { redirect } from "next/navigation"
import { getAdminSession } from "@/lib/admin-auth"
import { ORDER_STATUSES, countByStatus, listOrders } from "@/lib/followup"
import { FollowupFilters } from "@/components/admin/followup-filters"
import { ExportLink } from "@/components/admin/export-link"
import { OrderCard } from "@/components/admin/order-card"
import { getActiveSalesSupportStaff, getFollowupAssignments } from "@/lib/followup-assignments"

export const dynamic = "force-dynamic"
export const metadata = { title: "Orders | AUAPW Admin", robots: { index: false } }

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>
}) {
  if (!(await getAdminSession())) redirect("/admin/login")

  const { status: rawStatus, q } = await searchParams
  const status = ORDER_STATUSES.find((s) => s === rawStatus)
  const query = q?.trim().slice(0, 100) || undefined
  const [orders, counts, staff] = await Promise.all([listOrders(status, query), countByStatus("orders"), getActiveSalesSupportStaff().catch(() => [])])
  const assignments = await getFollowupAssignments("order", orders.map((order) => order.id)).catch(() => new Map())

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Orders</h1>
          <p className="text-sm text-muted-foreground">
            Orders from checkout. Card orders arrive paid; phone and reservation orders wait for your call. Update the
            status as you go and tick “Email the customer” to send them the update.
          </p>
        </div>
        <ExportLink kind="orders" status={status} query={query} />
      </header>

      <FollowupFilters
        basePath="/admin/orders"
        statuses={ORDER_STATUSES}
        counts={counts}
        activeStatus={status}
        query={query}
        searchPlaceholder="Search order #, name, phone, email…"
      />

      {orders.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          No orders {status ? `with status "${status}"` : "yet"}.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} statuses={ORDER_STATUSES} staffOptions={staff} assignment={assignments.get(order.id) ?? null} />
          ))}
        </div>
      )}
    </div>
  )
}
