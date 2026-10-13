"use server"

import { revalidatePath } from "next/cache"
import { getAdminSession } from "@/lib/admin-auth"
import {
  ORDER_STATUSES,
  QUOTE_STATUSES,
  getOrderById,
  getQuoteLeadById,
  updateOrder,
  updateQuoteLead,
  type OrderStatus,
  type QuoteStatus,
} from "@/lib/followup"
import { sendOrderStatusEmail, sendQuoteEmail, notifyFollowupAssignment } from "@/lib/followup-notify"
import { SITE_URL } from "@/lib/merchant"
import { getFollowupAssignments, setFollowupAssignment, type FollowupRecordType } from "@/lib/followup-assignments"

export interface FollowupActionState {
  ok: boolean
  message: string
}

const notes = (v: FormDataEntryValue | null) => String(v ?? "").trim().slice(0, 4000)

export async function saveFollowupAssignment(
  _prev: FollowupActionState,
  formData: FormData,
): Promise<FollowupActionState> {
  const session = await getAdminSession()
  if (!session) return { ok: false, message: "Session expired. Please sign in again." }

  const recordType = String(formData.get("recordType") ?? "")
  const recordId = String(formData.get("recordId") ?? "").trim()
  const staffId = String(formData.get("staffId") ?? "").trim()

  if (recordType !== "order" && recordType !== "quote") return { ok: false, message: "Invalid follow-up type." }
  if (!recordId || recordId.length > 64 || (recordType === "quote" && (!Number.isSafeInteger(Number(recordId)) || Number(recordId) < 1))) {
    return { ok: false, message: "Invalid customer record reference." }
  }
  if (recordType === "order" && !/^[A-Za-z0-9_-]+$/.test(recordId)) {
    return { ok: false, message: "Invalid order reference." }
  }

  try {
    let reference: string
    let summary: string
    if (recordType === "order") {
      const order = await getOrderById(recordId)
      if (!order) return { ok: false, message: "The customer order no longer exists." }
      reference = order.orderNumber
      summary = order.items.map((item) => item.name).join(", ") || "Customer order"
    } else {
      const lead = await getQuoteLeadById(Number(recordId))
      if (!lead) return { ok: false, message: "The customer quote request no longer exists." }
      reference = `Quote #${lead.id}`
      summary = [lead.year, lead.make, lead.model, lead.partType].filter(Boolean).join(" ")
    }

    const before = (await getFollowupAssignments(recordType as FollowupRecordType, [recordId])).get(recordId) ?? null
    const saved = await setFollowupAssignment(recordType as FollowupRecordType, recordId, staffId, session.email)
    revalidatePath("/admin/sales")
    revalidatePath("/admin/orders")
    revalidatePath("/admin/quotes")

    if (!saved) return { ok: true, message: "Assignment cleared." }
    if (before?.staffId === saved.staffId) return { ok: true, message: `Still assigned to ${saved.staffName}.` }

    const email = await notifyFollowupAssignment({
      email: saved.staffEmail ?? "",
      name: saved.staffName ?? "team member",
      recordType: recordType as FollowupRecordType,
      reference,
      summary,
      siteUrl: SITE_URL,
    }).catch(() => ({ ok: false, error: "Could not send assignment notification." }))
    return email.ok
      ? { ok: true, message: `Assigned to ${saved.staffName}. Email notification accepted by the email service.` }
      : { ok: true, message: `Assigned to ${saved.staffName}, but the email was not sent. Check Settings → System Health and Resend sender configuration.` }
  } catch (error) {
    const message = error instanceof Error && error.message.includes("Choose an active")
      ? error.message
      : "Assignment could not be saved. Check Settings → System Health and try again."
    return { ok: false, message }
  }
}

export async function saveQuoteFollowup(
  _prev: FollowupActionState,
  formData: FormData,
): Promise<FollowupActionState> {
  if (!(await getAdminSession())) return { ok: false, message: "Session expired. Please log in again." }

  const id = Number(formData.get("id"))
  const status = String(formData.get("status")) as QuoteStatus
  const rawAmount = String(formData.get("quoteAmount") ?? "").trim()
  const quoteAmount = rawAmount === "" ? null : Number(rawAmount)
  const emailQuote = formData.get("emailQuote") === "on"

  if (!Number.isInteger(id) || id < 1) return { ok: false, message: "Invalid quote." }
  if (!QUOTE_STATUSES.includes(status)) return { ok: false, message: "Invalid status." }
  if (quoteAmount !== null && (!Number.isFinite(quoteAmount) || quoteAmount < 0 || quoteAmount > 1_000_000)) {
    return { ok: false, message: "Quote amount must be a positive number." }
  }
  if (emailQuote && !(quoteAmount && quoteAmount > 0)) {
    return { ok: false, message: "Enter the quoted price before emailing the quote." }
  }

  await updateQuoteLead(id, { status, internalNotes: notes(formData.get("internalNotes")), quoteAmount })
  revalidatePath("/admin/quotes")
  revalidatePath("/admin/dashboard")

  if (!emailQuote) return { ok: true, message: "Saved" }
  const lead = await getQuoteLeadById(id)
  if (!lead) return { ok: false, message: "Saved, but the quote request could not be reloaded to email it." }
  const sent = await sendQuoteEmail(lead, quoteAmount!, notes(formData.get("customerMessage")).slice(0, 1000), SITE_URL)
  return sent.ok
    ? { ok: true, message: `Saved · quote emailed to ${lead.email}` }
    : { ok: false, message: `Saved, but the email was not sent: ${sent.error}` }
}

export async function saveOrderFollowup(
  _prev: FollowupActionState,
  formData: FormData,
): Promise<FollowupActionState> {
  if (!(await getAdminSession())) return { ok: false, message: "Session expired. Please log in again." }

  const id = String(formData.get("id") ?? "")
  const status = String(formData.get("status")) as OrderStatus
  const emailCustomer = formData.get("emailCustomer") === "on"
  // Ids are UUIDs for new orders, but older orders may use other formats; the
  // value only ever reaches a parameterized query.
  if (!/^[\w-]{1,64}$/.test(id)) return { ok: false, message: "Invalid order." }
  if (!ORDER_STATUSES.includes(status)) return { ok: false, message: "Invalid status." }

  await updateOrder(id, { status, internalNotes: notes(formData.get("internalNotes")) })
  revalidatePath("/admin/orders")
  revalidatePath("/admin/dashboard")

  if (!emailCustomer) return { ok: true, message: "Saved" }
  const order = await getOrderById(id)
  if (!order) return { ok: false, message: "Saved, but the order could not be reloaded to email the customer." }
  const sent = await sendOrderStatusEmail(order, notes(formData.get("customerMessage")).slice(0, 1000), SITE_URL)
  return sent.ok
    ? { ok: true, message: `Saved · customer emailed at ${order.customerEmail}` }
    : { ok: false, message: `Saved, but the email was not sent: ${sent.error}` }
}
