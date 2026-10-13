import "server-only"
import { stripe } from "@/lib/stripe"
import { priceCart, type CartLineInput } from "@/lib/order-pricing"
import {
  createOrder,
  attachStripeSession,
  getOrderByStripeSession,
  markOrderPaid,
  listUnconfirmedStripeSessions,
  type CustomerOrder,
} from "@/lib/followup"
import { notifyNewOrder, sendCustomerOrderInvoice } from "@/lib/followup-notify"

export interface StripeCheckoutCustomer {
  userId?: string
  firstName: string
  lastName: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  zipCode: string
  notes?: string
}

/**
 * Re-prices the cart server-side, creates a pending order, and starts a
 * Stripe embedded Checkout Session for the exact validated total. The
 * customer enters real card details inside Stripe's own secure iframe.
 */
export async function createStripeCheckoutSession(customer: StripeCheckoutCustomer, items: CartLineInput[]) {
  if (!stripe) {
    return { ok: false as const, error: "Card payments are not configured. Please choose another payment method." }
  }

  const pricing = await priceCart(items)
  if (!pricing.ok) return { ok: false as const, error: pricing.error }

  const order = await createOrder({
    userId: customer.userId,
    customerName: `${customer.firstName} ${customer.lastName}`,
    customerEmail: customer.email,
    customerPhone: customer.phone,
    shippingAddress: `${customer.address}, ${customer.city}, ${customer.state} ${customer.zipCode}`,
    customerNotes: customer.notes,
    items: pricing.lines,
    subtotal: pricing.subtotal,
    tax: pricing.tax,
    shippingCost: pricing.shippingCost,
    totalAmount: pricing.totalAmount,
    paymentGateway: "stripe",
    status: "pending",
  })

  const lineItems = pricing.lines.map((line) => ({
    price_data: {
      currency: "usd",
      product_data: { name: line.name },
      unit_amount: Math.round(line.unitPrice * 100),
    },
    quantity: line.quantity,
  }))

  if (pricing.shippingCost > 0) {
    lineItems.push({
      price_data: {
        currency: "usd",
        product_data: { name: "Shipping" },
        unit_amount: Math.round(pricing.shippingCost * 100),
      },
      quantity: 1,
    })
  }

  lineItems.push({
    price_data: {
      currency: "usd",
      product_data: { name: "Tax" },
      unit_amount: Math.round(pricing.tax * 100),
    },
    quantity: 1,
  })

  try {
    const session = await stripe.checkout.sessions.create({
      ui_mode: "embedded_page",
      redirect_on_completion: "never",
      mode: "payment",
      customer_email: customer.email,
      line_items: lineItems,
      metadata: { orderId: order.id, orderNumber: order.orderNumber },
    }, { idempotencyKey: `checkout-${order.id}` })

    await attachStripeSession(order.id, session.id)

    return {
      ok: true as const,
      clientSecret: session.client_secret,
      orderNumber: order.orderNumber,
      totalAmount: order.totalAmount,
    }
  } catch (error) {
    console.error("[v0] Stripe checkout session error:", error)
    return { ok: false as const, error: "Could not start card payment. Please try again or choose another method." }
  }
}

/**
 * Confirms a Checkout Session's payment status directly with Stripe (never
 * trusting a client-supplied "paid" flag) and marks the matching order paid.
 * Safe to call repeatedly — only updates the order the first time.
 */
export async function confirmStripeCheckoutSession(
  sessionId: string,
  siteUrl: string,
): Promise<
  | { ok: true; order: CustomerOrder; paid: boolean; emailStatus?: { teamNotificationAccepted: boolean; customerConfirmationAccepted: boolean } | null }
  | { ok: false; error: string }
> {
  if (!stripe) return { ok: false, error: "Card payments are not configured." }

  const order = await getOrderByStripeSession(sessionId)
  if (!order) return { ok: false, error: "Order not found for this payment session." }

  if (order.status === "paid") {
    return { ok: true, order, paid: true, emailStatus: null }
  }

  const session = await stripe.checkout.sessions.retrieve(sessionId)
  if (session.payment_status !== "paid") {
    return { ok: true, order, paid: false, emailStatus: null }
  }

  const paidOrder = await markOrderPaid(order.id)
  // Another confirmation (webhook, browser, daily reconcile) got there first and sent the emails.
  if (!paidOrder) return { ok: true, order: { ...order, status: "paid" }, paid: true, emailStatus: null }
  const [teamNotice, customerNotice] = await Promise.all([
    notifyNewOrder(paidOrder, siteUrl).catch((err) => {
      console.error("[v0] Order paid notification failed:", err)
      return { ok: false }
    }),
    sendCustomerOrderInvoice(paidOrder, siteUrl).catch((err) => {
      console.error("[v0] Customer paid invoice email failed:", err)
      return { ok: false }
    }),
  ])
  return {
    ok: true,
    order: paidOrder,
    paid: true,
    emailStatus: {
      teamNotificationAccepted: teamNotice.ok,
      customerConfirmationAccepted: customerNotice.ok,
    },
  }
}

/**
 * Safety net for card orders whose browser confirmation never arrived (tab
 * closed right after paying, network drop): asks Stripe about each pending
 * session and marks the paid ones, sending the usual order emails.
 */
export async function reconcilePendingStripeOrders(siteUrl: string): Promise<{ checked: number; paid: number }> {
  if (!stripe) return { checked: 0, paid: 0 }
  // Leave fresh sessions alone: the shopper may still be on the payment form.
  const sessionIds = await listUnconfirmedStripeSessions(30, 7)
  let paid = 0
  for (const sessionId of sessionIds) {
    try {
      const result = await confirmStripeCheckoutSession(sessionId, siteUrl)
      if (result.ok && result.paid) paid++
    } catch (error) {
      console.error("[stripe] reconcile failed for a session:", error instanceof Error ? error.message : error)
    }
  }
  return { checked: sessionIds.length, paid }
}
