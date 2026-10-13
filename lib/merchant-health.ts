import "server-only"
import { pool } from "@/lib/db"
import { BUSINESS_TIME_ZONE } from "@/lib/admin-metrics"
import type { BrandFeedStats } from "@/lib/merchant"

/**
 * Daily Google Shopping health record. The daily cron stores one snapshot per
 * business day so the admin can see the feed's trend, and compares it with the
 * previous one to raise alerts (feed emptied, a brand dropped out, Google
 * stopped fetching).
 */

export interface FeedSnapshot {
  day: string
  takenAt: string
  total: number
  eligible: number
  brands: { slug: string; label: string; total: number; eligible: number }[]
  alerts: FeedAlert[]
}

export interface FeedAlert {
  level: "critical" | "warning"
  message: string
}

const GOOGLE_STALE_HOURS = 48
const ELIGIBLE_DROP_RATIO = 0.05
const FETCH_LOG_RETENTION_DAYS = 90

let tableReady: Promise<unknown> | null = null

/** The cron is the only writer, so it creates its own table instead of needing a manual migration. */
function ensureSnapshotTable() {
  tableReady ??= pool
    .query(
      `CREATE TABLE IF NOT EXISTS public.merchant_feed_snapshots (
         day date PRIMARY KEY,
         taken_at timestamptz NOT NULL DEFAULT now(),
         total integer NOT NULL,
         eligible integer NOT NULL,
         brands jsonb NOT NULL,
         alerts jsonb NOT NULL
       )`,
    )
    .catch((error) => {
      tableReady = null
      throw error
    })
  return tableReady
}

function mapSnapshot(r: Record<string, unknown>): FeedSnapshot {
  return {
    day: r.day instanceof Date ? r.day.toISOString().slice(0, 10) : String(r.day),
    takenAt: r.taken_at instanceof Date ? r.taken_at.toISOString() : String(r.taken_at),
    total: Number(r.total),
    eligible: Number(r.eligible),
    brands: (r.brands as FeedSnapshot["brands"]) ?? [],
    alerts: (r.alerts as FeedAlert[]) ?? [],
  }
}

/** Most recent snapshots, newest first. Never throws: the admin page must load without them. */
export async function listFeedSnapshots(limit = 30): Promise<FeedSnapshot[]> {
  try {
    await ensureSnapshotTable()
    const { rows } = await pool.query(
      `SELECT to_char(day, 'YYYY-MM-DD') AS day, taken_at, total, eligible, brands, alerts
         FROM public.merchant_feed_snapshots ORDER BY day DESC LIMIT $1`,
      [limit],
    )
    return rows.map(mapSnapshot)
  } catch (error) {
    console.error("[merchant-health] snapshot list failed:", (error as Error).message)
    return []
  }
}

/** Alerts for the current feed state, compared with the last stored snapshot. */
export function buildFeedAlerts(
  stats: BrandFeedStats[],
  lastGoogleFetch: string | null,
  previous: FeedSnapshot | null,
  now = Date.now(),
): FeedAlert[] {
  const alerts: FeedAlert[] = []
  const eligible = stats.reduce((sum, b) => sum + b.eligible, 0)

  if (eligible === 0) {
    alerts.push({ level: "critical", message: "The Google feed is empty — no products are being sent to Google." })
  }

  if (!lastGoogleFetch) {
    alerts.push({
      level: "warning",
      message: "Google has never fetched the feed. Add the feed URL under Merchant Center → Data sources.",
    })
  } else {
    const hours = (now - Date.parse(lastGoogleFetch)) / 3_600_000
    if (hours > GOOGLE_STALE_HOURS) {
      alerts.push({
        level: "critical",
        message: `Google has not fetched the feed for ${Math.floor(hours / 24)} days. Check the data source's fetch schedule in Merchant Center.`,
      })
    }
  }

  if (previous && previous.eligible > 0 && eligible < previous.eligible * (1 - ELIGIBLE_DROP_RATIO)) {
    const pct = Math.round(((previous.eligible - eligible) / previous.eligible) * 100)
    alerts.push({
      level: "warning",
      message: `Products sent to Google fell ${pct}% since ${previous.day}: ${previous.eligible.toLocaleString("en-US")} → ${eligible.toLocaleString("en-US")}.`,
    })
  }

  if (previous) {
    const before = new Map(previous.brands.map((b) => [b.slug, b.eligible]))
    for (const b of stats) {
      const had = before.get(b.slug) ?? 0
      if (had > 0 && b.eligible === 0) {
        alerts.push({
          level: "warning",
          message: `${b.label} has no products in the feed any more (had ${had.toLocaleString("en-US")} on ${previous.day}).`,
        })
      }
    }
  }

  return alerts
}

/** Builds today's snapshot without marking the daily job complete. */
export async function prepareDailySnapshot(
  stats: BrandFeedStats[],
  fetches: { lastGoogle: string | null },
): Promise<{ snapshot: FeedSnapshot; previous: FeedSnapshot | null } | null> {
  await ensureSnapshotTable()
  const { rows: todayRows } = await pool.query(
    `SELECT 1 FROM public.merchant_feed_snapshots
      WHERE day = (now() AT TIME ZONE '${BUSINESS_TIME_ZONE}')::date`,
  )
  if (todayRows.length) return null

  const { rows: prevRows } = await pool.query(
    `SELECT to_char(day, 'YYYY-MM-DD') AS day, taken_at, total, eligible, brands, alerts
       FROM public.merchant_feed_snapshots
      WHERE day < (now() AT TIME ZONE '${BUSINESS_TIME_ZONE}')::date
      ORDER BY day DESC LIMIT 1`,
  )
  const previous = prevRows[0] ? mapSnapshot(prevRows[0]) : null
  const alerts = buildFeedAlerts(stats, fetches.lastGoogle, previous)
  const brands = stats.map((b) => ({ slug: b.slug, label: b.label, total: b.total, eligible: b.eligible }))
  const { rows: dayRows } = await pool.query(
    `SELECT to_char((now() AT TIME ZONE '${BUSINESS_TIME_ZONE}')::date, 'YYYY-MM-DD') AS day`,
  )

  return {
    snapshot: {
      day: dayRows[0].day,
      takenAt: new Date().toISOString(),
      total: brands.reduce((sum, b) => sum + b.total, 0),
      eligible: brands.reduce((sum, b) => sum + b.eligible, 0),
      brands,
      alerts,
    },
    previous,
  }
}

/** Persists the snapshot only after the rest of the daily job succeeds. */
export async function recordDailySnapshot(snapshot: FeedSnapshot): Promise<boolean> {
  await ensureSnapshotTable()
  const { rows } = await pool.query(
    `INSERT INTO public.merchant_feed_snapshots (day, total, eligible, brands, alerts)
     VALUES ($1::date, $2, $3, $4::jsonb, $5::jsonb)
     ON CONFLICT (day) DO NOTHING
     RETURNING day`,
    [
      snapshot.day,
      snapshot.total,
      snapshot.eligible,
      JSON.stringify(snapshot.brands),
      JSON.stringify(snapshot.alerts),
    ],
  )
  return rows.length > 0
}

/** The fetch log gains a row per feed request; keep it to a useful window. */
export async function pruneFeedFetchLog(): Promise<number> {
  const { rowCount } = await pool.query(
    `DELETE FROM public.merchant_feed_fetches WHERE fetched_at < now() - interval '${FETCH_LOG_RETENTION_DAYS} days'`,
  )
  return rowCount ?? 0
}
