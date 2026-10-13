import { createHash, timingSafeEqual } from "node:crypto"
import { NextResponse } from "next/server"
import { getDashboardMetrics } from "@/lib/admin-metrics"
import { sendDailyReport } from "@/lib/followup-notify"
import { SITE_URL, getFeedStats, listFeedFetches } from "@/lib/merchant"
import { prepareDailySnapshot, pruneFeedFetchLog, recordDailySnapshot } from "@/lib/merchant-health"
import { reconcilePendingStripeOrders } from "@/lib/stripe-checkout"

export const dynamic = "force-dynamic"
export const maxDuration = 300

const digest = (value: string) => createHash("sha256").update(value).digest()

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const header = request.headers.get("authorization") ?? ""
  return timingSafeEqual(digest(header), digest("Bearer " + secret))
}

/**
 * Daily automation: Google feed health snapshot + alerts, catch-up on card
 * payments whose confirmation never arrived, owner report email, log cleanup.
 */
export async function GET(request: Request) {
  if (!isAuthorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const [stats, fetches] = await Promise.all([getFeedStats(), listFeedFetches(1)])
    const prepared = await prepareDailySnapshot(stats, fetches)
    if (!prepared) return NextResponse.json({ ok: true, skipped: "Today's report already ran." })

    const stripe = await reconcilePendingStripeOrders(SITE_URL)
    const metrics = await getDashboardMetrics()
    const pruned = await pruneFeedFetchLog()
    const emailed = await sendDailyReport(
      metrics,
      { ...prepared, lastGoogleFetch: fetches.lastGoogle },
      SITE_URL,
    )
    if (!emailed) throw new Error("Daily report email was not sent.")

    const recorded = await recordDailySnapshot(prepared.snapshot)
    if (!recorded) return NextResponse.json({ ok: true, skipped: "Today's report already ran." })

    return NextResponse.json({
      ok: true,
      day: prepared.snapshot.day,
      eligible: prepared.snapshot.eligible,
      alerts: prepared.snapshot.alerts.length,
      emailed,
      stripeOrdersChecked: stripe.checked,
      stripeOrdersMarkedPaid: stripe.paid,
      prunedFetchLogRows: pruned,
    })
  } catch (error) {
    console.error("[cron/daily] failed:", error instanceof Error ? error.message : error)
    return NextResponse.json({ ok: false, error: "Daily job failed; see function logs." }, { status: 500 })
  }
}
