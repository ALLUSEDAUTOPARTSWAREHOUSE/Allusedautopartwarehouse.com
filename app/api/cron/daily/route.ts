import { createHash, timingSafeEqual } from "node:crypto"
import { NextResponse } from "next/server"
import { getDashboardMetrics } from "@/lib/admin-metrics"
import { sendDailyReport } from "@/lib/followup-notify"
import { SITE_URL, getFeedStats, listFeedFetches } from "@/lib/merchant"
import { pruneFeedFetchLog, recordDailySnapshot } from "@/lib/merchant-health"
import { reconcilePendingStripeOrders } from "@/lib/stripe-checkout"

export const dynamic = "force-dynamic"
export const maxDuration = 300

const digest = (value: string) => createHash("sha256").update(value).digest()

/**
 * Vercel Cron sends `Authorization: Bearer $CRON_SECRET` when that variable is
 * set. Without it, only requests that look like Vercel's scheduler run the job;
 * the job is once-a-day idempotent and only emails the owner, so an early or
 * spoofed call can at most send that day's report sooner.
 */
function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (secret) {
    const header = request.headers.get("authorization") ?? ""
    return timingSafeEqual(digest(header), digest(`Bearer ${secret}`))
  }
  return false
}

/**
 * Daily automation: Google feed health snapshot + alerts, catch-up on card
 * payments whose confirmation never arrived, owner report email, log cleanup.
 */
export async function GET(request: Request) {
  if (!isAuthorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const [stats, fetches] = await Promise.all([getFeedStats(), listFeedFetches(1)])
    const recorded = await recordDailySnapshot(stats, fetches)
    if (!recorded) return NextResponse.json({ ok: true, skipped: "Today's report already ran." })

    // Before the report, so card orders that were paid but never confirmed count as paid.
    const stripe = await reconcilePendingStripeOrders(SITE_URL).catch((error) => {
      console.error("[cron/daily] Stripe reconcile failed:", error instanceof Error ? error.message : error)
      return { checked: 0, paid: 0 }
    })
    const metrics = await getDashboardMetrics()
    const emailed = await sendDailyReport(
      metrics,
      { ...recorded, lastGoogleFetch: fetches.lastGoogle },
      SITE_URL,
    )
    const pruned = await pruneFeedFetchLog()

    return NextResponse.json({
      ok: true,
      day: recorded.snapshot.day,
      eligible: recorded.snapshot.eligible,
      alerts: recorded.snapshot.alerts.length,
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
