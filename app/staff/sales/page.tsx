import { redirect } from "next/navigation"
import { listCustomers } from "@/lib/admin-customers"
import { listOrders, listQuoteLeads } from "@/lib/followup"
import { getStaffSession } from "@/lib/staff-auth"
import { SalesWorkspace } from "@/components/staff/sales-workspace"

export const dynamic = "force-dynamic"
export const metadata = { title: "Sales portal | AUAPW", robots: { index: false } }

export default async function SalesWorkspacePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; q?: string }>
}) {
  const staff = await getStaffSession()
  if (!staff) redirect("/staff/login")
  if (staff.role !== "sales_agent") redirect(staff.role === "support_team" ? "/staff/support" : "/staff/developer")

  const params = await searchParams
  const tab = params.tab === "customers" || params.tab === "quotes" ? params.tab : "orders"
  const query = params.q?.trim().slice(0, 100) || undefined

  const [customers, orders, quotes] = await Promise.all([
    listCustomers(query, 200).catch(() => []),
    listOrders(undefined, query, 200).catch(() => []),
    listQuoteLeads(undefined, query, 200).catch(() => []),
  ])

  return (
    <SalesWorkspace
      staffName={staff.name}
      staffEmail={staff.email}
      tab={tab}
      query={query}
      customers={customers}
      orders={orders}
      quotes={quotes}
      counts={{ orders: orders.length, customers: customers.length, quotes: quotes.length }}
    />
  )
}
