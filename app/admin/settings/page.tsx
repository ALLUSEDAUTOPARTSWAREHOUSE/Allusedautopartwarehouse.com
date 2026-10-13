import { redirect } from "next/navigation"
import { CheckCircle2, CircleAlert, CircleDashed, XCircle } from "lucide-react"
import { getAdminSession } from "@/lib/admin-auth"
import { checkDatabase, checkEnvironment } from "@/lib/admin-health"
import { customerEmailReady } from "@/lib/followup-notify"
import { FEED_PATH, SITE_URL, listFeedFetches } from "@/lib/merchant"
import { listFeedSnapshots } from "@/lib/merchant-health"
import { PHONE_DISPLAY, RETURNS, SHIPPING, WARRANTY_SUMMARY } from "@/lib/site-policy"
import { RepairDatabaseButton } from "@/components/admin/repair-database-button"
import { SettingsControlLinks, StorePolicyEditor } from "@/components/admin/settings-editors"
import { getEditableStorePolicy } from "@/lib/admin-store-settings"

export const dynamic = "force-dynamic"
export const metadata = { title: "Settings & Health | AUAPW Admin", robots: { index: false } }

const when = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Chicago" }) : "Never"

export default async function AdminSettingsPage() {
  const session = await getAdminSession()
  if (!session) redirect("/admin/login")

  const [env, tables, snapshots, fetches, editablePolicy] = await Promise.all([
    Promise.resolve(checkEnvironment()),
    checkDatabase(),
    listFeedSnapshots(1),
    listFeedFetches(1).catch(() => ({ recent: [], lastGoogle: null })),
    getEditableStorePolicy(),
  ])
  const email = customerEmailReady()
  const missingRequired = env.filter((e) => e.required && !e.set)
  const brokenTables = tables.filter((t) => !t.ok)

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold text-foreground">Settings &amp; system health</h1>
        <p className="text-sm text-muted-foreground">
          Live health checks plus safe editing links. Secret values stay in provider dashboards and are never displayed here.
        </p>
      </header>

      <section
        aria-label="Summary"
        className={`rounded-lg border p-4 text-sm ${
          missingRequired.length || brokenTables.length
            ? "border-destructive/40 bg-destructive/10"
            : "border-green-600/40 bg-green-600/10"
        }`}
      >
        {missingRequired.length || brokenTables.length ? (
          <p className="flex items-start gap-2 text-foreground">
            <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden="true" />
            {[
              missingRequired.length ? `${missingRequired.length} required setting(s) missing` : null,
              brokenTables.length ? `${brokenTables.length} database table(s) can't be read` : null,
            ]
              .filter(Boolean)
              .join(" · ")}
            . Details below.
          </p>
        ) : (
          <p className="flex items-center gap-2 text-foreground">
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" aria-hidden="true" />
            All required settings are present and every table can be read.
          </p>
        )}
      </section>

      <section aria-labelledby="env-heading" className="rounded-lg border border-border bg-card">
        <h2 id="env-heading" className="border-b border-border px-5 py-3 text-lg font-semibold text-foreground">
          Settings in Vercel
        </h2>
        <ul className="divide-y divide-border">
          {env.map((e) => (
            <li key={e.name} className="flex items-start gap-3 px-5 py-3 text-sm">
              {e.set ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600 dark:text-green-400" aria-hidden="true" />
              ) : e.required ? (
                <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden="true" />
              ) : (
                <CircleDashed className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              )}
              <span className="min-w-0 flex-1">
                <code className="text-xs font-semibold text-foreground">{e.name}</code>
                <span className="block text-muted-foreground">{e.purpose}</span>
              </span>
              <span className={`text-xs ${e.set ? "text-muted-foreground" : e.required ? "text-destructive" : "text-muted-foreground"}`}>
                {e.set ? "Set" : e.required ? "Missing" : "Optional · not set"}
              </span>
            </li>
          ))}
        </ul>
        {!email.ok && (
          <p className="border-t border-border px-5 py-3 text-xs text-amber-600 dark:text-amber-400">
            Customer emails (order updates, quotes) won&apos;t be delivered yet: {email.reason}.
          </p>
        )}
      </section>

      <section aria-labelledby="db-heading" className="rounded-lg border border-border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3">
          <h2 id="db-heading" className="text-lg font-semibold text-foreground">
            Database
          </h2>
          {brokenTables.length > 0 && <RepairDatabaseButton />}
        </div>
        <ul className="divide-y divide-border">
          {tables.map((t) => (
            <li key={t.table} className="flex items-start gap-3 px-5 py-3 text-sm">
              {t.ok ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600 dark:text-green-400" aria-hidden="true" />
              ) : (
                <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden="true" />
              )}
              <span className="min-w-0 flex-1">
                <code className="text-xs font-semibold text-foreground">{t.table}</code>
                <span className="block text-muted-foreground">{t.purpose}</span>
                {t.error && <code className="mt-1 block text-xs text-destructive">{t.error}</code>}
              </span>
              <span className="text-xs tabular-nums text-muted-foreground">
                {t.ok ? `${(t.rows ?? 0).toLocaleString("en-US")} row${t.rows === 1 ? "" : "s"}` : "Error"}
              </span>
            </li>
          ))}
        </ul>
        {brokenTables.length > 0 && (
          <p className="border-t border-border px-5 py-3 text-xs text-muted-foreground">
            The repair button only adds what is missing (tables, columns); it never deletes or changes existing data. If an
            error still shows afterwards, send it to your developer.
          </p>
        )}
      </section>

      <SettingsControlLinks />

      <section aria-labelledby="auto-heading" className="rounded-lg border border-border bg-card p-5">
        <h2 id="auto-heading" className="mb-3 text-lg font-semibold text-foreground">
          Automation
        </h2>
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Daily check &amp; report email</dt>
            <dd className="text-foreground">Every morning about 8am Central · last run {when(snapshots[0]?.takenAt)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Google Shopping feed</dt>
            <dd className="text-foreground">
              <a href={`${SITE_URL}${FEED_PATH}`} className="text-primary hover:underline" target="_blank" rel="noreferrer">
                {FEED_PATH}
              </a>{" "}
              · Google last fetched {when(fetches.lastGoogle)}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Report emails go to</dt>
            <dd className="text-foreground">{process.env.FOLLOWUP_EMAIL ? "FOLLOWUP_EMAIL (set in Vercel)" : "auapworld@gmail.com"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Signed in as</dt>
            <dd className="text-foreground">{session.email}</dd>
          </div>
        </dl>
      </section>

      <section aria-labelledby="store-heading" className="rounded-lg border border-border bg-card p-5">
        <h2 id="store-heading" className="mb-1 text-lg font-semibold text-foreground">
          Store policy values
        </h2>
        <p className="mb-4 text-xs text-muted-foreground">
          Edit and save the admin policy values. These are stored separately; storefront, checkout, and Merchant-feed policy constants are not changed by this editor yet.
        </p>
        <dl className="mb-5 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Current code default · phone</dt>
            <dd className="text-foreground">{PHONE_DISPLAY}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Current code default · shipping</dt>
            <dd className="text-foreground">{SHIPPING.label}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Current code default · warranty</dt>
            <dd className="text-foreground">{WARRANTY_SUMMARY}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Current code default · returns</dt>
            <dd className="text-foreground">{RETURNS.window}</dd>
          </div>
        </dl>
        <StorePolicyEditor policy={editablePolicy} />
      </section>
    </div>
  )
}
