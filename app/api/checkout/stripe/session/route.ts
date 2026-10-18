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

const CheckoutDetailsSchema = z.object({
  addressType: z.enum(["commercial", "residential"]),
  liftgateRequired: z.boolean(),
  billingSameAsShipping: z.boolean(),
  billingAddress: z.object({
    name: z.string().trim().max(120).optional().default(""),
    address: z.string().trim().max(200).optional().default(""),
    city: z.string().trim().max(80).optional().default(""),
    state: z.string().trim().max(40).optional().default(""),
    zipCode: z.string().trim().max(20).optional().default(""),
    country: z.string().trim().max(60).optional().default("US"),
  }).optional(),
  termsAccepted: z.literal(true),
  shippingPolicyAccepted: z.literal(true),
  returnsPolicyAccepted: z.literal(true),
  approvedTotal: z.number().finite().nonnegative(),
}).superRefine((details, ctx) => {
  if (!details.billingSameAsShipping) {
    const billing = details.billingAddress
    for (const key of ["name", "address", "city", "state", "zipCode", "country"] as const) {
      if (!billing?.[key]?.trim()) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["billingAddress", key], message: "Please complete the separate billing address." })
    }
  }
})

const BodySchema = z.object({
  checkoutDetails: CheckoutDetailsSchema,
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
  const result = await createStripeCheckoutSession(customer, parsed.data.items, parsed.data.checkoutDetails, new URL(request.url).origin)
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 422 })
  }
  return NextResponse.json(result)
}
