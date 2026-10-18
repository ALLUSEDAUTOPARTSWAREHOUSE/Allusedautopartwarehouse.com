"use client"

import { useCallback, useEffect, useRef } from "react"
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js"
import { loadStripe } from "@stripe/stripe-js"

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null

interface StripeCustomer {
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

interface CartLine {
  id: string
  make?: string
  price: number
  quantity: number
}

interface StripeCardPaymentProps {
  customer: StripeCustomer
  checkoutDetails: { addressType: 'commercial' | 'residential'; liftgateRequired: boolean; billingSameAsShipping: boolean; billingAddress?: { name: string; address: string; city: string; state: string; zipCode: string; country: string }; termsAccepted: boolean; shippingPolicyAccepted: boolean; returnsPolicyAccepted: boolean; approvedTotal: number }
  items: CartLine[]
  onPaid: (result: { orderNumber: string; totalAmount: number; invoiceToken?: string | null; emailStatus?: { teamNotificationAccepted?: boolean; customerConfirmationAccepted?: boolean } | null }) => void
  onError: (message: string) => void
}

export function StripeCardPayment({ customer, checkoutDetails, items, onPaid, onError }: StripeCardPaymentProps) {
  const sessionIdRef = useRef<string | null>(null)

  // EmbeddedCheckoutProvider throws if `options` changes identity after mount,
  // so fetchClientSecret/handleComplete must stay referentially stable. Refs let
  // them read the latest props without being recreated on every parent render.
  const customerRef = useRef(customer)
  const itemsRef = useRef(items)
  const checkoutDetailsRef = useRef(checkoutDetails)
  const onPaidRef = useRef(onPaid)
  const onErrorRef = useRef(onError)
  useEffect(() => {
    customerRef.current = customer
    itemsRef.current = items
    checkoutDetailsRef.current = checkoutDetails
    onPaidRef.current = onPaid
    onErrorRef.current = onError
  }, [customer, checkoutDetails, items, onPaid, onError])

  const fetchClientSecret = useCallback(async () => {
    const res = await fetch("/api/checkout/stripe/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customer: customerRef.current, checkoutDetails: checkoutDetailsRef.current, items: itemsRef.current }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      onErrorRef.current(data.error ?? "Could not start card payment. Please try again.")
      throw new Error(data.error ?? "Could not start card payment.")
    }
    sessionIdRef.current = data.clientSecret?.split("_secret_")[0] ?? null
    return data.clientSecret as string
  }, [])

  const handleComplete = useCallback(async () => {
    const sessionId = sessionIdRef.current
    if (!sessionId) {
      onErrorRef.current("Payment completed, but we could not confirm your order. Please call us at 1-888-887-4199.")
      return
    }
    try {
      const res = await fetch(`/api/checkout/stripe/session/${encodeURIComponent(sessionId)}`)
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.paid) {
        onPaidRef.current({ orderNumber: data.orderNumber, totalAmount: data.totalAmount, invoiceToken: data.invoiceToken, emailStatus: data.emailStatus ?? null })
      } else {
        onErrorRef.current(
          "Payment completed, but we could not confirm your order. Please call us at 1-888-887-4199.",
        )
      }
    } catch {
      onErrorRef.current("Payment completed, but we could not confirm your order. Please call us at 1-888-887-4199.")
    }
  }, [])

  if (!stripePromise) {
    return (
      <p className="text-sm text-destructive">
        Card payments are not configured. Please choose another payment method.
      </p>
    )
  }

  return (
    <div id="checkout" className="overflow-hidden rounded-md border border-border">
      <EmbeddedCheckoutProvider
        stripe={stripePromise}
        options={{ fetchClientSecret, onComplete: handleComplete }}
      >
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  )
}
