"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import {
  CheckoutElementsProvider,
  PaymentElement,
  useCheckoutElements,
} from "@stripe/react-stripe-js/checkout"
import { loadStripe } from "@stripe/stripe-js"
import { Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FieldError } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null

const appearance = {
  theme: "night" as const,
  variables: {
    colorPrimary: "#d4ddf5",
    colorBackground: "#3a3f48",
    colorText: "#f5f7fc",
    colorTextSecondary: "#a5b0c0",
    colorDanger: "#d65050",
    colorTextPlaceholder: "#a5b0c0",
    borderRadius: "6px",
    fontFamily: "ui-sans-serif, system-ui, sans-serif",
  },
  rules: {
    ".Input": {
      backgroundColor: "#4a5158",
      border: "1px solid #5a6270",
      boxShadow: "none",
    },
    ".Input:focus": {
      border: "1px solid #d4ddf5",
      boxShadow: "0 0 0 1px #d4ddf5",
    },
    ".Label": {
      color: "#e5ebf5",
      fontWeight: "500",
    },
    ".Tab": {
      backgroundColor: "#3a3f48",
      border: "1px solid #5a6270",
    },
    ".Tab--selected": {
      backgroundColor: "#4a5268",
      borderColor: "#d4ddf5",
    },
  },
}

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

interface CheckoutDetails {
  addressType: "commercial" | "residential"
  liftgateRequired: boolean
  billingSameAsShipping: boolean
  billingAddress?: {
    name: string
    address: string
    city: string
    state: string
    zipCode: string
    country: string
  }
  termsAccepted: boolean
  shippingPolicyAccepted: boolean
  returnsPolicyAccepted: boolean
  approvedTotal: number
}

interface PaidResult {
  orderNumber: string
  totalAmount: number
  invoiceToken?: string | null
  emailStatus?: {
    teamNotificationAccepted?: boolean
    customerConfirmationAccepted?: boolean
  } | null
}

interface StripeCardPaymentProps {
  customer: StripeCustomer
  checkoutDetails: CheckoutDetails
  items: CartLine[]
  amountLabel: string
  onPaid: (result: PaidResult) => void
  onError: (message: string) => void
}

function billingFromCustomer(customer: StripeCustomer) {
  return {
    name: `${customer.firstName} ${customer.lastName}`.trim(),
    address: {
      country: "US" as const,
      line1: customer.address,
      city: customer.city,
      state: customer.state,
      postal_code: customer.zipCode,
    },
  }
}

async function confirmPaidSession(sessionId: string): Promise<PaidResult> {
  const res = await fetch(`/api/checkout/stripe/session/${encodeURIComponent(sessionId)}`)
  const data = await res.json().catch(() => ({}))
  if (!res.ok || !data.paid) {
    throw new Error(
      "Payment completed, but we could not confirm your order. Please call us at 1-888-887-4199.",
    )
  }
  return {
    orderNumber: data.orderNumber,
    totalAmount: data.totalAmount,
    invoiceToken: data.invoiceToken,
    emailStatus: data.emailStatus ?? null,
  }
}

function AuapwCardForm({
  customer,
  amountLabel,
  onPaid,
  onError,
}: {
  customer: StripeCustomer
  amountLabel: string
  onPaid: (result: PaidResult) => void
  onError: (message: string) => void
}) {
  const checkoutState = useCheckoutElements()
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const customerRef = useRef(customer)
  const onPaidRef = useRef(onPaid)
  const onErrorRef = useRef(onError)
  useEffect(() => {
    customerRef.current = customer
    onPaidRef.current = onPaid
    onErrorRef.current = onError
  }, [customer, onPaid, onError])

  if (checkoutState.type === "loading") {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Spinner />
        Loading secure card form…
      </div>
    )
  }

  if (checkoutState.type === "error") {
    return <p className="text-sm text-destructive">{checkoutState.error.message}</p>
  }

  const { checkout } = checkoutState
  const payLabel = checkout.total?.total?.amount
    ? `Pay ${checkout.total.total.amount}`
    : `Pay ${amountLabel}`

  async function handlePay() {
    if (submitting) return
    setSubmitting(true)
    setFormError(null)
    const current = customerRef.current
    try {
      const result = await checkout.confirm({
        redirect: "if_required",
        returnUrl: `${window.location.origin}/checkout?session_id={CHECKOUT_SESSION_ID}`,
        email: current.email,
        phoneNumber: current.phone || undefined,
        billingAddress: billingFromCustomer(current),
      })
      if (result.type === "error") {
        setFormError(result.error.message)
        return
      }
      onPaidRef.current(await confirmPaidSession(result.session.id))
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Could not complete card payment. Please try again."
      setFormError(message)
      onErrorRef.current(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault()
        void handlePay()
      }}
    >
      <PaymentElement
        options={{
          layout: "tabs",
          paymentMethodOrder: ["card"],
          fields: {
            billingDetails: {
              name: "never",
              email: "never",
              phone: "never",
              address: "never",
            },
          },
        }}
      />
      {formError ? <FieldError>{formError}</FieldError> : null}
      <Button type="submit" size="lg" className="w-full" disabled={submitting || !checkout.canConfirm}>
        {submitting ? <Spinner data-icon="inline-start" /> : <Lock data-icon="inline-start" />}
        {submitting ? "Processing…" : payLabel}
      </Button>
    </form>
  )
}

export function StripeCardPayment({
  customer,
  checkoutDetails,
  items,
  amountLabel,
  onPaid,
  onError,
}: StripeCardPaymentProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [initError, setInitError] = useState<string | null>(null)
  const started = useRef(false)
  const customerRef = useRef(customer)
  const itemsRef = useRef(items)
  const checkoutDetailsRef = useRef(checkoutDetails)
  useEffect(() => {
    customerRef.current = customer
    itemsRef.current = items
    checkoutDetailsRef.current = checkoutDetails
  }, [customer, checkoutDetails, items])

  useEffect(() => {
    if (started.current) return
    started.current = true
    let cancelled = false
    fetch("/api/checkout/stripe/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer: customerRef.current,
        checkoutDetails: checkoutDetailsRef.current,
        items: itemsRef.current,
      }),
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data.error ?? "Could not start card payment. Please try again.")
        if (!cancelled) setClientSecret(data.clientSecret as string)
      })
      .catch((error) => {
        const message =
          error instanceof Error ? error.message : "Could not start card payment. Please try again."
        if (!cancelled) {
          setInitError(message)
          onError(message)
        }
      })
    return () => {
      cancelled = true
    }
  }, [onError])

  const options = useMemo(
    () =>
      clientSecret
        ? {
            clientSecret,
            elementsOptions: { appearance },
            defaultValues: {
              email: customer.email,
              phoneNumber: customer.phone || undefined,
              billingAddress: billingFromCustomer(customer),
            },
          }
        : null,
    // Freeze after the secret arrives so CheckoutElementsProvider does not remount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [clientSecret],
  )

  if (!stripePromise) {
    return (
      <p className="text-sm text-destructive">
        Card payments are not configured. Please choose another payment method.
      </p>
    )
  }

  if (initError) {
    return <p className="text-sm text-destructive">{initError}</p>
  }

  if (!clientSecret || !options) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Spinner />
        Preparing secure card form…
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <CheckoutElementsProvider stripe={stripePromise} options={options}>
        <AuapwCardForm
          customer={customer}
          amountLabel={amountLabel}
          onPaid={onPaid}
          onError={onError}
        />
      </CheckoutElementsProvider>
    </div>
  )
}
