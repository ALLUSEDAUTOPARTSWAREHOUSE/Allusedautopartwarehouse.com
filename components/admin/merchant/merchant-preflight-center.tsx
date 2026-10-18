import { AlertTriangle, CheckCircle2, CircleDashed, ShieldCheck, SlidersHorizontal } from "lucide-react"
import Link from "next/link"
import { ISSUE_LABELS, type BrandFeedStats, type IssueCode } from "@/lib/merchant"

const fmt = (n: number) => n.toLocaleString("en-US")

const checks: { title: string; detail: string; issue: IssueCode; level: "blocker" | "quality" }[] = [
  { title: "Valid purchasable price", detail: "Quote-only listings stay out until a real customer-facing price is available.", issue: "no_price", level: "blocker" },
  { title: "Page visibility", detail: "Hidden pages must not be treated as ready for product distribution.", issue: "hidden", level: "blocker" },
  { title: "Feed inclusion choice", detail: "Review manual exclusions to ensure they are intentional and current.", issue: "excluded", level: "blocker" },
  { title: "Title length", detail: "Keep titles concise and specific to the actual used part; Google may truncate long titles.", issue: "title_too_long", level: "quality" },
  { title: "Useful description", detail: "Describe the exact part and condition accurately; avoid unsupported claims.", issue: "short_description", level: "quality" },
  { title: "Accurate product photography", detail: "Review illustrative/generated imagery and replace it with genuine photos where possible.", issue: "illustrative_image", level: "quality" },
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
            <ShieldCheck className="h-4 w-4" aria-hidden="true" /> Pre-submission quality gate
          </div>
          <h2 id="preflight-heading" className="text-xl font-bold text-foreground">Merchant feed readiness center</h2>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Find preventable catalog risks before Google fetches the feed. These local checks improve readiness but cannot guarantee approval:
            Google may also flag account, policy, shipping, tax, website or destination-specific issues.
          </p>
        </div>
        <a href="https://merchants.google.com/mc/products/diagnostics?a=5828832429" target="_blank" rel="noreferrer"
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium text-foreground hover:border-primary">
          Open Google diagnostics <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
        </a>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Catalog records audited", value: total, note: "Current catalog inventory" },
          { label: "Locally feed-eligible", value: eligible, note: "Not confirmation of Google approval" },
          { label: "Eligibility / exclusion findings", value: blockers, note: "Issue counts may overlap" },
          { label: "Content / image findings", value: quality, note: "Issue counts may overlap" },
        ].map((metric) => (
          <article key={metric.label} className="rounded-lg border border-border p-4">
            <p className="text-2xl font-bold tabular-nums text-foreground">{fmt(metric.value)}</p>
            <p className="mt-1 text-xs font-medium text-foreground">{metric.label}</p>
            <p className="mt-1 text-xs text-muted-foreground">{metric.note}</p>
          </article>
        ))}
      </div>

      <div className="mt-5 flex flex-col gap-3">
        <h3 className="font-semibold text-foreground">Checks with direct product-fix links</h3>
        {checks.map((check) => {
          const count = countFor(check.issue)
          const clear = count === 0
          return (
            <div key={check.issue} className="flex flex-col gap-3 rounded-lg border border-border p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 gap-3">
                <div className="mt-0.5 shrink-0">
                  {clear ? <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" aria-hidden="true" /> :
                    check.level === "blocker" ? <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" aria-hidden="true" /> :
                    <CircleDashed className="h-5 w-5 text-amber-600 dark:text-amber-400" aria-hidden="true" />}
                </div>
                <div>
                  <p className="font-medium text-foreground">{check.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{check.detail}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{ISSUE_LABELS[check.issue]}</p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-3 sm:justify-end">
                <span className={`text-sm font-semibold tabular-nums ${clear ? "text-green-600 dark:text-green-400" : "text-foreground"}`}>
                  {fmt(count)} {clear ? "clear" : "to review"}
                </span>
                <Link href={`/admin/products?issue=${check.issue}#fix-pages`} className="rounded-md border border-border px-3 py-2 text-sm font-medium text-foreground hover:border-primary">
                  Review findings
                </Link>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-5 rounded-lg bg-muted/50 p-4">
        <h3 className="font-semibold text-foreground">Additional checks to add to the automated gate</h3>
        <ul className="mt-2 grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
          <li>• Feed price and availability match the live landing page</li>
          <li>• Brand, GTIN/MPN and used-condition attributes when applicable</li>
          <li>• Landing page returns successfully and uses HTTPS</li>
          <li>• Image URL is reachable and the image depicts the actual item</li>
          <li>• Shipping, returns, tax and target-country settings are complete</li>
          <li>• Google offer-level diagnostics and approval status are synchronized</li>
        </ul>
        <p className="mt-3 text-xs text-muted-foreground">
          Google API authorization and offer-level diagnostics are not enabled by this panel. Do not interpret local eligibility as Google acceptance.
          Scheduled checks and bulk changes must be verified in the connected environment before being treated as live.
        </p>
      </div>
    </section>
  )
}
