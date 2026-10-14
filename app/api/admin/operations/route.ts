import { NextRequest, NextResponse } from 'next/server'
import { desc, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { listings } from '@/lib/db/schema'
import { getAdminSession } from '@/lib/admin-auth'
import { countByStatus, getOrderById, getQuoteLeadById, listOrders, listQuoteLeads, updateOrder, updateQuoteLead, QUOTE_STATUSES, ORDER_STATUSES } from '@/lib/followup'
import { listCustomers } from '@/lib/admin-customers'

export const dynamic = 'force-dynamic'
const productStatuses = ['active', 'inactive', 'sold', 'delisted']

export async function GET() {
  if (!await getAdminSession()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const [quotes, orders, products, customers, quoteCounts, orderCounts] = await Promise.all([
      listQuoteLeads(undefined, undefined, 100),
      listOrders(undefined, undefined, 100),
      db.select({
        id: listings.id, sku: listings.sku, title: listings.title, category: listings.category,
        price: listings.price, quantity: listings.quantity, status: listings.status,
        updatedAt: listings.updatedAt,
      }).from(listings).orderBy(desc(listings.updatedAt)).limit(100),
      listCustomers(undefined, 100),
      countByStatus('leads'),
      countByStatus('orders'),
    ])
    return NextResponse.json({
      quotes, orders, products, customers, quoteCounts, orderCounts,
      limits: { rowsPerSection: 100 },
    })
  } catch (error) {
    console.error('[admin/operations] Failed to load operational records', error)
    return NextResponse.json({ error: 'Could not load operations data. Check the database connection and schema.' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  if (!await getAdminSession()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await request.json()
    const id = typeof body.id === 'string' || typeof body.id === 'number' ? String(body.id).trim() : ''
    const type = body.type
    if (!id) return NextResponse.json({ error: 'Record ID is required.' }, { status: 400 })

    if (type === 'quote') {
      const status = typeof body.status === 'string' ? body.status : ''
      if (!QUOTE_STATUSES.includes(status as typeof QUOTE_STATUSES[number])) return NextResponse.json({ error: 'Invalid quote status.' }, { status: 400 })
      const amountRaw = body.quoteAmount
      let quoteAmount: number | null | undefined
      if (amountRaw !== undefined) {
        if (amountRaw === null || amountRaw === '') quoteAmount = null
        else {
          const parsed = Number(amountRaw)
          if (!Number.isFinite(parsed) || parsed < 0 || parsed > 99999999) return NextResponse.json({ error: 'Enter a valid non-negative quote amount.' }, { status: 400 })
          quoteAmount = Math.round(parsed * 100) / 100
        }
      }
      const internalNotes = typeof body.internalNotes === 'string' ? body.internalNotes.trim().slice(0, 5000) : ''
      const existing = await getQuoteLeadById(Number(id))
      if (!existing) return NextResponse.json({ error: 'Quote request not found.' }, { status: 404 })
      await updateQuoteLead(Number(id), {
        status: status as typeof QUOTE_STATUSES[number],
        internalNotes: body.internalNotes === undefined ? existing.internalNotes ?? '' : internalNotes,
        quoteAmount: quoteAmount === undefined ? existing.quoteAmount : quoteAmount,
      })
      return NextResponse.json({ success: true })
    }

    if (type === 'order') {
      const status = typeof body.status === 'string' ? body.status : ''
      if (!ORDER_STATUSES.includes(status as typeof ORDER_STATUSES[number])) return NextResponse.json({ error: 'Invalid order status.' }, { status: 400 })
      const existing = await getOrderById(id)
      if (!existing) return NextResponse.json({ error: 'Order not found.' }, { status: 404 })
      const internalNotes = typeof body.internalNotes === 'string' ? body.internalNotes.trim().slice(0, 5000) : existing.internalNotes ?? ''
      await updateOrder(id, { status: status as typeof ORDER_STATUSES[number], internalNotes })
      return NextResponse.json({ success: true })
    }

    if (type === 'product') {
      const updates: { status?: string; price?: string; quantity?: number; updatedAt: Date } = { updatedAt: new Date() }
      if (body.status !== undefined) {
        if (typeof body.status !== 'string' || !productStatuses.includes(body.status)) return NextResponse.json({ error: 'Invalid product status.' }, { status: 400 })
        updates.status = body.status
      }
      if (body.price !== undefined) {
        const price = Number(body.price)
        if (!Number.isFinite(price) || price < 0 || price > 99999999) return NextResponse.json({ error: 'Enter a valid non-negative price.' }, { status: 400 })
        updates.price = price.toFixed(2)
      }
      if (body.quantity !== undefined) {
        const quantity = Number(body.quantity)
        if (!Number.isInteger(quantity) || quantity < 0 || quantity > 10000000) return NextResponse.json({ error: 'Enter a valid non-negative whole-number quantity.' }, { status: 400 })
        updates.quantity = quantity
      }
      if (Object.keys(updates).length === 1) return NextResponse.json({ error: 'No product changes supplied.' }, { status: 400 })
      const [updated] = await db.update(listings).set(updates).where(eq(listings.id, id)).returning({ id: listings.id })
      if (!updated) return NextResponse.json({ error: 'Product not found.' }, { status: 404 })
      return NextResponse.json({ success: true })
    }
    return NextResponse.json({ error: 'Unsupported record type.' }, { status: 400 })
  } catch (error) {
    console.error('[admin/operations] Failed to update operational record', error)
    return NextResponse.json({ error: 'Could not save this change.' }, { status: 500 })
  }
}
