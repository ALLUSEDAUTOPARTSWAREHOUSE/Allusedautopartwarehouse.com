import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { createStripeCheckoutSession } from "@/lib/stripe-checkout"

const CustomerSchema = z.object({
  firstName: z.string().trim().min(1).max(60),
  lastName: z.string().trim().min(1).max(60),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().max(30),
  address: z.string().trim().min(1).max(200),
  city: z.string().trim().min(1).max(80),
  state: z.string().trim().min(1).max(40),
  zipCode: z.string().trim().min(1).max(10),
  notes: z.string().trim().max(1000).optional(),
})

const BodySchema = z.object({
  customer: CustomerSchema,
  items: z
    .array(
      z.object({
        id: z.string().min(1).max(300),
        make: z.string().max(60).optional(),
        price: z.number().finite(),
        quantity: z.number(),
      }),
    )
    .min(1),
})

export async function POST(request: Request) {
  let json: unknown
  try {
    json = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 })
  }

  const parsed = BodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request." }, { status: 400 })
  }

  let userId: string | undefined
  try {
    userId = (await auth.api.getSession({ headers: request.headers }))?.user?.id
  } catch {
    // A valid guest checkout can still proceed without a customer-account association.
  }
  const customer = { ...parsed.data.customer, userId }
  const result = await createStripeCheckoutSession(customer, parsed.data.items)
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 422 })
  }
  return NextResponse.json(result)
}
