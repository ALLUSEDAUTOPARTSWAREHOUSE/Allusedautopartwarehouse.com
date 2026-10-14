import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { pool } from '@/lib/db'
import { getAdminSession } from '@/lib/admin-auth'
import { listOrders, listQuoteLeads } from '@/lib/followup'
import { ORDER_STATUSES, QUOTE_STATUSES } from '@/lib/followup-statuses'
import { getBrandProductBySlug, isValidBrand } from '@/lib/brand-catalog'
import { primeManualOverlay } from '@/lib/manual-products'
import { AVAILABILITY_OPTIONS, getProductOverride, searchProductsForAdmin, upsertOverride } from '@/lib/merchant'

export const dynamic = 'force-dynamic'

export async function GET() {
  if (!await getAdminSession()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const [quotes, orders, productSearch, customerResult] = await Promise.all([
      listQuoteLeads(undefined, undefined, 100),
      listOrders(undefined, undefined, 100),
      searchProductsForAdmin({ limit: 100 }),
      pool.query(`
        SELECT id, email, name, phone, created_at FROM (
          SELECT DISTINCT ON (lower(email))
            lower(email) AS id, email, customer_name AS name, customer_phone AS phone, created_at
          FROM (
            SELECT email, full_name AS customer_name, phone AS customer_phone, created_at FROM public.leads
            UNION ALL
            SELECT customer_email AS email, customer_name, customer_phone, createdat AS created_at FROM public.orders
          ) activity
          WHERE NULLIF(trim(email), '') IS NOT NULL
          ORDER BY lower(email), created_at DESC
        ) recent_customers
        ORDER BY created_at DESC
        LIMIT 100
      `),
    ])
    const customers = customerResult.rows.map(row => ({
      id: row.id,
      email: row.email,
      name: row.name,
      phone: row.phone,
      createdAt: row.created_at,
    }))
    const products = productSearch.hits.map(hit => ({
      id: `${hit.brand}/${hit.slug}`,
      brand: hit.brand,
      slug: hit.slug,
      title: hit.effective.title,
      category: hit.brandLabel,
      price: hit.effective.price,
      availability: hit.override?.availability ?? 'in_stock',
      hidden: hit.override?.hidden ?? false,
      updatedAt: hit.override?.updatedAt ?? '',
    }))

    return NextResponse.json({
      quotes: quotes.map(quote => ({ ...quote, id: String(quote.id) })),
      orders,
      products,
      customers,
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
      const quoteId = Number(id)
      if (!QUOTE_STATUSES.includes(status as (typeof QUOTE_STATUSES)[number])) {
        return NextResponse.json({ error: 'Invalid quote status.' }, { status: 400 })
      }
      if (!/^\d+$/.test(id) || !Number.isSafeInteger(quoteId) || quoteId <= 0) {
        return NextResponse.json({ error: 'Quote not found.' }, { status: 404 })
      }
      const result = await pool.query(
        'UPDATE public.leads SET status = $2, updated_at = now() WHERE id = $1',
        [quoteId, status],
      )
      if (!result.rowCount) return NextResponse.json({ error: 'Quote not found.' }, { status: 404 })
      return NextResponse.json({ success: true })
    }

    if (type === 'order') {
      const status = typeof body.status === 'string' ? body.status : ''
      if (!ORDER_STATUSES.includes(status as (typeof ORDER_STATUSES)[number])) {
        return NextResponse.json({ error: 'Invalid order status.' }, { status: 400 })
      }
      const result = await pool.query(
        'UPDATE public.orders SET status = $2, updatedat = now() WHERE id = $1',
        [id, status],
      )
      if (!result.rowCount) return NextResponse.json({ error: 'Order not found.' }, { status: 404 })
      return NextResponse.json({ success: true })
    }

    if (type === 'product') {
      const [brand, slug, ...extra] = id.split('/')
      if (extra.length || !isValidBrand(brand) || !slug) {
        return NextResponse.json({ error: 'Product not found.' }, { status: 404 })
      }
      await primeManualOverlay(brand)
      const product = getBrandProductBySlug(brand, slug)
      if (!product) return NextResponse.json({ error: 'Product not found.' }, { status: 404 })

      const priceProvided = body.price !== undefined
      const availabilityProvided = body.availability !== undefined
      const hiddenProvided = body.hidden !== undefined
      const price = body.price === null || body.price === '' ? null : Number(body.price)
      if (priceProvided && price !== null && (!Number.isFinite(price) || price < 0 || price > 99999999)) {
        return NextResponse.json({ error: 'Enter a valid non-negative price.' }, { status: 400 })
      }
      if (availabilityProvided && (typeof body.availability !== 'string' || !AVAILABILITY_OPTIONS.includes(body.availability as (typeof AVAILABILITY_OPTIONS)[number]))) {
        return NextResponse.json({ error: 'Invalid product availability.' }, { status: 400 })
      }
      if (hiddenProvided && typeof body.hidden !== 'boolean') {
        return NextResponse.json({ error: 'Invalid product visibility.' }, { status: 400 })
      }
      if (!priceProvided && !availabilityProvided && !hiddenProvided) {
        return NextResponse.json({ error: 'No product changes supplied.' }, { status: 400 })
      }

      const current = await getProductOverride(brand, slug)
      await upsertOverride(brand, slug, {
        title: current?.title ?? null,
        description: current?.description ?? null,
        price: priceProvided ? price : current?.price ?? null,
        imageUrl: current?.imageUrl ?? null,
        availability: availabilityProvided ? body.availability : current?.availability ?? null,
        hidden: hiddenProvided ? body.hidden : current?.hidden ?? false,
        excludeFromFeed: current?.excludeFromFeed ?? false,
        notes: current?.notes ?? null,
      })
      revalidatePath(`/brands/${brand}`)
      revalidatePath(`/brands/${brand}`, 'layout')
      revalidatePath('/admin/products')
      revalidatePath('/feeds/google-shopping.xml')
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Unsupported record type.' }, { status: 400 })
  } catch (error) {
    console.error('[admin/operations] Failed to update operational record', error)
    return NextResponse.json({ error: 'Could not save this change.' }, { status: 500 })
  }
}
