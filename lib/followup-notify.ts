import "server-only"
import { Resend } from "resend"
import type { CustomerOrder, QuoteLead } from "@/lib/followup"
import type { DashboardMetrics } from "@/lib/admin-metrics"
import type { FeedAlert, FeedSnapshot } from "@/lib/merchant-health"
import { PHONE_DISPLAY, SHIPPING, WARRANTY_SUMMARY } from "@/lib/site-policy"
import { pool } from "@/lib/db"

const STAFF_EMAIL = process.env.FOLLOWUP_EMAIL || "auapworld@gmail.com"
const FROM =
  process.env.EMAIL_FROM ||
  (process.env.RESEND_EMAIL_DOMAIN
    ? `AUAPW Website <notifications@${process.env.RESEND_EMAIL_DOMAIN}>`
    : "AUAPW Website <onboarding@resend.dev>")

const escapeHtml = (s: unknown) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")

const money = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

function rows(pairs: [string, unknown][]) {
  return pairs
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 0;color:#6b7280;width:120px">${escapeHtml(k)}</td><td style="padding:6px 0;font-weight:bold">${escapeHtml(v || "—")}</td></tr>`,
    )
    .join("")
}

function shell(title: string, body: string, adminPath: string, siteUrl: string) {
  return `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
    <div style="background:#0f1117;color:#fff;padding:20px;border-radius:8px 8px 0 0">
      <h2 style="margin:0">${escapeHtml(title)}</h2>
    </div>
    <div style="border:1px solid #e5e7eb;border-top:none;padding:20px;border-radius:0 0 8px 8px">
      ${body}
      <p style="margin-top:20px"><a href="${escapeHtml(siteUrl + adminPath)}" style="background:#f59e0b;color:#0f1117;padding:10px 16px;border-radius:6px;text-decoration:none;font-weight:bold">Open in admin</a></p>
    </div>
  </div>`
}

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
    // Keep the configured operations inbox copied in while also notifying the roster.
    return [...new Set([STAFF_EMAIL.toLowerCase(), ...activeStaffEmails])].slice(0, 31)
  } catch {
    console.error("[followup] Could not read team notification recipients; using FOLLOWUP_EMAIL fallback.")
    return [STAFF_EMAIL]
  }
}

async function sendToOperations(subject: string, html: string, replyTo?: string): Promise<SendResult> {
  const recipients = await operationsRecipients()
  // Send individual messages so team addresses are not exposed to one another.
  const results = await Promise.all(recipients.map((recipient) => sendWithResult(subject, html, [recipient], replyTo)))
  const sentCount = results.filter((result) => result.ok).length
  const ok = sentCount === recipients.length
  return {
    ok,
    sentCount,
    recipientCount: recipients.length,
    ...(ok ? {} : { error: sentCount === 0
      ? "No team notification emails were accepted. Check RESEND_API_KEY and the verified EMAIL_FROM/RESEND_EMAIL_DOMAIN sender."
      : `Only ${sentCount} of ${recipients.length} team notification emails were accepted. Check Resend delivery for the failures.` }),
  }
}

async function sendWithResult(
  subject: string,
  html: string,
  to: string[] = [STAFF_EMAIL],
  replyTo?: string,
): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.error("[followup] RESEND_API_KEY missing; email not sent (record is saved in admin)")
    return { ok: false, error: "RESEND_API_KEY is not set in Vercel" }
  }
  try {
    const { error } = await new Resend(apiKey).emails.send({
      from: FROM,
      to,
      subject,
      html,
      ...(replyTo ? { replyTo } : {}),
    })
    if (error) {
      console.error("[followup] Resend error:", error.message)
      return { ok: false, error: error.message }
    }
    return { ok: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error("[followup] Email send failed:", message)
    return { ok: false, error: message }
  }
}

async function send(subject: string, html: string, to: string[] = [STAFF_EMAIL], replyTo?: string): Promise<boolean> {
  return (await sendWithResult(subject, html, to, replyTo)).ok
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

function customerShell(title: string, body: string) {
  return `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
    <div style="background:#0f1117;color:#fff;padding:20px;border-radius:8px 8px 0 0">
      <h2 style="margin:0">${escapeHtml(title)}</h2>
    </div>
    <div style="border:1px solid #e5e7eb;border-top:none;padding:20px;border-radius:0 0 8px 8px">
      ${body}
      <p style="margin-top:20px;color:#6b7280;font-size:13px">Questions? Call ${escapeHtml(PHONE_DISPLAY)} or reply to this email.</p>
    </div>
  </div>`
}

export async function notifyNewChat(
  chat: { conversationId: string; name?: string | null; email?: string | null; pageUrl?: string | null; body: string },
  siteUrl: string,
) {
  const body = `<table style="width:100%;border-collapse:collapse">${rows([
    ["Name", chat.name],
    ["Email", chat.email],
    ["Page", chat.pageUrl],
    ["Message", chat.body],
  ])}</table>`
  return sendToOperations(
    `New live chat${chat.name ? ` from ${chat.name}` : ""}`,
    shell("New Live Chat", body, `/admin/chats?c=${encodeURIComponent(chat.conversationId)}`, siteUrl),
    chat.email || undefined,
  )
}

export async function notifyNewQuote(lead: QuoteLead, siteUrl: string) {
  const vehicle = [lead.year, lead.make, lead.model].filter(Boolean).join(" ")
  const body = `<table style="width:100%;border-collapse:collapse">${rows([
    ["Quote #", lead.id],
    ["Product", lead.productName],
    ["Product page", lead.productUrl],
    ["Part", lead.partType],
    ["Vehicle", vehicle],
    ["Option", lead.partOption],
    ["Name", lead.fullName],
    ["Phone", lead.phone],
    ["Email", lead.email],
    ["State / ZIP", [lead.state, lead.zip].filter(Boolean).join(" ")],
    ["Notes", lead.notes],
    ["Source", lead.source],
  ])}</table>`
  return sendToOperations(
    `New quote #${lead.id}: ${vehicle || lead.make} ${lead.partType}`.trim(),
    shell("New Quote Request", body, "/admin/quotes", siteUrl),
    lead.email || undefined,
  )
}

export async function notifyNewOrder(order: CustomerOrder, siteUrl: string) {
  const items = order.items
    .map((l) => `<li>${escapeHtml(l.name)} × ${l.quantity} — ${money(l.lineTotal)}</li>`)
    .join("")
  const body = `<table style="width:100%;border-collapse:collapse">${rows([
    ["Order #", order.orderNumber],
    ["Name", order.customerName],
    ["Phone", order.customerPhone],
    ["Email", order.customerEmail],
    ["Ship to", order.shippingAddress],
    ["Notes", order.customerNotes],
    ["Payment", order.paymentGateway ?? "phone"],
    ["Status", order.status],
    ["Total", money(order.totalAmount)],
  ])}</table><h3>Items</h3><ul>${items}</ul>`
  return sendToOperations(
    `New order ${order.orderNumber} — ${money(order.totalAmount)}`,
    shell("New Order — call to confirm & take payment", body, "/admin/orders", siteUrl),
    order.customerEmail || undefined,
  )
}

/**
 * Emails the customer an invoice-style receipt for their own order. Sent
 * on every placed order (pending phone orders and Stripe-paid orders alike)
 * so the customer always has a record of exactly what they entered.
 */
export async function sendCustomerOrderInvoice(order: CustomerOrder, siteUrl: string) {
  if (!order.customerEmail) return { ok: false, error: "No customer email address was provided." }

  const items = order.items
    .map(
      (l) =>
        `<li>${escapeHtml(l.name)} × ${l.quantity} — ${money(l.lineTotal)}</li>`,
    )
    .join("")
  const paid = order.status === "paid"
  const reserved = order.status === "reserved_pending_fitment"
  const body = `
    <p>Thanks for your ${reserved ? "reservation" : "order"}, ${escapeHtml(order.customerName) || "there"}! Here is your receipt.</p>
    <table style="width:100%;border-collapse:collapse">${rows([
      ["Order #", order.orderNumber],
      ["Date", new Date(order.createdAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })],
      ["Ship to", order.shippingAddress],
      ["Phone", order.customerPhone],
      ["Notes", order.customerNotes],
    ])}</table>
    <h3>Items</h3>
    <ul>${items}</ul>
    <table style="width:100%;border-collapse:collapse;margin-top:8px">${rows([
      ["Subtotal", money(order.subtotal)],
      ["Tax", money(order.tax)],
      ["Shipping", money(order.shippingCost)],
      ["Total", money(order.totalAmount)],
    ])}</table>
    <p style="margin-top:16px">
      ${
        paid
          ? `Your card has been charged and your order is confirmed.`
          : reserved
            ? `This part is reserved for you — no payment has been taken. A parts specialist will call you at ${escapeHtml(order.customerPhone)} within one business day to confirm fitment, give you the final price in writing, and take payment only once you approve it. Your warranty coverage is confirmed in writing at that time too.`
            : `No charge has been made yet — a parts specialist will call you at ${escapeHtml(order.customerPhone)} within one business day to confirm fitment and take payment securely by phone.`
      }
    </p>`

  return sendWithResult(
    `Your AUAPW ${reserved ? "reservation" : "order"} ${order.orderNumber}${paid ? " — paid" : reserved ? " — reserved" : " — received"}`,
    `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
      <div style="background:#0f1117;color:#fff;padding:20px;border-radius:8px 8px 0 0">
        <h2 style="margin:0">${paid ? "Payment Received" : reserved ? "Part Reserved" : "Order Received"}</h2>
      </div>
      <div style="border:1px solid #e5e7eb;border-top:none;padding:20px;border-radius:0 0 8px 8px">
        ${body}
      </div>
    </div>`,
    [order.customerEmail],
  )
}

/** Send a receipt-style acknowledgement after a quote request is saved. */
export async function sendCustomerQuoteAcknowledgement(lead: QuoteLead, siteUrl: string): Promise<SendResult> {
  if (!lead.email) return { ok: false, error: "The customer did not provide an email address." }
  const vehicle = [lead.year, lead.make, lead.model].filter(Boolean).join(" ")
  const body = `
    <p>Hello ${escapeHtml(lead.fullName)},</p>
    <p>We've received your quote request and saved it as reference <strong>#${lead.id}</strong>.</p>
    <table style="width:100%;border-collapse:collapse">${rows([
      ["Requested part", lead.partType],
      ["Vehicle", vehicle],
      ["Option", lead.partOption],
      ["Submitted", new Date(lead.createdAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })],
    ])}</table>
    ${lead.productName ? `<p>Product of interest: <strong>${escapeHtml(lead.productName)}</strong></p>` : ""}
    ${lead.productUrl && lead.productUrl.startsWith("/") && !lead.productUrl.startsWith("//")
      ? `<p><a href="${escapeHtml(siteUrl + lead.productUrl)}">View the exact product page</a></p>`
      : ""}
    <p>A parts specialist will review the request and contact you. This acknowledgement is not a price quote or fitment confirmation.</p>`
  return sendWithResult(
    `We received your AUAPW quote request #${lead.id}`,
    customerShell("Quote Request Received", body),
    [lead.email],
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
  const html = shell(
    `Follow-up assigned: ${noun} ${input.reference}`,
    `<p>Hello ${escapeHtml(input.name)},</p><p>A customer ${noun} has been assigned to you.</p><table style="width:100%;border-collapse:collapse">${rows([
      ["Reference", input.reference],
      ["Details", input.summary],
    ])}</table><p>Please review the record and update its status/notes in the admin.</p>`,
    path,
    input.siteUrl,
  )
  return sendWithResult(`AUAPW follow-up assigned — ${noun} ${input.reference}`, html, [input.email])
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

  const alertHtml = alerts.length
    ? `<h3 style="margin:20px 0 8px">Needs attention</h3><ul style="padding-left:18px;margin:0">${alerts
        .map(
          (al) =>
            `<li style="margin:4px 0;color:${al.level === "critical" ? "#b91c1c" : "#92400e"}">${escapeHtml(al.message)}</li>`,
        )
        .join("")}</ul>`
    : `<p style="margin-top:20px;color:#047857">Nothing needs attention — all checks passed.</p>`

  const body = `
    <h3 style="margin:0 0 8px">Yesterday</h3>
    <table style="width:100%;border-collapse:collapse">${rows([
      ["Quote requests", String(y.quotes)],
      ["Orders placed", String(y.orders)],
      ["Paid revenue", money(y.revenue)],
    ])}</table>
    <h3 style="margin:20px 0 8px">Waiting on you</h3>
    <table style="width:100%;border-collapse:collapse">${rows([
      ["New quotes", String(a.newQuotes)],
      ["Pending orders", String(a.pendingOrders)],
      ["Reserved (fitment)", String(a.reservedOrders)],
      ["Confirmed, unpaid", String(a.unpaidConfirmedOrders)],
    ])}</table>
    <h3 style="margin:20px 0 8px">Google Shopping</h3>
    <table style="width:100%;border-collapse:collapse">${rows([
      [
        "Products in feed",
        `${snapshot.eligible.toLocaleString("en-US")} of ${snapshot.total.toLocaleString("en-US")}${
          delta === null || delta === 0 ? "" : ` (${delta > 0 ? "+" : ""}${delta.toLocaleString("en-US")})`
        }`,
      ],
      [
        "Google last fetched",
        feed.lastGoogleFetch
          ? new Date(feed.lastGoogleFetch).toLocaleString("en-US", {
              dateStyle: "medium",
              timeStyle: "short",
              timeZone: metrics.timeZone,
            })
          : "Never",
      ],
    ])}</table>
    ${alertHtml}`

  const headline = `${y.quotes} quote${y.quotes === 1 ? "" : "s"}, ${y.orders} order${y.orders === 1 ? "" : "s"}, ${money(y.revenue)} paid`
  return send(
    `${alerts.length ? `⚠ ${alerts.length} alert${alerts.length === 1 ? "" : "s"} · ` : ""}AUAPW daily report — ${headline}`,
    shell(`Daily report · ${snapshot.day}`, body, "/admin/dashboard", siteUrl),
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
  const items = order.items
    .map((l) => `<li>${escapeHtml(l.name)} × ${l.quantity}</li>`)
    .join("")
  const body = `
    <p>Hi ${escapeHtml(order.customerName) || "there"},</p>
    <p>${escapeHtml(copy.text)}</p>
    ${note ? `<p style="background:#f3f4f6;padding:12px;border-radius:6px;white-space:pre-wrap">${escapeHtml(note)}</p>` : ""}
    <table style="width:100%;border-collapse:collapse">${rows([
      ["Order #", order.orderNumber],
      ["Total", money(order.totalAmount)],
    ])}</table>
    ${items ? `<h3>Items</h3><ul>${items}</ul>` : ""}
    <p><a href="${escapeHtml(siteUrl)}" style="color:#2563eb">${escapeHtml(siteUrl.replace(/^https?:\/\//, ""))}</a></p>`
  return sendWithResult(
    `${copy.subject} — ${order.orderNumber}`,
    customerShell(copy.title, body),
    [order.customerEmail],
    STAFF_EMAIL,
  )
}

/** Written quote to the customer, sent from the admin Quotes page when "Email the quote" is ticked. */
export async function sendQuoteEmail(lead: QuoteLead, amount: number, note: string, siteUrl: string): Promise<SendResult> {
  if (!lead.email) return { ok: false, error: "this quote request has no email address" }
  const vehicle = [lead.year, lead.make, lead.model].filter(Boolean).join(" ")
  const part = `${vehicle ? `${vehicle} ` : ""}${lead.partType}`.trim()
  const body = `
    <p>Hi ${escapeHtml(lead.fullName) || "there"},</p>
    <p>Thanks for your request. Here is your quote:</p>
    <table style="width:100%;border-collapse:collapse">${rows([
      ["Part", part],
      ["Option", lead.partOption],
      ["Price", money(amount)],
      ["Shipping", SHIPPING.short],
      ["Warranty", WARRANTY_SUMMARY],
    ])}</table>
    ${note ? `<p style="background:#f3f4f6;padding:12px;border-radius:6px;white-space:pre-wrap">${escapeHtml(note)}</p>` : ""}
    <p style="margin-top:16px">To order, call <strong>${escapeHtml(PHONE_DISPLAY)}</strong> or simply reply to this email and we'll confirm fitment with your VIN before anything ships.</p>
    <p><a href="${escapeHtml(siteUrl)}" style="color:#2563eb">${escapeHtml(siteUrl.replace(/^https?:\/\//, ""))}</a></p>`
  return sendWithResult(
    `Your quote: ${part} — ${money(amount)}`,
    customerShell("Your Parts Quote", body),
    [lead.email],
    STAFF_EMAIL,
  )
}
