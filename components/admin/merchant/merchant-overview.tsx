import { CheckCircle2, CircleAlert } from "lucide-react"
import { MerchantAccountSettings } from "@/components/admin/merchant/account-settings"
import { CopyField } from "@/components/admin/merchant/copy-field"
import {
  COMPARISON_SHOPPING_SERVICE,
  FEED_PATH,
  ISSUE_LABELS,
  MERCHANT_CENTER_ID,
  MERCHANT_STORE_NAME,
  SITE_URL,
  type BrandFeedStats,
  type FeedFetch,
  type IssueCode,
} from "@/lib/merchant"

const fmt = (n: number) => n.toLocaleString("en-US")
const when = (iso: string) => new Date(iso).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })

export function MerchantOverview({
  stats,
  fetches,
  overrideCount,
}: {
  stats: BrandFeedStats[]
  fetches: { recent: FeedFetch[]; lastGoogle: string | null }
  overrideCount: number
}) {
  const total = stats.reduce((a, b) => a + b.total, 0)
  const eligible = stats.reduce((a, b) => a + b.eligible, 0)
  const issueTotals = Object.keys(ISSUE_LABELS).map((code) => ({
    code: code as IssueCode,
    count: stats.reduce((a, b) => a + b.issues[code as IssueCode], 0),
  }))

  return (
    <div className="flex flex-col gap-6">
      <section aria-labelledby="merchant-account" className="rounded-lg border border-border bg-card p-5">
        <div className="flex flex-col gap-1">
          <h2 id="merchant-account" className="text-lg font-semibold text-foreground">
            {MERCHANT_STORE_NAME}
          </h2>
          <p className="text-sm text-muted-foreground">
            Merchant Center ID <span className="font-mono text-foreground">{MERCHANT_CENTER_ID}</span> · {COMPARISON_SHOPPING_SERVICE}
          </p>
        </div>

        <MerchantAccountSettings defaultId={String(MERCHANT_CENTER_ID)} defaultName={MERCHANT_STORE_NAME} />

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <CopyField label="Product feed URL (scheduled fetch)" value={`${SITE_URL}${FEED_PATH}`} />
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground">Sync status</span>
            <div className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm">
              {fetches.lastGoogle ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" aria-hidden="true" />
                  <span className="text-foreground">Google last fetched the feed {when(fetches.lastGoogle)}</span>
                </>
              ) : (
                <>
                  <CircleAlert className="h-4 w-4 text-amber-500" aria-hidden="true" />
                  <span className="text-foreground">Google has not fetched the feed yet — add it in Merchant Center.</span>
                </>
              )}
            </div>
          </div>
        </div>

        <details className="mt-4 text-sm">
          <summary className="cursor-pointer font-medium text-primary">How to connect the feed in Merchant Center</summary>
          <ol className="mt-3 flex list-decimal flex-col gap-1.5 pl-5 text-muted-foreground">
            <li>
              Open{" "}
              <a
                className="text-primary hover:underline"
                href={`https://merchants.google.com/mc/products/sources?a=${MERCHANT_CENTER_ID}`}
                target="_blank"
                rel="noreferrer"
              >
                Merchant Center → Products → Data sources
              </a>
              .
            </li>
            <li>Choose “Add product source” → “Add products from a file” → “Add a file link”.</li>
            <li>Paste the feed URL above, set country United States, language English, and a daily fetch.</li>
            <li>Every fix saved below is included automatically in Google’s next fetch.</li>
          </ol>
        </details>
      </section>

      <section aria-label="Feed totals" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Product pages", value: fmt(total) },
          { label: "Sent to Google", value: fmt(eligible) },
          { label: "Not sent (no price / excluded)", value: fmt(total - eligible) },
          { label: "Pages with admin fixes", value: fmt(overrideCount) },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border border-border bg-card p-4">
            <p className="text-2xl font-bold text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </section>

      <section aria-labelledby="feed-issues" className="rounded-lg border border-border bg-card p-5">
        <h2 id="feed-issues" className="mb-3 font-semibold text-foreground">
          Page issues
        </h2>
        <ul className="grid gap-2 sm:grid-cols-2">
          {issueTotals.map((i) => (
            <li key={i.code}>
              <a
                href={`/admin/products?issue=${i.code}#fix-pages`}
                className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2 text-sm hover:border-primary"
              >
                <span className="text-foreground">{ISSUE_LABELS[i.code]}</span>
                <span className="rounded-full bg-muted px-2 text-xs font-semibold text-foreground">{fmt(i.count)}</span>
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="brand-breakdown" className="rounded-lg border border-border bg-card">
        <h2 id="brand-breakdown" className="p-5 pb-3 font-semibold text-foreground">
          By brand
        </h2>
        <div className="max-h-96 overflow-auto">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-card text-xs text-muted-foreground">
              <tr>
                <th scope="col" className="px-5 py-2 font-medium">Brand</th>
                <th scope="col" className="px-3 py-2 text-right font-medium">Pages</th>
                <th scope="col" className="px-3 py-2 text-right font-medium">In feed</th>
                <th scope="col" className="px-3 py-2 text-right font-medium">Quote only</th>
                <th scope="col" className="px-5 py-2 text-right font-medium">Feed</th>
              </tr>
            </thead>
            <tbody>
              {stats.map((b) => (
                <tr key={b.slug} className="border-t border-border">
                  <td className="px-5 py-2">
                    <a href={`/admin/products?brand=${b.slug}#fix-pages`} className="text-foreground hover:text-primary">
                      {b.label}
                    </a>
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">{fmt(b.total)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{fmt(b.eligible)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{fmt(b.issues.no_price)}</td>
                  <td className="px-5 py-2 text-right">
                    <a
                      href={`${FEED_PATH}?brand=${b.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-primary hover:underline"
                    >
                      Preview XML
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {fetches.recent.length > 0 && (
        <section aria-labelledby="fetch-log" className="rounded-lg border border-border bg-card p-5">
          <h2 id="fetch-log" className="mb-3 font-semibold text-foreground">
            Recent feed fetches
          </h2>
          <ul className="flex flex-col gap-1 text-sm">
            {fetches.recent.map((f) => (
              <li key={f.fetchedAt} className="flex flex-wrap gap-x-3 text-muted-foreground">
                <time dateTime={f.fetchedAt} className="text-foreground">{when(f.fetchedAt)}</time>
                <span>{f.isGoogle ? "Google" : "Other"}</span>
                {f.brand && <span>brand: {f.brand}</span>}
                <span className="truncate">{f.userAgent}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
