"use client"

import { useActionState } from "react"
import Link from "next/link"
import { saveStorePolicyAction, type SettingsActionState } from "@/app/admin/settings/actions"
import type { EditableStorePolicy } from "@/lib/admin-store-settings"

const initialState: SettingsActionState = { ok: false, message: "" }
const inputClass = "mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"

export function StorePolicyEditor({ policy }: { policy: EditableStorePolicy }) {
  const [state, action, pending] = useActionState(saveStorePolicyAction, initialState)
  return (
    <section aria-labelledby="store-policy-editor-heading" className="rounded-lg border border-border bg-card p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="store-policy-editor-heading" className="text-lg font-semibold text-foreground">Edit store policy values</h2>
          <p className="mt-1 text-sm text-muted-foreground">Save validated values to the admin settings database. Existing orders and payment records are not modified.</p>
        </div>
        <span className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground">Admin-only</span>
      </div>
      <form action={action} className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium text-foreground">Store phone number
          <input className={inputClass} name="phone" defaultValue={policy.phone} autoComplete="tel" required maxLength={24} />
        </label>
        <label className="text-sm font-medium text-foreground">Flat-rate shipping per part (USD)
          <input className={inputClass} name="shippingPrice" type="number" min="0" max="100000" step="0.01" defaultValue={policy.shippingPrice} required />
        </label>
        <label className="text-sm font-medium text-foreground">Warranty duration (days)
          <input className={inputClass} name="warrantyDays" type="number" min="1" max="3650" step="1" defaultValue={policy.warrantyDays} required />
        </label>
        <label className="text-sm font-medium text-foreground">Return window (days; 0 disables returns)
          <input className={inputClass} name="returnDays" type="number" min="0" max="3650" step="1" defaultValue={policy.returnDays} required />
        </label>
        <label className="text-sm font-medium text-foreground sm:col-span-2">Return policy details
          <textarea className={inputClass} name="returnDetails" rows={3} defaultValue={policy.returnDetails} required minLength={10} maxLength={1200} />
        </label>
        {state.message ? <p role={state.ok ? "status" : "alert"} className={`sm:col-span-2 rounded-md border p-3 text-sm ${state.ok ? "border-green-600/30 bg-green-600/10 text-foreground" : "border-destructive/40 bg-destructive/10 text-foreground"}`}>{state.message}</p> : null}
        <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
          <button type="submit" disabled={pending} className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:cursor-wait disabled:opacity-60">{pending ? "Saving…" : "Save policy values"}</button>
          <span className="text-xs text-muted-foreground">Secrets are never entered or displayed here.</span>
        </div>
      </form>
    </section>
  )
}

const cards = [
  { title: "System health", detail: "Review environment-variable presence and database row counts. Repair only adds missing schema objects.", href: "#db-heading", label: "Review health" },
  { title: "Automation", detail: "Inspect feed fetch history and daily-report status. Scheduler and environment changes belong in Vercel.", href: "https://vercel.com/auapw/allusedautopartwarehouse-com/settings/cron-jobs", label: "Open cron settings" },
  { title: "Payments", detail: "Manage enabled gateways and default payment methods in the existing payment editor.", href: "/admin/payments", label: "Manage payments" },
  { title: "Email settings", detail: "Check Resend key and sender configuration status without exposing credentials.", href: "https://resend.com/domains", label: "Manage email domain" },
  { title: "Team permissions", detail: "Open the existing authenticated team directory to review staff records and roles.", href: "/admin/team", label: "Manage team" },
  { title: "Secure integrations", detail: "View missing/present status in this page; set secret values in Vercel, then redeploy. Never paste API keys here.", href: "https://vercel.com/auapw/allusedautopartwarehouse-com/settings/environment-variables", label: "Open environment variables" },
]

export function SettingsControlLinks() {
  return (
    <section aria-labelledby="settings-options-heading" className="space-y-3">
      <div>
        <h2 id="settings-options-heading" className="text-lg font-semibold text-foreground">Editing options</h2>
        <p className="mt-1 text-sm text-muted-foreground">Use the existing safe editors where available; credentials stay in the provider's secure settings.</p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {cards.map((card) => {
          const external = card.href.startsWith("https://")
          return <article key={card.title} className="rounded-lg border border-border bg-card p-4">
            <h3 className="font-semibold text-foreground">{card.title}</h3>
            <p className="mt-1 min-h-10 text-sm text-muted-foreground">{card.detail}</p>
            {external
              ? <a className="mt-3 inline-flex text-sm font-medium text-primary underline-offset-4 hover:underline" href={card.href} target="_blank" rel="noreferrer">{card.label} ↗</a>
              : <Link className="mt-3 inline-flex text-sm font-medium text-primary underline-offset-4 hover:underline" href={card.href}>{card.label} →</Link>}
          </article>
        })}
      </div>
    </section>
  )
}
