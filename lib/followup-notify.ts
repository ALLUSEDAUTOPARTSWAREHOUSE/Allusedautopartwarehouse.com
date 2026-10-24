import "server-only"

import { createElement, type ReactElement } from "react"
import InvoiceEmail from "@/emails/invoice"
import OrderStatusEmail from "@/emails/order-status"
import QuoteOfferEmail from "@/emails/quote-offer"
import QuoteReceivedEmail from "@/emails/quote-received"
import StaffAlertEmail from "@/emails/staff-alert"
import { formatMoney } from "@/emails/brand"
import type { CustomerOrder, QuoteLead } from "@/lib/followup"
import type { DashboardMetrics } from "@/lib/admin-metrics"
import type { FeedAlert, FeedSnapshot } from "@/lib/merchant-health"
import { PHONE_DISPLAY, SHIPPING, WARRANTY_SUMMARY } from "@/lib/site-policy"
import { pool } from "@/lib/db"
import {
  absoluteUrl,
  buildInvoiceEmailModel,
  invoiceUrl,
  type InvoiceEmailKind,
} from "@/lib/invoice"
import { sendReactEmail, type MailResult } from "@/lib/mailer"

const STAFF_EMAIL = process.env.FOLLOWUP_EMAIL || "support@auapw.com"

export interface SendResult {
  ok: boolean
  /** Why the email wasn't sent, in words the admin can act on. */
  error?: string
  sentCount?: number
  recipientCount?: number
}

/**
 * New product enquiries should reach the active sales and support roster.
 * The configured FOLLOWUP_EMAIL remains the safe fallback if no eligible
 * staff are registered or the staff directory cannot be queried.
 */
async function operationsRecipients(): Promise<string[]> {
  try {
    const { rows } = await pool.query(
      `SELECT email FROM public.staff_members
        WHERE status = 'active' AND role IN ('sales_agent', 'support_team')
        ORDER BY name ASC LIMIT 30`,
    )
    const activeStaffEmails = rows
      .map((row: { email: string }) => String(row.email).trim().toLowerCase())
      .filter((email: string) => email.includes("@") && !email.startsWith("@") && !email.endsWith("@") && !email.includes(" "))
    return [...new Set([STAFF_EMAIL.toLowerCase(), ...activeStaffEmails])].slice(0, 31)
  } catch {
    console.error("[followup] Could not read team notification recipients; using FOLLOWUP_EMAIL fallback.")
    return [STAFF_EMAIL]
  }
}

async function sendToOperations(
  subject: string,
  react: ReactElement,
  replyTo?: string,
  idempotencyKey?: string,
): Promise<SendResult> {
  const recipients = await operationsRecipients()
  const results = await Promise.all(
    recipients.map((recipient) =>
      sendWithResult(subject, react, [recipient], replyTo, idempotencyKey ? `${idempotencyKey}/${recipient}` : undefined),
    ),
  )
  const sentCount = results.filter((result) => result.ok).length
  const ok = sentCount === recipients.length
  return {
    ok,
    sentCount,
    recipientCount: recipients.length,
    ...(ok
      ? {}
      : {
          error:
            sentCount === 0
              ? "No team notification emails were accepted. Check RESEND_API_KEY and the verified EMAIL_FROM/RESEND_EMAIL_DOMAIN sender."
              : `Only ${sentCount} of ${recipients.length} team notification emails were accepted. Check Resend delivery for the failures.`,
        }),
  }
}

async function sendWithResult(
  subject: string,
  react: ReactElement,
  to: string[] = [STAFF_EMAIL],
  replyTo?: string,
  idempotencyKey?: string,
): Promise<SendResult> {
  const result: MailResult = await sendReactEmail({
    to,
    subject,
    react,
    replyTo,
    idempotencyKey,
  })
  return result
}

async function send(subject: string, react: ReactElement, to: string[] = [STAFF_EMAIL], replyTo?: string): Promise<boolean> {
  return (await sendWithResult(subject, react, to, replyTo)).ok
}

/** True when emails can go to customers: Resend's shared test sender only delivers to the account owner. */
export function customerEmailReady(): { ok: boolean; reason?: string } {
  if (!process.env.RESEND_API_KEY) return { ok: false, reason: "RESEND_API_KEY is not set" }
  if (!process.env.EMAIL_FROM && !process.env.RESEND_EMAIL_DOMAIN) {
    return {
      ok: false,
      reason: "No verified sending domain (EMAIL_FROM or RESEND_EMAIL_DOMAIN); Resend only delivers test mail to your own address",
    }
  }
  return { ok: true }
}

function vehicleLabel(lead: QuoteLead) {
  return [lead.year, lead.make, lead.model].filter(Boolean).join(" ")
}

function quoteProductUrl(lead: QuoteLead, siteUrl: string) {
  if (!lead.productUrl) return undefined
  if (lead.productUrl.startsWith("/") && !lead.productUrl.startsWith("//")) return siteUrl + lead.productUrl
  return undefined
}

export async function notifyNewChat(
  chat: { conversationId: string; name?: string | null; email?: string | null; pageUrl?: string | null; body: string },
  siteUrl: string,
) {
  return sendToOperations(
    `New live chat${chat.name ? ` from ${chat.name}` : ""}`,
    createElement(StaffAlertEmail, {
      title: "New live chat",
      preview: `New live chat${chat.name ? ` from ${chat.name}` : ""}`,
      rows: [
        { label: "Name", value: chat.name || "—" },
        { label: "Email", value: chat.email || "—" },
        { label: "Page", value: chat.pageUrl || "—" },
        { label: "Message", value: chat.body },
      ],
      ctaUrl: `${siteUrl}/admin/chats?c=${encodeURIComponent(chat.conversationId)}`,
      siteUrl,
    }),
    chat.email || undefined,
    `staff-chat/${chat.conversationId}`,
  )
}

export async function notifyNewQuote(lead: QuoteLead, siteUrl: string) {
  const vehicle = vehicleLabel(lead)
  return sendToOperations(
    `New quote #${lead.id}: ${vehicle || lead.make} ${lead.partType}`.trim(),
    createElement(StaffAlertEmail, {
      title: "New quote request",
      preview: `New quote #${lead.id}: ${vehicle || lead.partType}`,
      rows: [
        { label: "Quote #", value: String(lead.id) },
        { label: "Product", value: lead.productName || "—" },
        { label: "Product page", value: lead.productUrl || "—" },
        { label: "Part", value: lead.partType },
        { label: "Vehicle", value: vehicle || "—" },
        { label: "Option", value: lead.partOption || "—" },
        { label: "Name", value: lead.fullName },
        { label: "Phone", value: lead.phone },
        { label: "Email", value: lead.email || "—" },
        { label: "State / ZIP", value: [lead.state, lead.zip].filter(Boolean).join(" ") || "—" },
        { label: "Notes", value: lead.notes || "—" },
        { label: "Source", value: lead.source || "—" },
      ],
      ctaUrl: `${siteUrl}/admin/quotes`,
      siteUrl,
    }),
    lead.email || undefined,
    `staff-quote/${lead.id}`,
  )
}

export async function notifyNewOrder(order: CustomerOrder, siteUrl: string) {
  const items = order.items.map((line) => {
    const href = line.url ? absoluteUrl(line.url, siteUrl) : ""
    return `${line.name} × ${line.quantity} — ${formatMoney(line.lineTotal)}${href ? ` (${href})` : ""}`
  })
  return sendToOperations(
    `New order ${order.orderNumber} — ${formatMoney(order.totalAmount)}`,
    createElement(StaffAlertEmail, {
      title: "New order — call to confirm and take payment",
      preview: `New order ${order.orderNumber} — ${formatMoney(order.totalAmount)}`,
      rows: [
        { label: "Order #", value: order.orderNumber },
        { label: "Name", value: order.customerName || "—" },
        { label: "Phone", value: order.customerPhone || "—" },
        { label: "Email", value: order.customerEmail || "—" },
        { label: "Ship to", value: order.shippingAddress || "—" },
        { label: "Notes", value: order.customerNotes || "—" },
        { label: "Payment", value: order.paymentGateway ?? "phone" },
        { label: "Status", value: order.status },
        { label: "Total", value: formatMoney(order.totalAmount) },
        { label: "Invoice", value: invoiceUrl(order, siteUrl) },
      ],
      items,
      ctaUrl: `${siteUrl}/admin/orders`,
      siteUrl,
    }),
    order.customerEmail || undefined,
    `staff-order/${order.orderNumber}`,
  )
}

function invoiceKindFor(order: CustomerOrder): InvoiceEmailKind {
  if (order.status === "paid") return "paid"
  if (order.status === "reserved_pending_fitment") return "reserved"
  return "awaiting_payment"
}

/** Asks the customer to verify their email before the order is treated as confirmed. */
export async function sendCustomerOrderVerification(order: CustomerOrder, siteUrl: string) {
  if (!order.customerEmail) return { ok: false, error: "No customer email address was provided." }
  if (!order.emailVerifyToken) return { ok: false, error: "This order has no email verification token." }
  const { subject, props } = buildInvoiceEmailModel(order, siteUrl, "verify")
  return sendWithResult(
    subject,
    createElement(InvoiceEmail, props),
    [order.customerEmail],
    undefined,
    `order-verify/${order.orderNumber}`,
  )
}

/**
 * Emails the customer a branded invoice with product-page links and brand
 * images. Unpaid orders say they will be processed after payment confirmation.
 */
export async function sendCustomerOrderInvoice(order: CustomerOrder, siteUrl: string) {
  if (!order.customerEmail) return { ok: false, error: "No customer email address was provided." }
  const { subject, props } = buildInvoiceEmailModel(order, siteUrl, invoiceKindFor(order))
  return sendWithResult(subject, createElement(InvoiceEmail, props), [order.customerEmail])
}

/** Send a receipt-style acknowledgement after a quote request is saved. */
export async function sendCustomerQuoteAcknowledgement(lead: QuoteLead, siteUrl: string): Promise<SendResult> {
  if (!lead.email) return { ok: false, error: "The customer did not provide an email address." }
  return sendWithResult(
    `We received your AUAPW quote request #${lead.id}`,
    createElement(QuoteReceivedEmail, {
      customerName: lead.fullName,
      quoteId: lead.id,
      partType: lead.partType,
      vehicle: vehicleLabel(lead),
      option: lead.partOption,
      submittedAt: lead.createdAt,
      productName: lead.productName,
      productUrl: quoteProductUrl(lead, siteUrl),
      siteUrl,
    }),
    [lead.email],
    undefined,
    `quote-ack/${lead.id}`,
  )
}

/** Notify a staff member when a saved order or quote is assigned to them. */
export async function notifyFollowupAssignment(input: {
  email: string
  name: string
  recordType: "order" | "quote"
  reference: string
  summary: string
  siteUrl: string
}): Promise<SendResult> {
  const noun = input.recordType === "order" ? "order" : "quote request"
  const path = input.recordType === "order" ? "/admin/orders" : "/admin/quotes"
  return sendWithResult(
    `AUAPW follow-up assigned — ${noun} ${input.reference}`,
    createElement(StaffAlertEmail, {
      title: `Follow-up assigned: ${noun} ${input.reference}`,
      preview: `A customer ${noun} has been assigned to you`,
      greeting: `Hello ${input.name},`,
      intro: `A customer ${noun} has been assigned to you. Please review the record and update its status/notes in the admin.`,
      rows: [
        { label: "Reference", value: input.reference },
        { label: "Details", value: input.summary },
      ],
      ctaUrl: `${input.siteUrl}${path}`,
      siteUrl: input.siteUrl,
    }),
    [input.email],
  )
}

/**
 * Morning report for the owner, sent by the daily cron: yesterday's quotes,
 * orders and paid revenue, what is waiting on a call-back, and the Google
 * Shopping feed's health with any alerts.
 */
export async function sendDailyReport(
  metrics: DashboardMetrics,
  feed: { snapshot: FeedSnapshot; previous: FeedSnapshot | null; lastGoogleFetch: string | null },
  siteUrl: string,
): Promise<boolean> {
  const y = metrics.yesterday
  const a = metrics.actions
  const { snapshot, previous } = feed
  const delta = previous ? snapshot.eligible - previous.eligible : null
  const alerts: FeedAlert[] = [...snapshot.alerts]
  if (a.staleNewQuotes > 0) {
    alerts.push({
      level: "warning",
      message: `${a.staleNewQuotes} quote request${a.staleNewQuotes === 1 ? " has" : "s have"} waited over 24 hours without a call-back.`,
    })
  }
  for (const e of metrics.errors) {
    alerts.push({ level: "critical", message: `The dashboard couldn't read ${e.section.toLowerCase()}: ${e.message}` })
  }
  if (a.stalePendingOrders > 0) {
    alerts.push({
      level: "warning",
      message: `${a.stalePendingOrders} order${a.stalePendingOrders === 1 ? " is" : "s are"} still pending after 24 hours.`,
    })
  }

  const headline = `${y.quotes} quote${y.quotes === 1 ? "" : "s"}, ${y.orders} order${y.orders === 1 ? "" : "s"}, ${formatMoney(y.revenue)} paid`
  return send(
    `${alerts.length ? `${alerts.length} alert${alerts.length === 1 ? "" : "s"} · ` : ""}AUAPW daily report — ${headline}`,
    createElement(StaffAlertEmail, {
      title: `Daily report · ${snapshot.day}`,
      preview: headline,
      intro: alerts.length === 0 ? "Nothing needs attention — all checks passed." : undefined,
      sections: [
        {
          heading: "Yesterday",
          rows: [
            { label: "Quote requests", value: String(y.quotes) },
            { label: "Orders placed", value: String(y.orders) },
            { label: "Paid revenue", value: formatMoney(y.revenue) },
          ],
        },
        {
          heading: "Waiting on you",
          rows: [
            { label: "New quotes", value: String(a.newQuotes) },
            { label: "Pending orders", value: String(a.pendingOrders) },
            { label: "Reserved (fitment)", value: String(a.reservedOrders) },
            { label: "Confirmed, unpaid", value: String(a.unpaidConfirmedOrders) },
          ],
        },
        {
          heading: "Google Shopping",
          rows: [
            {
              label: "Products in feed",
              value: `${snapshot.eligible.toLocaleString("en-US")} of ${snapshot.total.toLocaleString("en-US")}${
                delta === null || delta === 0 ? "" : ` (${delta > 0 ? "+" : ""}${delta.toLocaleString("en-US")})`
              }`,
            },
            {
              label: "Google last fetched",
              value: feed.lastGoogleFetch
                ? new Date(feed.lastGoogleFetch).toLocaleString("en-US", {
                    dateStyle: "medium",
                    timeStyle: "short",
                    timeZone: metrics.timeZone,
                  })
                : "Never",
            },
          ],
        },
      ],
      alerts: alerts.map((alert) => ({
        level: (alert.level === "critical" ? "critical" : "warning") as "warning" | "critical",
        message: alert.message,
      })),
      ctaUrl: `${siteUrl}/admin/dashboard`,
      siteUrl,
    }),
  )
}

const ORDER_STATUS_COPY: Record<string, { subject: string; title: string; text: string }> = {
  pending: {
    subject: "We received your order",
    title: "Order Received",
    text: "We have your order and a parts specialist will call you shortly to confirm fitment.",
  },
  reserved_pending_fitment: {
    subject: "Your part is reserved",
    title: "Part Reserved",
    text: "Your part is on hold for you while we confirm fitment for your vehicle.",
  },
  confirmed: {
    subject: "Your order is confirmed",
    title: "Order Confirmed",
    text: "We confirmed fitment for your vehicle. We'll take payment as agreed and get your part ready to ship.",
  },
  paid: {
    subject: "Payment received",
    title: "Payment Received",
    text: `Thank you — your payment is in. ${SHIPPING.dispatch}.`,
  },
  shipped: {
    subject: "Your part has shipped",
    title: "Your Part Has Shipped",
    text: `Your part is on its way: ${SHIPPING.transit}. ${SHIPPING.damage}`,
  },
  delivered: {
    subject: "Your part was delivered",
    title: "Delivered",
    text: `Your part shows as delivered. It's covered by our ${WARRANTY_SUMMARY.toLowerCase()} — keep this email for your records.`,
  },
  cancelled: {
    subject: "Your order was cancelled",
    title: "Order Cancelled",
    text: "Your order has been cancelled. If you were charged, the refund goes back to your original payment method.",
  },
}

/** Status update to the customer, sent from the admin Orders page when "Email the customer" is ticked. */
export async function sendOrderStatusEmail(order: CustomerOrder, note: string, siteUrl: string): Promise<SendResult> {
  if (!order.customerEmail) return { ok: false, error: "this order has no customer email" }
  const copy = ORDER_STATUS_COPY[order.status] ?? {
    subject: "Update on your order",
    title: "Order Update",
    text: `Your order status is now: ${order.status.replace(/_/g, " ")}.`,
  }
  return sendWithResult(
    `${copy.subject} — ${order.orderNumber}`,
    createElement(OrderStatusEmail, {
      customerName: order.customerName || "there",
      title: copy.title,
      preview: `${copy.subject} — ${order.orderNumber}`,
      body: copy.text,
      orderNumber: order.orderNumber,
      totalAmount: order.totalAmount,
      items: order.items.map((line) => `${line.name} × ${line.quantity}`),
      note: note || undefined,
      siteUrl,
    }),
    [order.customerEmail],
    STAFF_EMAIL,
  )
}

/** Written quote to the customer, sent from the admin Quotes page when "Email the quote" is ticked. */
export async function sendQuoteEmail(lead: QuoteLead, amount: number, note: string, siteUrl: string): Promise<SendResult> {
  if (!lead.email) return { ok: false, error: "this quote request has no email address" }
  const vehicle = vehicleLabel(lead)
  const part = `${vehicle ? `${vehicle} ` : ""}${lead.partType}`.trim()
  return sendWithResult(
    `Your quote: ${part} — ${formatMoney(amount)}`,
    createElement(QuoteOfferEmail, {
      customerName: lead.fullName,
      part,
      option: lead.partOption,
      amount,
      shipping: SHIPPING.short,
      warranty: WARRANTY_SUMMARY,
      note: note || undefined,
      siteUrl,
    }),
    [lead.email],
    STAFF_EMAIL,
  )
}
