'use client'

import { useCartStore } from '@/lib/stores/cart-store'
import { SHIPPING, RESERVE_SHIPPING, type ReserveDeliveryMethod } from '@/lib/site-policy'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Check, ArrowLeft, ShieldCheck, Lock, ExternalLink, Landmark, Wallet, Phone, Truck } from 'lucide-react'
import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'

import { BrandLogosSection } from '@/components/brand-logos'
import { StripeCardPayment } from '@/components/checkout/stripe-card-payment'
import { GoogleCustomerReviewsOptIn } from '@/components/google-customer-reviews'
import { CheckoutTerms } from '@/components/checkout/checkout-terms'
import { useRouter } from 'next/navigation'

interface PaymentGateway {
  id: string
  name: string
  slug: string
  type: 'card' | 'wallet' | 'bank' | 'link' | 'offline'
  description: string | null
  isEnabled: boolean
  isDefault: boolean
  paymentLink?: string | null
  instructions?: string | null
}

export default function CheckoutPage() {
  const router = useRouter()
  const items = useCartStore((state) => state.items)
  const getTotalPrice = useCartStore((state) => state.getTotalPrice)
  const clearCart = useCartStore((state) => state.clearCart)
  const addItem = useCartStore((state) => state.addItem)
  const deliveryMethod = useCartStore((state) => state.deliveryMethod)
  const setDeliveryMethod = useCartStore((state) => state.setDeliveryMethod)
  const isReservationCart = items.length > 0 && items.every((item) => item.isReservation)
  
  const [step, setStep] = useState<'auth' | 'shipping' | 'payment' | 'confirmation'>('auth')
  const [isGuest, setIsGuest] = useState(false)
  const [gateways, setGateways] = useState<PaymentGateway[]>([])
  const [selectedGateway, setSelectedGateway] = useState<string | null>(null)
  const [loadingItemId, setLoadingItemId] = useState(false)
  // The cart lives in localStorage, so the server always renders it empty;
  // wait until mounted before rendering anything that depends on it.
  const [hydrated, setHydrated] = useState(false)
  useEffect(() => setHydrated(true), [])
  useEffect(() => {
    // After secure sign-in, resume at shipping details instead of showing the account chooser again.
    if (new URLSearchParams(window.location.search).get('resume') === '1') setStep('shipping')
  }, [])

  useEffect(() => {
    fetch('/api/payment-gateways')
      .then((res) => (res.ok ? res.json() : { gateways: [] }))
      .then((data) => {
        const enabled: PaymentGateway[] = (data.gateways ?? []).filter(
          (g: PaymentGateway) => g.isEnabled
        )
        setGateways(enabled)
        const def = enabled.find((g) => g.isDefault) ?? enabled[0]
        if (def) setSelectedGateway(def.slug)
      })
      .catch(() => {})
  }, [])

  // Supports Google Merchant Center's "Checkout URL" deep link
  // (e.g. https://www.allusedautopartswarehouse.com/checkout?item_id={id})
  // so ads can take a shopper straight into checkout with the item preloaded.
  useEffect(() => {
    const itemId = new URLSearchParams(window.location.search).get('item_id')
    if (!itemId) return
    // Consume the param so a reload or Back doesn't add the part again.
    window.history.replaceState(null, '', window.location.pathname)

    setLoadingItemId(true)
    fetch(`/api/checkout-item/${encodeURIComponent(itemId)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.item && !useCartStore.getState().items.some((i) => i.id === data.item.id)) {
          addItem({ ...data.item, quantity: 1 })
        }
      })
      .catch(() => {})
      .finally(() => setLoadingItemId(false))
  }, [addItem])
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    notes: '',
  })
  const [isProcessing, setIsProcessing] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [placedOrder, setPlacedOrder] = useState<{
    orderNumber: string
    totalAmount: number
    reserved?: boolean
    emailStatus?: { teamNotificationAccepted?: boolean; customerConfirmationAccepted?: boolean } | null
  } | null>(null)
  const [paymentConfirmed, setPaymentConfirmed] = useState(false)

  const totalPrice = isReservationCart ? 0 : getTotalPrice()
  const shipping = isReservationCart
    ? RESERVE_SHIPPING[deliveryMethod].price
    : items.reduce((total, item) => total + SHIPPING.price * item.quantity, 0)
  const tax = isReservationCart ? 0 : totalPrice * 0.08
  const finalTotal = totalPrice + shipping + tax

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleShippingSubmit = () => {
    const { firstName, lastName, email, phone, address, city, state, zipCode } = formData
    if (!firstName || !lastName || !email || !address || !city || !state || !zipCode) {
      setError('Please fill in all shipping fields.')
      return
    }
    if (phone.replace(/\D/g, '').length < 10) {
      setError('Please enter a valid phone number so we can confirm your order.')
      return
    }
    setError(null)
    setStep('payment')
  }

  const handlePlaceOrder = async () => {
    if (!agreedToTerms) {
      setError('Please agree to the order terms and conditions before placing your order.')
      return
    }
    setIsProcessing(true)
    setError(null)
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          isReservationCart
            ? {
                mode: 'reserve',
                customer: formData,
                deliveryMethod,
                items: items.map(({ id, make, quantity }) => ({ id, make, quantity })),
              }
            : {
                customer: formData,
                paymentGateway: selectedGateway ?? undefined,
                items: items.map(({ id, make, price, quantity }) => ({ id, make, price, quantity })),
              },
        ),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error ?? 'We could not place your order. Please call (708) 896-2383.')
        return
      }
      setPlacedOrder({ orderNumber: data.orderNumber, totalAmount: data.totalAmount, reserved: isReservationCart, emailStatus: data.emailStatus })
      clearCart()
      setStep('confirmation')
    } catch {
      setError('Network error. Please try again or call (708) 896-2383.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleStripePaid = (result: { orderNumber: string; totalAmount: number; emailStatus?: { teamNotificationAccepted?: boolean; customerConfirmationAccepted?: boolean } | null }) => {
    setPaymentConfirmed(true)
    setPlacedOrder(result)
    clearCart()
    setStep('confirmation')
  }

  const handleStripeError = (message: string) => {
    setError(message)
  }

  const activeGateway = gateways.find((g) => g.slug === selectedGateway)
  const isStripeCard =
    Boolean(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) &&
    activeGateway?.type === 'card' &&
    activeGateway.slug === 'stripe'

  if (!hydrated) {
    return (
      <>
        <Navbar />
        <main className="pt-[58px]">
          <div className="py-24 text-center text-foreground/60">Loading your cart…</div>
        </main>
        <Footer />
      </>
    )
  }

  if (items.length === 0 && step !== 'confirmation' && !loadingItemId) {
    return (
      <>
        <Navbar />
        <main className="pt-[58px]">
          <div className="py-12 pb-20">
            <div className="mx-auto max-w-2xl px-4 text-center">
              <h1 className="text-3xl font-bold mb-4">Your cart is empty</h1>
              <p className="text-foreground/60 mb-8">Add some parts before checking out</p>
              <Link href="/parts">
                <Button size="lg">Continue Shopping</Button>
              </Link>
            </div>
          </div>
          <BrandLogosSection />
        </main>
        <Footer />
      </>
    )
  }

  if (items.length === 0 && loadingItemId) {
    return (
      <>
        <Navbar />
        <main className="pt-[58px]">
          <div className="py-24 text-center text-foreground/60">Loading your item…</div>
        </main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Navbar />
      <main className="pt-[58px]">
        <div className="relative bg-cover bg-center py-20 sm:py-28 border-b border-border/20 mb-12" style={{ backgroundImage: "linear-gradient(to bottom right, rgba(13,15,22,0.82), rgba(13,15,22,0.60), rgba(13,15,22,0.88)), url('/images/heroes/hero-warehouse.png')" }}>
          <div className="mx-auto max-w-4xl px-4">
            <Link href="/cart" className="inline-flex items-center gap-2 text-slate-200 hover:text-white mb-6">
              <ArrowLeft className="w-4 h-4" />
              Back to Cart
            </Link>
            <h1 className="text-4xl sm:text-5xl font-black uppercase tracking-tight text-white mb-2 drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)]">Checkout</h1>
          </div>
        </div>
        <div className="pb-20">
        <div className="mx-auto max-w-4xl px-4">

          {step === 'auth' ? (
            <div className="mb-8 p-6 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/50 rounded-lg">
              <h2 className="text-xl font-bold mb-4">Checkout as:</h2>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/sign-in?redirectTo=%2Fcheckout%3Fresume%3D1" className="flex-1">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 py-6 text-base font-semibold">
                    Sign In to Account
                  </Button>
                </Link>
                <Button
                  onClick={() => {
                    setIsGuest(true)
                    setStep('shipping')
                  }}
                  variant="outline"
                  className="flex-1 py-6 text-base font-semibold"
                >
                  Continue as Guest
                </Button>
              </div>
              <div className="mt-4 flex flex-col gap-2">
                <Link href="/sign-up?redirectTo=%2Fcheckout%3Fresume%3D1">
                  <Button variant="ghost" className="w-full justify-start text-blue-400 hover:text-blue-300">
                    New to AUAPW? Create Account
                  </Button>
                </Link>
              </div>
            </div>
          ) : null}

          {step === 'confirmation' ? (
            <div className="text-center py-20">
              {placedOrder && (
                <GoogleCustomerReviewsOptIn
                  orderId={placedOrder.orderNumber}
                  email={formData.email}
                />
              )}
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
                <Check className="w-8 h-8 text-green-400" />
              </div>
              <h2 className="text-3xl font-bold mb-2">
                {paymentConfirmed ? 'Payment Confirmed!' : placedOrder?.reserved ? 'Part Reserved!' : 'Order Received!'}
              </h2>
              <p className="text-foreground/60 mb-8 text-pretty">
                {paymentConfirmed
                  ? 'Your payment was received securely through Stripe. A parts specialist will call you within one business day to confirm fitment and delivery details. No additional payment is needed for this order.'
                  : placedOrder?.reserved
                    ? 'This part is reserved for you — no payment has been taken. A parts specialist will call you within one business day to confirm fitment, give you the final price and warranty terms in writing, and take payment only once you approve it.'
                    : 'A parts specialist will call you within one business day to confirm fitment and take payment securely by phone. Nothing has been charged yet.'}
              </p>
              {placedOrder?.emailStatus ? (
                <p role="status" className="mx-auto mb-5 max-w-xl text-sm text-foreground/70">
                  {placedOrder.emailStatus.customerConfirmationAccepted
                    ? `The email service accepted a confirmation for ${formData.email}.`
                    : "Your order is saved, but the email service did not accept the confirmation email. A parts specialist will still follow up; please check that your email address is correct."}
                </p>
              ) : null}
              <div className="bg-white/5 border border-white/10 rounded-lg p-6 mb-8 text-left">
                <p className="text-sm text-foreground/60 mb-2">{placedOrder?.reserved ? 'Reservation Number' : 'Order Number'}</p>
                <p className="text-2xl font-bold mb-6 font-mono">{placedOrder?.orderNumber}</p>
                <p className="text-sm text-foreground/60 mb-2">
                  {placedOrder?.reserved ? 'Due Today (Delivery Only)' : 'Order Total'}
                </p>
                <p className="text-2xl font-bold text-blue-400">${(placedOrder?.totalAmount ?? 0).toFixed(2)}</p>
              </div>
              <div className="flex gap-4 justify-center">
                <Link href="/parts">
                  <Button size="lg">Continue Shopping</Button>
                </Link>
                <Link href="/">
                  <Button size="lg" variant="outline">
                    Back Home
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Checkout form */}
              <div className="lg:col-span-2">
                {error && (
                  <div role="alert" className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                    {error}
                  </div>
                )}
                <div className="space-y-8">
                  {/* Shipping Info */}
                  <div className="p-6 border border-white/10 rounded-lg bg-white/5">
                    <div className="flex items-center gap-3 mb-6">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step === 'shipping' || step === 'payment' ? 'bg-blue-500 text-white' : 'bg-white/10 text-foreground/60'}`}>
                        1
                      </div>
                      <h2 className="text-xl font-bold">Shipping Information</h2>
                    </div>

                    {step === 'shipping' && (
                      <div className="space-y-4">
                        <div className="grid sm:grid-cols-2 gap-4">
                          <Input
                            placeholder="First Name"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleInputChange}
                          />
                          <Input
                            placeholder="Last Name"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleInputChange}
                          />
                        </div>
                        <Input
                          placeholder="Email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleInputChange}
                        />
                        <Input
                          placeholder="Phone"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                        />
                        <Input
                          placeholder="Street Address"
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                        />
                        <div className="grid sm:grid-cols-2 gap-4">
                          <Input
                            placeholder="City"
                            name="city"
                            value={formData.city}
                            onChange={handleInputChange}
                          />
                          <Input
                            placeholder="State"
                            name="state"
                            value={formData.state}
                            onChange={handleInputChange}
                          />
                        </div>
                        <Input
                          placeholder="ZIP Code"
                          name="zipCode"
                          value={formData.zipCode}
                          onChange={handleInputChange}
                        />
                        <Button size="lg" className="w-full" onClick={handleShippingSubmit}>
                          Continue to Payment
                        </Button>
                      </div>
                    )}

                    {step === 'payment' && (
                      <div className="text-sm text-foreground/60 space-y-1">
                        <p>{formData.firstName} {formData.lastName}</p>
                        <p>{formData.address}</p>
                        <p>{formData.city}, {formData.state} {formData.zipCode}</p>
                      </div>
                    )}
                  </div>

                  {/* Payment Info */}
                  <div className="p-6 border border-white/10 rounded-lg bg-white/5">
                    <div className="flex items-center gap-3 mb-6">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step !== 'shipping' ? 'bg-blue-500 text-white' : 'bg-white/10 text-foreground/60'}`}>
                        2
                      </div>
                      <h2 className="text-xl font-bold">Review &amp; Place Order</h2>
                    </div>

                    {step === 'payment' && (
                      <div className="space-y-5">
                        {isReservationCart && (
                          <div className="space-y-2">
                            <p className="text-sm font-semibold text-foreground/90">Delivery Method</p>
                            <div className="grid sm:grid-cols-2 gap-3">
                              {(Object.keys(RESERVE_SHIPPING) as ReserveDeliveryMethod[]).map((method) => {
                                const info = RESERVE_SHIPPING[method]
                                const isSelected = deliveryMethod === method
                                return (
                                  <button
                                    key={method}
                                    type="button"
                                    onClick={() => setDeliveryMethod(method)}
                                    className={`text-left p-4 rounded-lg border transition-colors ${
                                      isSelected
                                        ? 'border-blue-500 bg-blue-500/10'
                                        : 'border-white/10 bg-white/5 hover:border-white/30'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="font-semibold text-sm">{info.label}</span>
                                      {info.price === 0 ? (
                                        <span className="text-[10px] uppercase tracking-wide font-bold text-green-400">Free</span>
                                      ) : (
                                        <span className="text-[10px] uppercase tracking-wide font-bold text-blue-400">
                                          +${info.price}
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-xs text-foreground/60 leading-snug">{info.detail}</p>
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        )}
                        {!isReservationCart && gateways.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-sm font-semibold text-foreground/90">Payment Method</p>
                            <div className="grid sm:grid-cols-2 gap-3">
                              {gateways.map((gw) => {
                                const isSelected = selectedGateway === gw.slug
                                return (
                                  <button
                                    key={gw.id}
                                    type="button"
                                    onClick={() => setSelectedGateway(gw.slug)}
                                    className={`text-left p-4 rounded-lg border transition-colors ${
                                      isSelected
                                        ? 'border-blue-500 bg-blue-500/10'
                                        : 'border-white/10 bg-white/5 hover:border-white/30'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="font-semibold text-sm">{gw.name}</span>
                                      {gw.isDefault && (
                                        <span className="text-[10px] uppercase tracking-wide font-bold text-blue-400">
                                          Recommended
                                        </span>
                                      )}
                                    </div>
                                    {gw.description && (
                                      <p className="text-xs text-foreground/60 leading-snug">{gw.description}</p>
                                    )}
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        )}

                        {/* Above the terms box: ticking it mounts the Stripe form, which saves the order
                            with the notes as they are at that moment. */}
                        <label htmlFor="checkout-notes" className="sr-only">Order notes</label>
                        <Textarea
                          id="checkout-notes"
                          placeholder="VIN, best time to call, or delivery notes (optional)"
                          name="notes"
                          rows={3}
                          maxLength={1000}
                          value={formData.notes}
                          onChange={handleInputChange}
                          disabled={isStripeCard && agreedToTerms && !isReservationCart}
                        />
                        <CheckoutTerms checked={agreedToTerms} onCheckedChange={setAgreedToTerms} />

                        {!agreedToTerms ? (
                          <p className="text-sm text-foreground/60 italic">
                            Check the box above to agree to the order terms before continuing to payment.
                          </p>
                        ) : isReservationCart ? (
                          <div className="rounded-lg border border-white/10 bg-white/5 p-4 space-y-2">
                            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                              <Truck className="w-4 h-4" />
                              No part payment due now
                            </div>
                            <p className="text-sm text-foreground/60 whitespace-pre-line">
                              We reserve this part for you today. A parts specialist calls to confirm fitment for your
                              VIN, gives you the final price and warranty terms in writing, and only takes payment once
                              you approve it.
                            </p>
                          </div>
                        ) : (
                        (() => {
                          const active = gateways.find((g) => g.slug === selectedGateway)
                          if (!active) return null

                          if (isStripeCard) {
                            return (
                              <div className="rounded-lg border border-white/10 bg-white/5 p-4 space-y-3">
                                <div className="flex items-center justify-between flex-wrap gap-2">
                                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                                    <ShieldCheck className="w-4 h-4" />
                                    Secured by {active.name}
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    {['VISA', 'MASTERCARD', 'AMEX', 'DISCOVER'].map((card) => (
                                      <span
                                        key={card}
                                        className="px-1.5 py-0.5 rounded border border-white/15 text-[9px] font-bold tracking-wide text-foreground/60"
                                      >
                                        {card}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                                <StripeCardPayment
                                  customer={formData}
                                  items={items.map(({ id, make, price, quantity }) => ({ id, make, price, quantity }))}
                                  onPaid={handleStripePaid}
                                  onError={handleStripeError}
                                />
                                <p className="flex items-center gap-1.5 text-xs text-foreground/50">
                                  <Lock className="w-3 h-3" />
                                  Enter your card details above. Your card is charged securely by Stripe.
                                </p>
                              </div>
                            )
                          }

                          if (active.type === 'card') {
                            return (
                              <div className="rounded-lg border border-white/10 bg-white/5 p-4 space-y-3">
                                <div className="flex items-center justify-between flex-wrap gap-2">
                                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                                    <ShieldCheck className="w-4 h-4" />
                                    Secured by {active.name}
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    {['VISA', 'MASTERCARD', 'AMEX', 'DISCOVER'].map((card) => (
                                      <span
                                        key={card}
                                        className="px-1.5 py-0.5 rounded border border-white/15 text-[9px] font-bold tracking-wide text-foreground/60"
                                      >
                                        {card}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                                <div className="grid sm:grid-cols-2 gap-3 opacity-60">
                                  <div className="rounded-md border border-white/10 bg-background/40 px-3 py-2.5 text-sm text-foreground/50">
                                    Card Number
                                  </div>
                                  <div className="rounded-md border border-white/10 bg-background/40 px-3 py-2.5 text-sm text-foreground/50">
                                    Name on Card
                                  </div>
                                  <div className="rounded-md border border-white/10 bg-background/40 px-3 py-2.5 text-sm text-foreground/50">
                                    MM / YY
                                  </div>
                                  <div className="rounded-md border border-white/10 bg-background/40 px-3 py-2.5 text-sm text-foreground/50">
                                    CVV
                                  </div>
                                </div>
                                <p className="flex items-center gap-1.5 text-xs text-foreground/50">
                                  <Lock className="w-3 h-3" />
                                  Card details are collected securely by phone — nothing is charged online.
                                </p>
                              </div>
                            )
                          }

                          if (active.type === 'wallet') {
                            return (
                              <div className="rounded-lg border border-white/10 bg-white/5 p-4 space-y-3">
                                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                                  <ShieldCheck className="w-4 h-4" />
                                  Secured by {active.name}
                                </div>
                                <div className="flex items-center justify-center gap-2 rounded-md border border-white/15 bg-background/40 py-3.5 text-sm font-semibold text-foreground/70">
                                  <Wallet className="w-4 h-4" />
                                  Continue with {active.name}
                                </div>
                                <p className="flex items-center gap-1.5 text-xs text-foreground/50">
                                  <Lock className="w-3 h-3" />
                                  You&apos;ll confirm payment with {active.name} by phone after placing your order.
                                </p>
                              </div>
                            )
                          }

                          if (active.type === 'link') {
                            return (
                              <div className="rounded-lg border border-white/10 bg-white/5 p-4 space-y-3">
                                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                                  <ShieldCheck className="w-4 h-4" />
                                  Pay via {active.name}
                                </div>
                                {active.paymentLink ? (
                                  <a
                                    href={active.paymentLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-2 rounded-md bg-blue-600 hover:bg-blue-700 transition-colors py-3 text-sm font-semibold text-white"
                                  >
                                    Open secure payment page
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </a>
                                ) : (
                                  <p className="text-xs text-foreground/50">
                                    A payment link will be sent to you after your order is placed.
                                  </p>
                                )}
                                {active.instructions && (
                                  <p className="text-xs text-foreground/50 whitespace-pre-line">
                                    {active.instructions}
                                  </p>
                                )}
                              </div>
                            )
                          }

                          if (active.type === 'bank') {
                            return (
                              <div className="rounded-lg border border-white/10 bg-white/5 p-4 space-y-3">
                                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                                  <Landmark className="w-4 h-4" />
                                  {active.name}
                                </div>
                                <p className="text-sm text-foreground/60 whitespace-pre-line">
                                  {active.instructions ??
                                    'A parts specialist will provide bank transfer details by phone after you place your order.'}
                                </p>
                              </div>
                            )
                          }

                          return (
                            <div className="rounded-lg border border-white/10 bg-white/5 p-4 space-y-2">
                              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                                <Phone className="w-4 h-4" />
                                {active.name}
                              </div>
                              <p className="text-sm text-foreground/60 whitespace-pre-line">
                                {active.instructions ??
                                  'A parts specialist calls you to confirm fitment for your VIN and take payment securely by phone.'}
                              </p>
                            </div>
                          )
                        })()
                        )}

                        {!isStripeCard && !isReservationCart && (
                          <p className="text-sm text-foreground/70 leading-relaxed">
                            No card needed online. After you place your order, a parts specialist calls you to confirm fitment for your VIN and take payment securely{selectedGateway && selectedGateway !== 'phone' ? ` using ${gateways.find((g) => g.slug === selectedGateway)?.name}` : ''} by phone.
                          </p>
                        )}
                        {isReservationCart && (
                          <p className="text-sm text-foreground/70 leading-relaxed">
                            {shipping > 0
                              ? `Only the $${shipping.toFixed(2)} delivery charge is due today. The part price is confirmed by phone before any further charge.`
                              : 'Nothing is due today — Standard Freight is free. The part price is confirmed by phone before any charge.'}
                          </p>
                        )}
                        <div className="flex flex-col sm:flex-row gap-3">
                          <Button variant="outline" size="lg" onClick={() => setStep('shipping')} disabled={isProcessing}>
                            Edit Shipping
                          </Button>
                          {isReservationCart ? (
                            <Button size="lg" className="flex-1" onClick={handlePlaceOrder} disabled={isProcessing || !agreedToTerms}>
                              {isProcessing ? 'Reserving...' : 'Reserve & Place Order'}
                            </Button>
                          ) : (
                            !isStripeCard && (
                              <Button size="lg" className="flex-1" onClick={handlePlaceOrder} disabled={isProcessing || !agreedToTerms}>
                                {isProcessing ? 'Placing order...' : 'Place Order'}
                              </Button>
                            )
                          )}
                        </div>
                      </div>
                    )}

                  </div>
                </div>
              </div>

              {/* Order summary */}
              <div className="h-fit sticky top-32">
                <div className="p-6 border border-white/10 rounded-lg bg-white/5 space-y-4">
                  <h2 className="text-xl font-bold">Order Summary</h2>
                  
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {items.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="text-foreground/60">{item.name} x {item.quantity}</span>
                        <span className={item.isReservation ? 'text-foreground/50 italic' : ''}>
                          {item.isReservation ? 'Confirmed by phone' : `$${(item.price * item.quantity).toFixed(2)}`}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="h-px bg-white/10" />

                  <div className="space-y-2 text-sm">
                    {isReservationCart ? (
                      <>
                        <div className="flex justify-between">
                          <span className="text-foreground/60">Parts price</span>
                          <span className="text-foreground/50 italic">Confirmed by phone</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-foreground/60">{RESERVE_SHIPPING[deliveryMethod].label}</span>
                          <span className={shipping > 0 ? '' : 'text-green-400'}>${shipping.toFixed(2)}</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex justify-between">
                          <span className="text-foreground/60">Subtotal</span>
                          <span>${totalPrice.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-foreground/60">Shipping</span>
                          <span className={shipping > 0 ? '' : 'text-green-400'}>${shipping.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-foreground/60">Tax (8%)</span>
                          <span>${tax.toFixed(2)}</span>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="h-px bg-white/10" />

                  <div className="flex justify-between text-lg font-bold">
                    <span>{isReservationCart ? 'Due Today' : 'Total'}</span>
                    <span className="text-blue-400">${finalTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
        <BrandLogosSection />
      </main>
      <Footer />
    </>
  )
}
