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
const money = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export function OrderCard({ order, statuses, staffOptions, assignment }: { order: CustomerOrder; statuses: readonly string[]; staffOptions: FollowupStaffOption[]; assignment: FollowupAssignment | null }) {
  const [state, action, pending] = useActionState(saveOrderFollowup, initial)

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

          <ul className="mt-3 divide-y divide-border rounded-md border border-border">
            {order.items.map((line) => (
              <li key={line.productId} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                <Link href={line.url} target="_blank" className="min-w-0 truncate text-foreground hover:text-primary">
                  {line.name}
                </Link>
                <span className="shrink-0 text-right text-muted-foreground">
                  <span className="block">{line.quantity} × {money(line.unitPrice)}</span>
                  <span className="block text-xs">Line total: {money(line.lineTotal)}</span>
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-muted-foreground">
            Subtotal {money(order.subtotal)} · Tax {money(order.tax)} · Shipping {money(order.shippingCost)}
          </p>
          {order.customerNotes && (
            <p className="mt-3 whitespace-pre-wrap rounded-md bg-muted/50 p-3 text-sm text-foreground">
              <span className="font-medium">Customer note: </span>
              {order.customerNotes}
            </p>
          )}
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
            Follow-up notes
            <textarea
              name="internalNotes"
              rows={4}
              defaultValue={order.internalNotes ?? ""}
              placeholder="Confirmed VIN, payment taken, tracking #…"
              className="resize-y rounded-md border border-border bg-background px-2 py-2 text-sm text-foreground"
            />
          </label>
          <details className="rounded-md border border-border px-3 py-2 text-xs text-muted-foreground">
            <summary className="cursor-pointer font-medium text-foreground">Email the customer</summary>
            <label className="mt-2 flex items-start gap-2">
              <input
                type="checkbox"
                name="emailCustomer"
                disabled={!order.customerEmail}
                className="mt-0.5 h-3.5 w-3.5 accent-primary"
              />
              <span>
                {order.customerEmail
                  ? `Send ${order.customerEmail} an update for the status above when I save`
                  : "No email on this order"}
              </span>
            </label>
            <label className="mt-2 flex flex-col gap-1">
              Message (optional — e.g. tracking number)
              <textarea
                name="customerMessage"
                rows={2}
                maxLength={1000}
                placeholder="Tracking #1Z… via R+L Carriers"
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
