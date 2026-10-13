import { redirect } from "next/navigation"
import { getAdminSession } from "@/lib/admin-auth"
import { QUOTE_STATUSES, countByStatus, listQuoteLeads } from "@/lib/followup"
import { FollowupFilters } from "@/components/admin/followup-filters"
import { ExportLink } from "@/components/admin/export-link"
import { QuoteLeadCard } from "@/components/admin/quote-lead-card"
import { getActiveSalesSupportStaff, getFollowupAssignments } from "@/lib/followup-assignments"
import { getQuoteProductInfo } from "@/lib/quote-product-info"

export const dynamic = "force-dynamic"
export const metadata = { title: "Quote Requests | AUAPW Admin", robots: { index: false } }

export default async function AdminQuotesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>
}) {
  if (!(await getAdminSession())) redirect("/admin/login")

  const { status: rawStatus, q } = await searchParams
  const status = QUOTE_STATUSES.find((s) => s === rawStatus)
  const query = q?.trim().slice(0, 100) || undefined
  const [leads, counts, staff] = await Promise.all([listQuoteLeads(status, query), countByStatus("leads"), getActiveSalesSupportStaff().catch(() => [])])
  const [assignments, productInfoEntries] = await Promise.all([
    getFollowupAssignments("quote", leads.map((lead) => String(lead.id))).catch(() => new Map()),
    Promise.all(leads.map(async (lead) => [String(lead.id), await getQuoteProductInfo(lead)] as const)),
  ])
  const productInfos = new Map(productInfoEntries)

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Quote Requests</h1>
          <p className="text-sm text-muted-foreground">
            Every quote submitted on the website. Call the customer, then update the status and notes.
          </p>
        </div>
        <ExportLink kind="quotes" status={status} query={query} />
      </header>

      <FollowupFilters
        basePath="/admin/quotes"
        statuses={QUOTE_STATUSES}
        counts={counts}
        activeStatus={status}
        query={query}
        searchPlaceholder="Search name, phone, email, make…"
      />

      {leads.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          No quote requests {status ? `with status "${status}"` : "yet"}.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {leads.map((lead) => (
            <QuoteLeadCard key={lead.id} lead={lead} statuses={QUOTE_STATUSES} staffOptions={staff} assignment={assignments.get(String(lead.id)) ?? null} productInfo={productInfos.get(String(lead.id)) ?? null} />
          ))}
        </div>
      )}
    </div>
  )
}
