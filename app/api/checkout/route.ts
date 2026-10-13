import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { and, eq, inArray } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { stripe } from '@/lib/stripe'
import { db } from '@/lib/db'
import { listings } from '@/lib/db/schema'
import { z } from 'zod'

const CheckoutSchema = z.object({
  items: z.array(z.object({
    listingId: z.string().min(1),
    quantity: z.number().int().positive(),
  })).min(1),
  shippingAddress: z.string().optional(),
  billingAddress: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = CheckoutSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid checkout request' }, { status: 400 })
    }
    const { items } = parsed.data

    const quantities = new Map<string, number>()
    for (const item of items) {
      quantities.set(item.listingId, (quantities.get(item.listingId) ?? 0) + item.quantity)
    }

    const listingsData = await db
      .select()
      .from(listings)
      .where(and(inArray(listings.id, [...quantities.keys()]), eq(listings.status, 'active')))
    const listingsById = new Map<string, (typeof listingsData)[number]>()
    for (const listing of listingsData) listingsById.set(listing.id, listing)

    for (const [listingId, quantity] of quantities) {
      const listing = listingsById.get(listingId)
      if (!listing || listing.quantity < quantity) {
        return NextResponse.json({ error: 'One or more items are unavailable' }, { status: 422 })
      }
    }

    // Calculate total
    let subtotal = 0
    let lineItems: any[] = []

    for (const item of items) {
      const listing = listingsById.get(item.listingId)!
      const unitPrice = Number(listing.price)
      if (!Number.isFinite(unitPrice) || unitPrice < 0) {
        return NextResponse.json({ error: 'Invalid listing price' }, { status: 422 })
      }
      const itemTotal = unitPrice * item.quantity

      subtotal += itemTotal

      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: listing.title,
            metadata: {
              listingId: listing.id,
              sellerId: listing.sellerId,
            },
          },
          unit_amount: Math.round(unitPrice * 100),
        },
        quantity: item.quantity,
      })
    }

    // Add platform fee (5%) to line items for display
    const platformFee = subtotal * 0.05
    lineItems.push({
      price_data: {
        currency: 'usd',
        product_data: {
          name: 'Platform Fee (5%)',
          description: 'AUAPW Marketplace fee',
        },
        unit_amount: Math.round(platformFee * 100),
      },
      quantity: 1,
    })

    if (!stripe) {
      return NextResponse.json({ error: 'Payment processing unavailable' }, { status: 503 })
    }

    // Create Stripe Checkout Session
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_API_URL || process.env.VERCEL_URL}/buyer/orders?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_API_URL || process.env.VERCEL_URL}/cart?canceled=true`,
      metadata: {
        userId: session.user.id,
        itemCount: items.length,
      },
    })

    return NextResponse.json({ sessionId: checkoutSession.id, url: checkoutSession.url })
  } catch (error) {
    console.error('[v0] Checkout error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
