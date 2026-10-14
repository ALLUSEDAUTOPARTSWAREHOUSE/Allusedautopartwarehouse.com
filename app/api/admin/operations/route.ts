import { NextRequest, NextResponse } from 'next/server'
import { desc, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { customers, listings, orders, user, vinQuotes } from '@/lib/db/schema'
import { getAdminSession } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

const quoteStatuses = ['pending', 'reviewed', 'quoted', 'converted', 'closed', 'rejected']
const orderStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']
const productStatuses = ['active', 'inactive', 'sold', 'delisted']

export async function GET() {
  if (!await getAdminSession()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const [quoteRows, orderRows, productRows, customerRows] = await Promise.all([
      db.select({
        id: vinQuotes.id, userId: vinQuotes.userId, vin: vinQuotes.vin, year: vinQuotes.year,
        make: vinQuotes.make, model: vinQuotes.model, trim: vinQuotes.trim, parts: vinQuotes.parts,
        status: vinQuotes.quoteStatus, createdAt: vinQuotes.createdAt, updatedAt: vinQuotes.updatedAt,
      }).from(vinQuotes).orderBy(desc(vinQuotes.createdAt)).limit(100),
      db.select({
        id: orders.id, userId: orders.userId, orderNumber: orders.orderNumber, status: orders.status,
        total: orders.total, paymentStatus: orders.paymentStatus, createdAt: orders.createdAt,
        updatedAt: orders.updatedAt,
      }).from(orders).orderBy(desc(orders.createdAt)).limit(100),
      db.select({
        id: listings.id, sku: listings.sku, title: listings.title, category: listings.category,
        price: listings.price, quantity: listings.quantity, status: listings.status,
        updatedAt: listings.updatedAt,
      }).from(listings).orderBy(desc(listings.updatedAt)).limit(100),
      db.select({
        id: user.id, userId: user.id, firstName: customers.firstName,
        lastName: customers.lastName, email: user.email, phone: customers.phone,
        businessName: customers.businessName, createdAt: user.createdAt,
      }).from(user).leftJoin(customers, eq(customers.userId, user.id))
        .where(eq(user.role, 'buyer')).orderBy(desc(user.createdAt)).limit(100),
    ])

    return NextResponse.json({
      quotes: quoteRows,
      orders: orderRows,
      products: productRows,
      customers: customerRows,
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
    const id = typeof body.id === 'string' ? body.id.trim() : ''
    const type = body.type
    if (!id) return NextResponse.json({ error: 'Record ID is required.' }, { status: 400 })

    if (type === 'quote') {
      const status = typeof body.status === 'string' ? body.status : ''
      if (!quoteStatuses.includes(status)) return NextResponse.json({ error: 'Invalid quote status.' }, { status: 400 })
      const [updated] = await db.update(vinQuotes).set({ quoteStatus: status, updatedAt: new Date() }).where(eq(vinQuotes.id, id)).returning({ id: vinQuotes.id })
      if (!updated) return NextResponse.json({ error: 'Quote not found.' }, { status: 404 })
      return NextResponse.json({ success: true })
    }

    if (type === 'order') {
      const status = typeof body.status === 'string' ? body.status : ''
      if (!orderStatuses.includes(status)) return NextResponse.json({ error: 'Invalid order status.' }, { status: 400 })
      const [updated] = await db.update(orders).set({ status, updatedAt: new Date() }).where(eq(orders.id, id)).returning({ id: orders.id })
      if (!updated) return NextResponse.json({ error: 'Order not found.' }, { status: 404 })
      return NextResponse.json({ success: true })
    }

    if (type === 'customer') {
      const userId = id
      const phone = typeof body.phone === 'string' ? body.phone.trim() : undefined
      const businessName = typeof body.businessName === 'string' ? body.businessName.trim() : undefined
      if ((phone !== undefined && phone.length > 40) || (businessName !== undefined && businessName.length > 200)) {
        return NextResponse.json({ error: 'Phone or business name is too long.' }, { status: 400 })
      }
      if (phone === undefined && businessName === undefined) {
        return NextResponse.json({ error: 'Provide a phone number or business name to update.' }, { status: 400 })
      }
      const [account] = await db.select({ email: user.email }).from(user).where(eq(user.id, userId)).limit(1)
      if (!account) return NextResponse.json({ error: 'Customer account not found.' }, { status: 404 })
      const updates: { phone?: string | null; businessName?: string | null; updatedAt: Date } = { updatedAt: new Date() }
      if (phone !== undefined) updates.phone = phone || null
      if (businessName !== undefined) updates.businessName = businessName || null
      await db.insert(customers).values({
        id: `customer_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        userId, email: account.email,
        phone: phone === undefined ? null : phone || null,
        businessName: businessName === undefined ? null : businessName || null,
      }).onConflictDoUpdate({
        target: customers.userId,
        set: updates,
      })
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
