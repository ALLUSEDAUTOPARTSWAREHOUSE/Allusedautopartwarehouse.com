import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { createQuoteLead } from "@/lib/followup"
import { notifyNewQuote, sendCustomerQuoteAcknowledgement } from "@/lib/followup-notify"

const text = (max: number) => z.string().trim().max(max).optional().default("")
const isSafeInternalPath = (value: string) => {
  if (!value) return true
  if (!value.startsWith("/") || value.startsWith("//") || value.includes(String.fromCharCode(92)) || value.includes("://")) return false
  return !value.split(/[?#]/, 1)[0].split("/").some((part) => part === "." || part === "..")
}

const QuoteSchema = z.object({
  part: text(60),
  make: z.string().trim().min(1, "Please select a vehicle make.").max(60),
  model: text(80),
  year: text(10),
  option: text(80),
  name: z.string().trim().min(1, "Please enter your name.").max(120),
  phone: z
    .string()
    .trim()
    .max(30)
    .refine((v) => v.replace(/\D/g, "").length >= 10, "Please enter a valid phone number."),
  email: z.union([z.literal(""), z.string().trim().email("Please enter a valid email.").max(200)]).optional().default(""),
  state: text(40),
  zip: text(10),
  message: text(2000),
  source: text(60),
  pageUrl: text(500),
  productName: text(150),
  productUrl: text(500).refine(isSafeInternalPath, "Invalid product reference."),
  website: text(200),
})

export async function POST(request: Request) {
  let json: unknown
  try {
    json = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 })
  }

  const parsed = QuoteSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request." }, { status: 400 })
  }
  const d = parsed.data

  // Honeypot: bots fill the hidden "website" field; pretend success.
  if (d.website) return NextResponse.json({ ok: true, id: 0 })

  try {
    // Associate with the actual Better Auth session when signed in; never trust a user ID from the form.
    let userId: string | undefined
    try {
      userId = (await auth.api.getSession({ headers: request.headers }))?.user?.id
    } catch {
      // Preserve guest quote submission if session lookup is temporarily unavailable.
    }
    const lead = await createQuoteLead({
      userId,
      fullName: d.name,
      phone: d.phone,
      email: d.email,
      partType: d.part || "Auto Part",
      make: d.make,
      model: d.model,
      year: d.year,
      partOption: d.option,
      state: d.state,
      zip: d.zip,
      notes: d.message,
      source: d.source || "website",
      pageUrl: d.pageUrl,
      productName: d.productName,
      productUrl: d.productUrl,
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
    console.error("[quote] Failed to save quote:", err instanceof Error ? err.message : err)
    return NextResponse.json(
      { error: "We couldn't submit your request. Please call us at (708) 896-2383." },
      { status: 500 },
    )
  }
}
