import { NextResponse } from "next/server"
import { confirmStripeCheckoutSession } from "@/lib/stripe-checkout"

export async function GET(request: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params
  const result = await confirmStripeCheckoutSession(sessionId, new URL(request.url).origin)

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 404 })
  }

  return NextResponse.json({
    paid: result.paid,
    orderNumber: result.order.orderNumber,
    totalAmount: result.order.totalAmount,
    emailStatus: result.emailStatus ?? null,
  })
}
