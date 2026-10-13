"use client"

import Link from "next/link"
import { useActionState } from "react"
import { Mail, Phone } from "lucide-react"
import { saveQuoteFollowup, type FollowupActionState } from "@/app/admin/followup-actions"
import type { QuoteLead } from "@/lib/followup"
import { StatusBadge } from "@/components/admin/status-badge"
import { FollowupAssignmentSelect } from "@/components/admin/followup-assignment-select"
import type { FollowupStaffOption, FollowupAssignment } from "@/lib/followup-assignments"

const initial: FollowupActionState = { ok: false, message: "" }
const money = (amount: number) => `${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

function safeInternalPath(value: string | null): string | null {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes(String.fromCharCode(92)) || value.includes("://")) return null
  const path = value.split(/[?#]/, 1)[0]
  if (path.split("/").some((segment) => segment === "." || segment === "..")) return null
  return path
}

export function QuoteLeadCard({ lead, statuses, staffOptions, assignment, productInfo }: { lead: QuoteLead; statuses: readonly string[]; staffOptions: FollowupStaffOption[]; assignment: FollowupAssignment | null; productInfo: { name: string | null; url: string | null; priceMissing: boolean; priceEditorUrl: string | null } | null }) {
  const [state, action, pending] = useActionState(saveQuoteFollowup, initial)
  const vehicle = [lead.year, lead.make, lead.model].filter(Boolean).join(" ") || "Vehicle not specified"
  const location = [lead.state, lead.zip].filter(Boolean).join(" ")
  const sourcePath = safeInternalPath(lead.pageUrl)

  return (
    <article className="rounded-lg border border-border bg-card p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:gap-8">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs text-muted-foreground">#{lead.id}</span>
            <StatusBadge status={lead.status} />
            <time className="text-xs text-muted-foreground" dateTime={lead.createdAt}>
              Created {new Date(lead.createdAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
            </time>
            <time className="text-xs text-muted-foreground" dateTime={lead.updatedAt}>
              Updated {new Date(lead.updatedAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
            </time>
            {lead.source && <span className="text-xs text-muted-foreground">via {lead.source}</span>
            }
            <span className="ml-auto text-right">
              <span className="block text-[10px] uppercase tracking-wide text-muted-foreground">Quote amount</span>
              <span className="text-base font-bold text-foreground">{lead.quoteAmount === null ? "Not quoted" : money(lead.quoteAmount)}</span>
            </span>}
          </div>
          <h2 className="text-lg font-semibold text-foreground">
            {vehicle} <span className="text-muted-foreground">— {lead.partType}</span>
          </h2>
          {lead.partOption && <p className="text-sm text-muted-foreground">Option: {lead.partOption}</p>}
          {productInfo?.name ? (
            <div className="mt-3 rounded-md border border-primary/20 bg-primary/5 p-3 text-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Product of interest</p>
              {productInfo.url
                ? <Link href={productInfo.url} target="_blank" className="mt-1 inline-flex font-semibold text-primary underline">{productInfo.name} ↗</Link>
                : <p className="mt-1 font-semibold text-foreground">{productInfo.name}</p>}
              {productInfo.priceMissing && productInfo.priceEditorUrl
                ? <Link href={productInfo.priceEditorUrl} className="mt-2 block text-xs font-semibold text-amber-600 underline">Missing catalog price — set it now →</Link>
                : null}
            </div>
          ) : null}
          {sourcePath && sourcePath !== productInfo?.url ? (
            <p className="mt-2 text-xs text-muted-foreground">
              Request source: <Link href={sourcePath} target="_blank" className="text-primary underline">{sourcePath} ↗</Link>
            </p>
          ) : null}

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            <span className="font-medium text-foreground">{lead.fullName}</span>
            <a href={`tel:${lead.phone.replace(/[^\d+]/g, "")}`} className="inline-flex items-center gap-1 text-primary hover:underline">
              <Phone className="h-3.5 w-3.5" aria-hidden="true" />
              {lead.phone}
            </a>
            {lead.email && (
              <a href={`mailto:${lead.email}`} className="inline-flex items-center gap-1 text-primary hover:underline">
                <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                {lead.email}
              </a>
            )}
            {location && <span className="text-muted-foreground">{location}</span>}
          </div>
          {lead.notes && (
            <p className="mt-3 whitespace-pre-wrap rounded-md bg-muted/50 p-3 text-sm text-foreground">{lead.notes}</p>
          )}
        </div>

        <div className="flex w-full flex-col gap-3 lg:w-80">
          <FollowupAssignmentSelect recordType="quote" recordId={String(lead.id)} staff={staffOptions} assignment={assignment} />
          <form action={action} className="flex w-full flex-col gap-3">
          <input type="hidden" name="id" value={lead.id} />
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
              Status
              <select
                name="status"
                defaultValue={lead.status}
                className="rounded-md border border-border bg-background px-2 py-2 text-sm capitalize text-foreground"
              >
                {statuses.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
              Quoted price ($)
              <input
                name="quoteAmount"
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                defaultValue={lead.quoteAmount ?? ""}
                className="rounded-md border border-border bg-background px-2 py-2 text-sm text-foreground"
              />
            </label>
          </div>
          <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
            Follow-up notes
            <textarea
              name="internalNotes"
              rows={3}
              defaultValue={lead.internalNotes ?? ""}
              placeholder="Called, left voicemail, sent price…"
              className="resize-y rounded-md border border-border bg-background px-2 py-2 text-sm text-foreground"
            />
          </label>
          <details className="rounded-md border border-border px-3 py-2 text-xs text-muted-foreground">
            <summary className="cursor-pointer font-medium text-foreground">Email the quote</summary>
            <label className="mt-2 flex items-start gap-2">
              <input
                type="checkbox"
                name="emailQuote"
                disabled={!lead.email}
                className="mt-0.5 h-3.5 w-3.5 accent-primary"
              />
              <span>
                {lead.email
                  ? `Send ${lead.email} the quoted price above when I save`
                  : "No email on this request — call instead"}
              </span>
            </label>
            <label className="mt-2 flex flex-col gap-1">
              Message (optional)
              <textarea
                name="customerMessage"
                rows={2}
                maxLength={1000}
                placeholder="Low-mileage unit, 62k miles, ships tomorrow"
                className="resize-y rounded-md border border-border bg-background px-2 py-2 text-sm text-foreground"
              />
            </label>
          </details>
          <div className="flex items-center justify-between gap-3">
            <p role="status" className={`text-xs ${state.ok ? "text-green-500" : "text-destructive"}`}>
              {pending ? "" : state.message}
            </p>
            <button
              type="submit"
              disabled={pending}
              className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
            >
              {pending ? "Saving…" : "Save"}
            </button>
          </div>
          </form>
        </div>
      </div>
    </article>
  )
}
