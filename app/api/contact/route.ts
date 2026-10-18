import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { createQuoteLead } from "@/lib/followup"
import { notifyNewQuote, sendCustomerQuoteAcknowledgement } from "@/lib/followup-notify"

const ContactSchema = z.object({
  name: z.string().trim().min(1, "Please enter your name.").max(120),
  email: z.string().trim().email("Please enter a valid email.").max(200),
  subject: z.string().trim().min(1, "Please enter a subject.").max(150),
  message: z.string().trim().min(1, "Please enter a message.").max(2000),
  pageUrl: z.string().trim().max(500).optional().default(""),
  website: z.string().trim().max(200).optional().default(""),
})

export async function POST(request: Request) {
  let json: unknown
  try {
    json = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 })
  }

  const parsed = ContactSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request." }, { status: 400 })
  }
  const d = parsed.data

  // Honeypot: bots fill the hidden "website" field; pretend success.
  if (d.website) return NextResponse.json({ ok: true, id: 0 })

  try {
    let userId: string | undefined
    try {
      userId = (await auth.api.getSession({ headers: request.headers }))?.user?.id
    } catch {
      // Preserve guest submission if session lookup is temporarily unavailable.
    }
    const lead = await createQuoteLead({
      userId,
      fullName: d.name,
      phone: "",
      email: d.email,
      partType: "Contact message",
      make: "General inquiry",
      notes: `Subject: ${d.subject}\n\n${d.message}`,
      source: "contact-form",
      pageUrl: d.pageUrl,
    })
    const origin = new URL(request.url).origin
    const [teamNotice, customerNotice] = await Promise.all([
      notifyNewQuote(lead, origin).catch(() => ({ ok: false })),
      sendCustomerQuoteAcknowledgement(lead, origin).catch(() => ({ ok: false })),
    ])
    return NextResponse.json({
      ok: true,
      id: lead.id,
      emailStatus: {
        teamNotificationAccepted: teamNotice.ok,
        customerConfirmationAccepted: customerNotice.ok,
      },
    })
  } catch (err) {
    console.error("[contact] Failed to save message:", err instanceof Error ? err.message : err)
    return NextResponse.json(
      { error: "We couldn't send your message. Please call us at 1-888-887-4199." },
      { status: 500 },
    )
  }
}
