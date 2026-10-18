import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { createOrder } from "@/lib/followup"
import { notifyNewOrder, sendCustomerOrderVerification } from "@/lib/followup-notify"
import { priceCart, priceReservationCart } from "@/lib/order-pricing"

const req = (label: string, max: number) => z.string().trim().min(1, `Please enter your ${label}.`).max(max)

const CustomerSchema = z.object({
  firstName: req("first name", 60),
  lastName: req("last name", 60),
  email: z.string().trim().email("Please enter a valid email.").max(200),
  phone: z
    .string()
    .trim()
    .max(30)
    .refine((v) => v.replace(/\D/g, "").length >= 10, "Please enter a valid phone number."),
  address: req("street address", 200),
  city: req("city", 80),
  state: req("state", 40),
  zipCode: z.string().trim().regex(/^\d{5}(-\d{4})?$/, "Please enter a valid ZIP code."),
  notes: z.string().trim().max(1000).optional().default(""),
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
const configuredFee = (name: string) => {
  const value = Number(process.env[name] ?? "0")
  return Number.isFinite(value) && value >= 0 ? Math.round(value * 100) / 100 : 0
}
const feeForCheckout = (details: z.infer<typeof CheckoutDetailsSchema>) =>
  (details.addressType === "residential" ? configuredFee("AUAPW_RESIDENTIAL_DELIVERY_FEE") : 0) +
  (details.liftgateRequired ? configuredFee("AUAPW_LIFTGATE_FEE") : 0)

const OrderSchema = z.object({
  checkoutDetails: CheckoutDetailsSchema,
  mode: z.literal("buy_now").optional().default("buy_now"),
  customer: CustomerSchema,
  // The method picked at checkout (wire, Zelle, phone…), so staff know how to collect.
  paymentGateway: z.string().trim().max(60).optional(),
  items: z
    .array(
      z.object({
        id: z.string().min(1).max(300),
        make: z.string().max(60).optional(),
        price: z.number().finite(),
        quantity: z.number(),
      }),
    )
    .min(1, "Your cart is empty."),
})

const ReservationOrderSchema = z.object({
  checkoutDetails: CheckoutDetailsSchema,
  mode: z.literal("reserve"),
  customer: CustomerSchema,
  deliveryMethod: z.enum(["standard", "liftgate"]),
  items: z
    .array(
      z.object({
        id: z.string().min(1).max(300),
        make: z.string().max(60).optional(),
        quantity: z.number(),
      }),
    )
    .min(1, "Your cart is empty."),
})

export async function POST(request: Request) {
  let json: unknown
  try {
    json = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 })
  }

  const isReserve = (json as { mode?: string } | null)?.mode === "reserve"
  // Link only an authenticated Better Auth session; otherwise preserve guest checkout semantics.
  let userId: string | undefined
  try {
    userId = (await auth.api.getSession({ headers: request.headers }))?.user?.id
  } catch {
    // Keep guest checkout available if auth-session lookup is temporarily unavailable.
  }

  if (isReserve) {
    const parsed = ReservationOrderSchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request." }, { status: 400 })
    }
    const { customer, items, deliveryMethod, checkoutDetails } = parsed.data
    const pricing = await priceReservationCart(items, deliveryMethod)
    if (!pricing.ok) return NextResponse.json({ error: pricing.error }, { status: 422 })
    const checkoutFees = feeForCheckout(checkoutDetails)
    const shippingCost = Math.round((pricing.shippingCost + checkoutFees) * 100) / 100
    const totalAmount = Math.round((pricing.subtotal + pricing.tax + shippingCost) * 100) / 100
    if (Math.abs(totalAmount - checkoutDetails.approvedTotal) > 0.02) {
      return NextResponse.json({ error: "The order total changed. Please review the updated total and approve it again." }, { status: 409 })
    }

    try {
      const order = await createOrder({
        userId,
        customerName: `${customer.firstName} ${customer.lastName}`,
        customerEmail: customer.email,
        customerPhone: customer.phone,
        shippingAddress: `${customer.address}, ${customer.city}, ${customer.state} ${customer.zipCode}`,
        customerNotes: customer.notes,
        items: pricing.lines,
        subtotal: pricing.subtotal,
        tax: pricing.tax,
        shippingCost,
        totalAmount,
        checkoutDetails: { ...checkoutDetails, policyAcceptedAt: new Date().toISOString(), policyVersion: "checkout-v1" },
        status: "reserved_pending_fitment",
      })
      const origin = new URL(request.url).origin
      const [teamNotice, customerNotice] = await Promise.all([
        notifyNewOrder(order, origin).catch(() => ({ ok: false })),
        sendCustomerOrderVerification(order, origin).catch(() => ({ ok: false })),
      ])
      return NextResponse.json({
        ok: true,
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        invoiceToken: order.invoiceToken,
        emailStatus: { teamNotificationAccepted: teamNotice.ok, customerConfirmationAccepted: customerNotice.ok },
      })
    } catch (err) {
      console.error("[orders] Failed to save reservation order:", err instanceof Error ? err.message : err)
      return NextResponse.json(
        { error: "We couldn't place your reservation. Please call us at 1-888-887-4199." },
        { status: 500 },
      )
    }
  }

  const parsed = OrderSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request." }, { status: 400 })
  }
  const { customer, items, paymentGateway, checkoutDetails } = parsed.data

  const pricing = await priceCart(items)
  if (!pricing.ok) return NextResponse.json({ error: pricing.error }, { status: 422 })
  const checkoutFees = feeForCheckout(checkoutDetails)
  const shippingCost = Math.round((pricing.shippingCost + checkoutFees) * 100) / 100
  const totalAmount = Math.round((pricing.subtotal + pricing.tax + shippingCost) * 100) / 100
  if (Math.abs(totalAmount - checkoutDetails.approvedTotal) > 0.02) {
    return NextResponse.json({ error: "The order total changed. Please review the updated total and approve it again." }, { status: 409 })
  }

  try {
    const order = await createOrder({
      userId,
      customerName: `${customer.firstName} ${customer.lastName}`,
      customerEmail: customer.email,
      customerPhone: customer.phone,
      shippingAddress: `${customer.address}, ${customer.city}, ${customer.state} ${customer.zipCode}`,
      customerNotes: customer.notes,
      items: pricing.lines,
      subtotal: pricing.subtotal,
      tax: pricing.tax,
      shippingCost,
      totalAmount,
      checkoutDetails: { ...checkoutDetails, policyAcceptedAt: new Date().toISOString(), policyVersion: "checkout-v1" },
      // Card payments go through /api/checkout/stripe, never this phone-order path.
      paymentGateway: paymentGateway && paymentGateway !== "stripe" ? paymentGateway : undefined,
    })
    const origin = new URL(request.url).origin
    const [teamNotice, customerNotice] = await Promise.all([
      notifyNewOrder(order, origin).catch(() => ({ ok: false })),
      sendCustomerOrderVerification(order, origin).catch(() => ({ ok: false })),
    ])
    return NextResponse.json({
      ok: true,
      orderNumber: order.orderNumber,
      totalAmount: order.totalAmount,
      invoiceToken: order.invoiceToken,
      emailStatus: { teamNotificationAccepted: teamNotice.ok, customerConfirmationAccepted: customerNotice.ok },
    })
  } catch (err) {
    console.error("[orders] Failed to save order:", err instanceof Error ? err.message : err)
    return NextResponse.json(
      { error: "We couldn't place your order. Please call us at 1-888-887-4199." },
      { status: 500 },
    )
  }
}
