import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowUpRight, CheckCircle2, CircleAlert, Database, ExternalLink, RefreshCw, Users, ShoppingBag } from "lucide-react"
import { getAdminSession } from "@/lib/admin-auth"

export const dynamic = "force-dynamic"
export const metadata = { title: "OpenAI Ads Dashboard | AUAPW Admin", robots: { index: false, follow: false } }

const AUDIENCES_URL = "https://ads.openai.com/settings/audiences?act=adacct_6ad54684a43081a2820426a0f048bf2a"
const ADS_ACCOUNT_ID = "adacct_6ad54684a43081a2820426a0f048bf2a"

function Status({ children, ready = false }: { children: React.ReactNode; ready?: boolean }) {
  return <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${ready ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"}`}>
    {ready ? <CheckCircle2 className="h-3.5 w-3.5" /> : <CircleAlert className="h-3.5 w-3.5" />}
    {children}
  </span>
}

export default async function OpenAIAdsDashboard() {
  if (!(await getAdminSession())) redirect("/admin/login")

  return <div className="mx-auto flex max-w-6xl flex-col gap-8">
    <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <p className="text-sm font-medium text-primary">Advertising integrations</p>
        <h1 className="mt-1 text-2xl font-bold text-foreground">OpenAI Ads Dashboard</h1>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">Manage the AUAPW product-catalog connection and open your OpenAI Ads audience settings from one admin workspace.</p>
      </div>
      <a href={AUDIENCES_URL} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-md border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-muted">
        Open Audiences <ExternalLink className="h-4 w-4" />
      </a>
    </header>

    <section className="grid gap-4 md:grid-cols-3">
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">OpenAI Ads account</span><Users className="h-5 w-5 text-muted-foreground" /></div>
        <p className="mt-3 break-all font-mono text-sm font-semibold">{ADS_ACCOUNT_ID}</p>
        <div className="mt-3"><Status>Account link saved · API not verified</Status></div>
      </div>
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Product feed</span><ShoppingBag className="h-5 w-5 text-muted-foreground" /></div>
        <p className="mt-3 text-lg font-semibold">Not connected</p>
        <div className="mt-3"><Status>Awaiting feed setup</Status></div>
      </div>
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Product sync</span><RefreshCw className="h-5 w-5 text-muted-foreground" /></div>
        <p className="mt-3 text-lg font-semibold">Not yet running</p>
        <div className="mt-3"><Status>Last sync not available</Status></div>
      </div>
    </section>

    <section className="rounded-xl border border-border bg-card p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-primary/10 p-2"><Database className="h-5 w-5 text-primary" /></div>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold">AUAPW catalog feed</h2>
          <p className="mt-1 text-sm text-muted-foreground">The intended connection is a dedicated OpenAI-compatible product feed generated from the same current AUAPW catalog and effective product overrides used by the store. It should keep titles, descriptions, canonical product URLs, real product images, prices, availability, brand, condition, and ads-eligibility aligned with the website.</p>
          <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
            <p className="text-sm font-semibold">Setup required before products can sync</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              <li>Create or select a product feed in OpenAI Ads Manager and configure its hosted URL or SFTP connection.</li>
              <li>Provide server-side Ads API credentials only through the deployment environment; never paste or expose the secret in this dashboard.</li>
              <li>Validate the feed schema and product URLs, then confirm ingestion and approval counts in Ads Manager.</li>
            </ul>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <a href="https://ads.openai.com/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">Open Ads Manager <ArrowUpRight className="h-4 w-4" /></a>
            <Link href="/admin/merchant" className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted">Review Google feed <ArrowUpRight className="h-4 w-4" /></Link>
            <Link href="/admin/products" className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted">Manage AUAPW products <ArrowUpRight className="h-4 w-4" /></Link>
          </div>
        </div>
      </div>
    </section>

    <section className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2"><Users className="h-5 w-5 text-primary" /><h2 className="text-lg font-semibold">Custom audiences</h2></div>
        <p className="mt-2 text-sm text-muted-foreground">Open the linked Ads account to create or manage audience lists. Audiences contain customer/prospect identifiers; they are not product feed records.</p>
        <a href={AUDIENCES_URL} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">Manage audiences <ExternalLink className="h-4 w-4" /></a>
        <p className="mt-3 text-xs text-muted-foreground">Only use first-party data you have the right to use for advertising and the required privacy notices, permissions, and consents.</p>
      </div>
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2"><RefreshCw className="h-5 w-5 text-primary" /><h2 className="text-lg font-semibold">Sync and validation rules</h2></div>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
          <li>Use a separate OpenAI feed format; do not submit the Google XML file as if it were an OpenAI catalog.</li>
          <li>Keep the canonical URL, real product image, price, stock status, and product identifiers consistent with the live product page.</li>
          <li>Exclude quote-only or unavailable products unless they satisfy the feed's purchase and eligibility requirements.</li>
          <li>Show upload history, processed/not-approved/ready counts, and last successful sync only after real feed telemetry is connected.</li>
        </ul>
      </div>
    </section>

    <p className="text-xs text-muted-foreground">Connection status is intentionally marked unverified. This page does not upload audience data, create a feed, change campaigns, or claim products are syncing until the required account permissions and integration are configured.</p>
  </div>
}
