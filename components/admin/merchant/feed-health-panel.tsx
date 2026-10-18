import { AlertTriangle, CheckCircle2, Clock } from "lucide-react"
import type { FeedAlert, FeedSnapshot } from "@/lib/merchant-health"

const fmt = (n: number) => n.toLocaleString("en-US")
const shortDay = (day: string) =>
  new Date(`${day}T12:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })

/**
 * Live alerts plus the daily snapshots the cron records, so a drop in the
 * number of products Google receives is visible at a glance.
 */
export function FeedHealthPanel({ alerts, snapshots }: { alerts: FeedAlert[]; snapshots: FeedSnapshot[] }) {
  const trend = [...snapshots].reverse()
  const max = Math.max(...trend.map((s) => s.eligible), 1)
  const min = Math.min(...trend.map((s) => s.eligible), max)
  // Start the bars a little below the lowest day so small day-to-day changes stay visible.
  const floor = Math.max(0, min - (max - min || max * 0.05))

  return (
    <section aria-labelledby="feed-health" className="rounded-lg border border-border bg-card p-5">
      <div className="flex flex-col gap-1">
        <h2 id="feed-health" className="text-lg font-semibold text-foreground">
          Feed health & automation
        </h2>
        <p className="text-sm text-muted-foreground">
          Every morning at about 8am Central the site checks the feed, records the numbers below and emails a daily
          report (orders, quotes and any of these alerts) to the store inbox.
        </p>
      </div>

      <div className="mt-4">
        {alerts.length === 0 ? (
          <p className="flex items-center gap-2 text-sm text-foreground">
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" aria-hidden="true" />
            No local feed alerts recorded. Google acceptance and image accuracy are not verified.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {alerts.map((a) => (
              <li
                key={a.message}
                className={`flex items-start gap-2 rounded-md border px-3 py-2 text-sm ${
                  a.level === "critical"
                    ? "border-destructive/40 bg-destructive/10 text-destructive"
                    : "border-amber-500/40 bg-amber-500/10 text-foreground"
                }`}
              >
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                {a.message}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-5">
        <h3 className="mb-2 text-sm font-medium text-foreground">Local feed-eligible products, by day</h3>
        {trend.length === 0 ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" aria-hidden="true" />
            No daily checks recorded yet — the first one runs the next morning at about 8am Central.
          </p>
        ) : (
          <>
            <div className="flex h-24 items-end gap-1" aria-hidden="true">
              {trend.map((s) => (
                <span
                  key={s.day}
                  title={`${shortDay(s.day)}: ${fmt(s.eligible)} of ${fmt(s.total)} products${s.alerts.length ? ` · ${s.alerts.length} alert(s)` : ""}`}
                  className={`flex-1 rounded-t ${s.alerts.some((a) => a.level === "critical") ? "bg-destructive" : s.alerts.length ? "bg-amber-500" : "bg-primary"}`}
                  style={{ height: `${Math.max(4, ((s.eligible - floor) / (max - floor || 1)) * 100)}%` }}
                />
              ))}
            </div>
            <div className="mt-1 flex justify-between text-[10px] text-muted-foreground" aria-hidden="true">
              <span>{shortDay(trend[0].day)}</span>
              <span>{shortDay(trend[trend.length - 1].day)}</span>
            </div>
            <table className="sr-only">
              <caption>Products sent to Google per day</caption>
              <thead>
                <tr>
                  <th scope="col">Day</th>
                  <th scope="col">Products in feed</th>
                  <th scope="col">Alerts</th>
                </tr>
              </thead>
              <tbody>
                {trend.map((s) => (
                  <tr key={s.day}>
                    <td>{shortDay(s.day)}</td>
                    <td>{fmt(s.eligible)}</td>
                    <td>{s.alerts.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>

      <details className="mt-4 text-sm">
        <summary className="cursor-pointer font-medium text-primary">What the feed sends Google automatically</summary>
        <ul className="mt-3 flex list-disc flex-col gap-1.5 pl-5 text-muted-foreground">
          <li>Only priced parts that are not hidden or excluded; quote-only parts stay out of Google.</li>
          <li>Titles tidied for Google: sheet names cut off with “,...” are trimmed at a word boundary.</li>
          <li>Selling points (tested, 90-day warranty, 30-day returns, no core charge) as product highlights.</li>
          <li>$240 freight with 1–2 day handling and 3–7 day transit, so Google can show a delivery date.</li>
          <li>
            Labels for Google Ads bidding: brand (label 0), engine/transmission (label 1), price band (label 2), vehicle
            years (label 3), and real photo vs. generated image (label 4).
          </li>
        </ul>
      </details>
    </section>
  )
}
