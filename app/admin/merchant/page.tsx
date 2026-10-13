import Link from "next/link"
import { redirect } from "next/navigation"
import { getAdminSession } from "@/lib/admin-auth"
import { getFeedStats, listFeedFetches, listRecentOverrides } from "@/lib/merchant"
import { buildFeedAlerts, listFeedSnapshots } from "@/lib/merchant-health"
import { MerchantOverview } from "@/components/admin/merchant/merchant-overview"
import { FeedHealthPanel } from "@/components/admin/merchant/feed-health-panel"

export const dynamic = "force-dynamic"
export const maxDuration = 60
export const metadata = { title: "Google Feed Dashboard | AUAPW Admin", robots: { index: false } }

export default async function GoogleFeedDashboard() {
  if (!(await getAdminSession())) redirect("/admin/login")
  const [stats, fetches, overrides, snapshots] = await Promise.all([
    getFeedStats(), listFeedFetches(8), listRecentOverrides(500), listFeedSnapshots(30),
  ])
  const alerts = buildFeedAlerts(stats, fetches.lastGoogle, snapshots[0] ?? null)
  return <div className="mx-auto flex max-w-6xl flex-col gap-8">
    <header>
      <h1 className="text-2xl font-bold">Google Feed Dashboard</h1>
      <p className="text-sm text-muted-foreground">Monitor Google Shopping feed health, errors and fetch history.</p>
      <Link href="/admin/products" className="text-primary underline">Manage products, uploads, prices and images</Link>
    </header>
    <MerchantOverview stats={stats} fetches={fetches} overrideCount={overrides.length} />
    <FeedHealthPanel alerts={alerts} snapshots={snapshots} />
  </div>
}
