import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { getAdminSession } from "@/lib/admin-auth"
import { ORDER_STATUSES, countByStatus, getOrderById, listOrders } from "@/lib/followup"
import { FollowupFilters } from "@/components/admin/followup-filters"
import { ExportLink } from "@/components/admin/export-link"
import { OrderCard } from "@/components/admin/order-card"
import { getActiveSalesSupportStaff, getFollowupAssignments } from "@/lib/followup-assignments"

export const dynamic = "force-dynamic"
export const metadata = { title: "Orders | AUAPW Admin", robots: { index: false } }

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string | string[]; q?: string | string[]; recordId?: string | string[] }>
}) {
  if (!(await getAdminSession())) redirect("/admin/login")

  const { status: rawStatus, q, recordId: rawRecordId } = await searchParams
  const status = ORDER_STATUSES.find((s) => s === rawStatus)
  const query = typeof q === "string" ? q.trim().slice(0, 100) || undefined : undefined
  // An exact activity link must never fall back to the global collection.
  const exact = rawRecordId !== undefined
  if (exact && (typeof rawRecordId !== "string" || !rawRecordId.trim() || rawRecordId.trim().length > 64 || /[\u0000-\u001f]/.test(rawRecordId))) notFound()
  const recordId = typeof rawRecordId === "string" ? rawRecordId.trim() : null
  const loadOrders = async () => {
    if (recordId === null) return listOrders(status, query)
    const order = await getOrderById(recordId)
    if (!order) notFound()
    return [order]
  }
  const [orders, counts, staff] = await Promise.all([
    loadOrders(), exact ? Promise.resolve({}) : countByStatus("orders"), getActiveSalesSupportStaff().catch(() => []),
  ])
  const assignments = await getFollowupAssignments("order", orders.map((order) => order.id)).catch(() => new Map())

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Orders</h1>
          <p className="text-sm text-muted-foreground">
            Orders from checkout. Card orders arrive paid; phone and reservation orders wait for your call. Saving a
            status publishes it to the customer portal immediately and emails the customer when the status changes.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/admin/sales" className="rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/10">
            Orders + quote leads workspace →
          </Link>
          {!exact ? <ExportLink kind="orders" status={status} query={query} /> : null}
        </div>
      </header>

      {exact ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm">
          <p>Viewing exact order <strong>{orders[0].orderNumber}</strong> · <span className="break-all font-mono text-xs">{recordId}</span></p>
          <Link href="/admin/orders" className="font-semibold text-primary underline">View all orders</Link>
        </div>
      ) : <FollowupFilters
        basePath="/admin/orders"
        statuses={ORDER_STATUSES}
        counts={counts}
        activeStatus={status}
        query={query}
        searchPlaceholder="Search order #, name, phone, email…"
      />}

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
