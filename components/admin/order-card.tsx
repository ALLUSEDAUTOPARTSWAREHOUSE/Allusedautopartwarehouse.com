"use client"

import Link from "next/link"
import { useActionState } from "react"
import { Mail, MapPin, Phone } from "lucide-react"
import { saveOrderFollowup, type FollowupActionState } from "@/app/admin/followup-actions"
import type { CustomerOrder } from "@/lib/followup"
import { StatusBadge } from "@/components/admin/status-badge"
import { FollowupAssignmentSelect } from "@/components/admin/followup-assignment-select"
import type { FollowupStaffOption, FollowupAssignment } from "@/lib/followup-assignments"

const initial: FollowupActionState = { ok: false, message: "" }
const money = (n: number) => `${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

function productEditorPath(value: string): string | null {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("://") || value.includes(String.fromCharCode(92))) return null
  const path = value.split(/[?#]/, 1)[0]
  const match = path.match(/^\/brands\/([a-z0-9-]+)\/([a-z0-9-]+)\/?$/i)
  if (!match || match[1] === "." || match[2] === "." || match[1] === ".." || match[2] === "..") return null
  return `/admin/products?brand=${encodeURIComponent(match[1].toLowerCase())}&q=${encodeURIComponent(match[2])}#fix-pages`
}

export function OrderCard({ order, statuses, staffOptions, assignment }: { order: CustomerOrder; statuses: readonly string[]; staffOptions: FollowupStaffOption[]; assignment: FollowupAssignment | null }) {
  const [state, action, pending] = useActionState(saveOrderFollowup, initial)
  const checkoutDetails = order.checkoutDetails ?? {}
  const billing = checkoutDetails.billingAddress && typeof checkoutDetails.billingAddress === "object"
    ? checkoutDetails.billingAddress as Record<string, unknown>
    : null
  const billingSummary = billing
    ? [billing.name, billing.address, billing.city, billing.state, billing.zipCode, billing.country].filter(Boolean).join(", ")
    : null

  return (
    <article className="rounded-lg border border-border bg-card p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:gap-8">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm font-semibold text-foreground">{order.orderNumber}</span>
            <StatusBadge status={order.status} />
            <span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">
              {order.status === "reserved_pending_fitment" ? "Reservation" : "Checkout order"}
            </span>
            {order.paymentGateway && (
              <span className="rounded-full border border-border px-2 py-0.5 text-xs capitalize text-muted-foreground">
                {order.paymentGateway}
              </span>
            )}
            {order.emailVerifiedAt ? (
              <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-400">
                Email verified
              </span>
            ) : (
              <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-xs text-amber-400">
                Awaiting email verification
              </span>
            )}
            <time className="text-xs text-muted-foreground" dateTime={order.createdAt}>
              Created {new Date(order.createdAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
            </time>
            <time className="text-xs text-muted-foreground" dateTime={order.updatedAt}>
              Updated {new Date(order.updatedAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
            </time>
            <span className="ml-auto text-lg font-bold text-foreground">{money(order.totalAmount)}</span>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            <span className="font-medium text-foreground">{order.customerName}</span>
            {order.customerPhone && (
              <a
                href={`tel:${order.customerPhone.replace(/[^\d+]/g, "")}`}
                className="inline-flex items-center gap-1 text-primary hover:underline"
              >
                <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                {order.customerPhone}
              </a>
            )}
            {order.customerEmail && (
              <a href={`mailto:${order.customerEmail}`} className="inline-flex items-center gap-1 text-primary hover:underline">
                <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                {order.customerEmail}
              </a>
            )}
          </div>
          {order.shippingAddress && (
            <p className="mt-2 inline-flex items-start gap-1 text-sm text-muted-foreground">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {order.shippingAddress}
            </p>
          )}
          {Object.keys(checkoutDetails).length > 0 && (
            <section className="mt-3 rounded-md border border-border bg-muted/20 p-3 text-xs">
              <h3 className="mb-2 font-semibold text-foreground">Checkout & freight approvals</h3>
              <div className="grid gap-2 sm:grid-cols-2">
                <p><span className="text-muted-foreground">Address type: </span><b className="capitalize">{String(checkoutDetails.addressType ?? "not recorded")}</b></p>
                <p><span className="text-muted-foreground">Liftgate: </span><b>{checkoutDetails.liftgateRequired === true ? "Required" : "Not selected"}</b></p>
                <p><span className="text-muted-foreground">Billing: </span><b>{checkoutDetails.billingSameAsShipping === true ? "Same as shipping" : "Separate address"}</b></p>
                {billingSummary && <p className="sm:col-span-2"><span className="text-muted-foreground">Billing address: </span>{billingSummary}</p>}
                <p><span className="text-muted-foreground">Approved total: </span><b>{typeof checkoutDetails.approvedTotal === "number" ? money(checkoutDetails.approvedTotal) : "Not recorded"}</b></p>
                <p><span className="text-muted-foreground">Policy record: </span><b>{checkoutDetails.termsAccepted === true && checkoutDetails.shippingPolicyAccepted === true && checkoutDetails.returnsPolicyAccepted === true ? "All accepted" : "Incomplete"}</b></p>
                {typeof checkoutDetails.policyAcceptedAt === "string" && <p className="sm:col-span-2"><span className="text-muted-foreground">Accepted at: </span>{checkoutDetails.policyAcceptedAt} · {String(checkoutDetails.policyVersion ?? "")}</p>}
              </div>
            </section>
          )}

          <div className="mt-3 overflow-hidden rounded-md border border-border">
            <div className="hidden grid-cols-[minmax(0,1fr)_5rem_7rem_7rem_8rem] gap-3 bg-muted/60 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground md:grid">
              <span>Purchased product</span><span className="text-right">Qty</span><span className="text-right">Unit price</span><span className="text-right">Line total</span><span>Product actions</span>
            </div>
            {order.items.map((line) => {
              const editorPath = productEditorPath(line.url)
              return (
                <div key={line.productId} className="grid grid-cols-2 gap-x-3 gap-y-1 border-t border-border px-3 py-3 text-sm first:border-t-0 md:grid-cols-[minmax(0,1fr)_5rem_7rem_7rem_8rem] md:items-center">
                  <div className="col-span-2 min-w-0 md:col-span-1">
                    <Link href={line.url} target="_blank" className="font-medium text-foreground hover:text-primary hover:underline">{line.name}</Link>
                    <p className="mt-0.5 break-all text-[11px] text-muted-foreground">{line.url}</p>
                  </div>
                  <span className="text-muted-foreground md:text-right"><span className="md:hidden">Qty: </span>{line.quantity}</span>
                  <span className="text-muted-foreground md:text-right"><span className="md:hidden">Unit: </span>{money(line.unitPrice)}</span>
                  <span className="font-semibold text-foreground md:text-right"><span className="md:hidden">Line total: </span>{money(line.lineTotal)}</span>
                  <div className="col-span-2 md:col-span-1">
                    {editorPath ? <Link href={editorPath} className="text-xs font-semibold text-primary underline">Edit product / price →</Link> : <span className="text-xs text-muted-foreground">Product editor unavailable</span>}
                  </div>
                </div>
              )
            })}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 rounded-md border border-border bg-muted/20 p-3 text-xs sm:grid-cols-4">
            <div><p className="text-muted-foreground">Subtotal</p><p className="mt-1 font-semibold text-foreground">{money(order.subtotal)}</p></div>
            <div><p className="text-muted-foreground">Tax</p><p className="mt-1 font-semibold text-foreground">{money(order.tax)}</p></div>
            <div><p className="text-muted-foreground">Shipping</p><p className="mt-1 font-semibold text-foreground">{money(order.shippingCost)}</p></div>
            <div><p className="text-muted-foreground">Order total</p><p className="mt-1 font-semibold text-foreground">{money(order.totalAmount)}</p></div>
          </div>
          {order.customerNotes && (
            <p className="mt-3 whitespace-pre-wrap rounded-md bg-muted/50 p-3 text-sm text-foreground">
              <span className="font-medium">Customer note: </span>
              {order.customerNotes}
            </p>
          )}
          {order.invoiceToken ? (
            <p className="mt-3">
              <Link
                href={`/invoice/${encodeURIComponent(order.orderNumber)}?t=${encodeURIComponent(order.invoiceToken)}`}
                className="text-sm font-semibold text-primary underline"
                target="_blank"
              >
                Open branded invoice
              </Link>
            </p>
          ) : null}
        </div>

        <div className="flex w-full flex-col gap-3 lg:w-80">
          <FollowupAssignmentSelect recordType="order" recordId={order.id} staff={staffOptions} assignment={assignment} />
          <form action={action} className="flex w-full flex-col gap-3">
          <input type="hidden" name="id" value={order.id} />
          <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
            Status
            <select
              name="status"
              defaultValue={order.status}
              className="rounded-md border border-border bg-background px-2 py-2 text-sm capitalize text-foreground"
            >
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {s.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
            Internal notes
            <textarea
              name="internalNotes"
              rows={4}
              defaultValue={order.internalNotes ?? ""}
              placeholder="Confirmed VIN, payment taken, tracking #…"
              className="resize-y rounded-md border border-border bg-background px-2 py-2 text-sm text-foreground"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
            Customer-visible update
            <textarea
              name="customerMessage"
              rows={2}
              maxLength={1000}
              defaultValue={order.customerStatusNote ?? ""}
              placeholder="Tracking #1Z… via R+L Carriers. Shown on the customer portal immediately."
              className="resize-y rounded-md border border-border bg-background px-2 py-2 text-sm text-foreground"
            />
          </label>
          <label className="flex items-start gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              name="emailCustomer"
              defaultChecked={Boolean(order.customerEmail)}
              disabled={!order.customerEmail}
              className="mt-0.5 h-3.5 w-3.5 accent-primary"
            />
            <span>
              {order.customerEmail
                ? `Email ${order.customerEmail}. Status changes are emailed automatically and always appear in the customer portal.`
                : "No email on this order — status still appears in the customer portal if they have an account."}
            </span>
          </label>
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
