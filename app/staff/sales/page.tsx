import { redirect } from "next/navigation"
import { getAssignedWorkspace } from "@/lib/staff-workspace"
import { getStaffSession } from "@/lib/staff-auth"
import { AssistantPanel } from "@/components/admin/assistant-panel"
import { SalesWorkspace } from "@/components/staff/sales-workspace"

export const dynamic = "force-dynamic"
export const metadata = { title: "Sales portal | AUAPW", robots: { index: false } }

export default async function SalesWorkspacePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string | string[]; q?: string | string[]; page?: string | string[] }>
}) {
  const staff = await getStaffSession()
  if (!staff) redirect("/staff/login")
  if (staff.role !== "sales_agent") redirect(staff.role === "support_team" ? "/staff/support" : "/staff/developer")

  const params = await searchParams
  const tab = params.tab === "customers" || params.tab === "quotes" ? params.tab : "orders"
  const query = typeof params.q === 'string' ? params.q.trim().slice(0, 100) || undefined : undefined

  const requestedPage = typeof params.page === 'string' ? Number(params.page) : 1
  const workspace = await getAssignedWorkspace(query, requestedPage).catch(() => null)
  const { customers, orders, quotes } = workspace ?? { customers: [], orders: [], quotes: [] }

  return (
    <>
    <SalesWorkspace
      staffName={staff.name}
      staffEmail={staff.email}
      tab={tab}
      query={query}
      customers={customers}
      orders={orders}
      quotes={quotes}
      counts={{ orders: orders.length, customers: customers.length, quotes: quotes.length }}
      unavailable={!workspace}
      page={workspace?.page ?? 1}
      hasMore={workspace?.hasMore[tab] ?? false}
    />
    <section className="mx-auto max-w-6xl px-5 pb-10" aria-label="Sales team AI"><AssistantPanel staffRole="sales_agent" layout="full" /></section>
    </>
  )
}
