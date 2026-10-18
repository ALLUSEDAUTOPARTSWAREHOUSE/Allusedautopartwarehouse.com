import { AlertTriangle, CheckCircle2, CircleDashed, ShieldCheck, SlidersHorizontal } from "lucide-react"
import {
  ISSUE_LABELS,
  type BrandFeedStats,
  type IssueCode,
} from "@/lib/merchant"

const fmt = (n: number) => n.toLocaleString("en-US")

const checks: {
  title: string
  detail: string
  issue?: IssueCode
  level: "blocker" | "quality" | "manual"
}[] = [
  {
    title: "A valid purchasable price",
    detail: "Quote-only listings should stay out of the product feed until a real customer-facing price is available.",
    issue: "no_price",
    level: "blocker",
  },
  {
    title: "Page is visible and included intentionally",
    detail: "Hidden pages and manually excluded offers must not be treated as feed-ready.",
    issue: "hidden",
    level: "blocker",
  },
  {
    title: "No manual feed exclusion",
    detail: "Review exclusions to ensure they are deliberate and still needed.",
    issue: "excluded",
    level: "blocker",
  },
  {
    title: "Title fits the feed title limit",
    detail: "Keep titles concise, descriptive and specific to the actual used part.",
    issue: "title_too_long",
    level: "quality",
  },
  {
    title: "Useful product description",
    detail: "Descriptions should identify the part accurately and avoid unsupported claims.",
    issue: "short_description",
    level: "quality",
  },
  {
    title: "Real product photography",
    detail: "Illustrative/generated images are a risk; replace them with accurate photos of the item being sold.",
    issue: "illustrative_image",
    level: "quality",
  },
]

export function MerchantPreflightCenter({ stats }: { stats: BrandFeedStats[] }) {
  const total = stats.reduce((sum, item) => sum + item.total, 0)
  const eligible = stats.reduce((sum, item) => sum + item.eligible, 0)
  const countFor = (issue: IssueCode) => stats.reduce((sum, item) => sum + item.issues[issue], 0)
  const blockers = countFor("no_price") + countFor("hidden") + countFor("excluded")
  const quality = countFor("title_too_long") + countFor("short_description") + countFor("illustrative_image")

  return (
    <section aria-labelledby="preflight-heading" className="rounded-xl border border-border bg-card p-5 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            Pre-submission quality gate
          </div>
          <h2 id="preflight-heading" className="text-xl font-bold text-foreground">Merchant feed readiness center</h2>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Find catalog risks before Google fetches the feed. These checks improve readiness but cannot guarantee approval;
            Google may also flag account, policy, shipping, tax, website or destination-specific issues.
          </p>
        </div>
        <a href="https://merchants.google.com/mc/products/diagnostics?a=5828832429" target="_blank" rel="noreferrer"
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium text-foreground hover:border-primary">
          Open Google diagnostics <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
        </a>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-lg border border-border p-4">
          <p className="text-2xl font-bold tabular-nums text-foreground">{fmt(total)}</p>
          <p className="mt-1 text-xs text-muted-foreground">Catalog products audited</p>
        </div>
        <div className="rounded-lg border border-border p-4">
          <p className="text-2xl font-bold tabular-nums text-foreground">{fmt(eligible)}</p>
          <p className="mt-1 text-xs text-muted-foreground">Eligible under current local rules</p>
        </div>
        <div className="rounded-lg border border-amber-500/40 p-4">
          <p className="text-2xl font-bold tabular-nums text-amber-600 dark:text-amber-400">{fmt(blockers)}</p>
          <p className="mt-1 text-xs text-muted-foreground">Eligibility / exclusion findings</p>
        </div>
        <div className="rounded-lg border border-border p-4">
          <p className="text-2xl font-bold tabular-nums text-foreground">{fmt(quality)}</p>
          <p className="mt-1 text-xs text-muted-foreground">Content and image findings</p>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3">
        <h3 className="font-semibold text-foreground">Preflight checks and direct repair queues</h3>
        {checks.map((check) => {
          const count = check.issue ? countFor(check.issue) : 0
          const done = count === 0
          return (
            <div key={check.title} className="flex flex-col gap-3 rounded-lg border border-border p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 gap-3">
                <div className="mt-0.5 shrink-0">
                  {done ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" aria-hidden="true" />
                  ) : check.level === "blocker" ? (
                    <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" aria-hidden="true" />
                  ) : (
                    <CircleDashed className="h-5 w-5 text-amber-600 dark:text-amber-400" aria-hidden="true" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-foreground">{check.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{check.detail}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {check.level === "blocker" ? "Eligibility / control check" : "Catalog quality check"}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-3 sm:justify-end">
                <span className={`text-sm font-semibold tabular-nums ${done ? "text-green-600 dark:text-green-400" : "text-foreground"}`}>
                  {fmt(count)} {done ? "clear" : "to review"}
                </span>
                {check.issue && (
                  <a href={`/admin/merchant?issue=${check.issue}#fix-pages`}
                    className="rounded-md border border-border px-3 py-2 text-sm font-medium text-foreground hover:border-primary">
                    Review
                  </a>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-5 rounded-lg bg-muted/50 p-4">
        <h3 className="font-semibold text-foreground">Next compliance layers to connect</h3>
        <ul className="mt-2 grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
          <li>• Google Content API / Merchant API diagnostics and offer-level status</li>
          <li>• Landing page price and availability comparison against feed values</li>
          <li>• GTIN / MPN / brand and used-condition validation where applicable</li>
          <li>• Shipping, returns, tax, domain and account-policy readiness</li>
          <li>• Scheduled preflight report with a failure log and alerting</li>
          <li>• Safe bulk repair with a preview, explicit confirmation and audit trail</li>
        </ul>
        <p className="mt-3 text-xs text-muted-foreground">
          Google account authorization and scheduled monitoring are not enabled by this panel. Connect and verify those
          services before displaying live Google approval or disapproval status.
        </p>
      </div>
    </section>
  )
}
