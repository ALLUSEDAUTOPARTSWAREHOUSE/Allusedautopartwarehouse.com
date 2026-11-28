import 'server-only'
import { pool } from '@/lib/db'
import { getStaffSession } from '@/lib/staff-auth'
import type { CustomerSummary } from '@/lib/admin-customers'
import type { CustomerOrder, OrderLine, QuoteLead } from '@/lib/followup'

export type StaffOrder = Pick<CustomerOrder, 'id' | 'orderNumber' | 'status' | 'customerName' | 'customerEmail' | 'customerPhone' | 'shippingAddress' | 'items' | 'totalAmount' | 'emailVerifiedAt' | 'createdAt' | 'updatedAt'> & { itemsOmitted: number }
export type StaffQuote = Pick<QuoteLead, 'id' | 'fullName' | 'phone' | 'email' | 'partType' | 'make' | 'model' | 'year' | 'productName' | 'productUrl' | 'status' | 'quoteAmount' | 'notes' | 'createdAt' | 'updatedAt'>
const PAGE_SIZE = 50
const iso = (value: unknown) => value instanceof Date ? value.toISOString() : String(value ?? '')
const nullable = (value: unknown): string | null => value == null ? null : String(value)
const literalSearch = (value?: string) => value ? `%${value.replace(/[\\%_]/g, '\\$&')}%` : null
const safePath = (value: unknown): string | null => {
  if (typeof value !== 'string' || value.length > 1000 || !value.startsWith('/') || value.startsWith('//') || /[\\\u0000-\u0020]/.test(value) || value.includes('://')) return null
  const path = value.split(/[?#]/, 1)[0]
  try {
    const decoded = decodeURIComponent(path)
    if (decoded.startsWith('//') || /[\\\u0000-\u0020]/.test(decoded) || decoded.split('/').some(segment => segment === '.' || segment === '..')) return null
  } catch { return null }
  return path
}
const finite = (value: unknown) => (typeof value === 'number' || (typeof value === 'string' && value.trim())) && Number.isFinite(Number(value)) ? Number(value) : null
function projectItems(value: unknown): { items: OrderLine[]; itemsOmitted: number } {
  if (!Array.isArray(value)) return { items: [], itemsOmitted: value == null ? 0 : 1 }
  const items: OrderLine[] = []
  for (const candidate of value.slice(0, 200)) {
    if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) continue
    const item = candidate as Record<string, unknown>
    const quantity = finite(item.quantity), unitPrice = finite(item.unitPrice), lineTotal = finite(item.lineTotal)
    if (quantity === null || unitPrice === null || lineTotal === null) continue
    items.push({ productId: typeof item.productId === 'string' ? item.productId.slice(0, 300) : '', name: typeof item.name === 'string' ? item.name.slice(0, 250) : 'Auto part', make: typeof item.make === 'string' ? item.make.slice(0, 100) : '', quantity, unitPrice, lineTotal, url: safePath(item.url) || '/parts' })
  }
  return { items, itemsOmitted: value.length - items.length }
}

/** All three tabs use current server-side identity and SQL assignment scope before pagination.
 * No schema creation, global-list fallback, invoice token or verification token is involved. */
export async function getAssignedWorkspace(search?: string, requestedPage = 1) {
  const staff = await getStaffSession()
  if (!staff || !['sales_agent', 'support_team'].includes(staff.role)) throw new Error('An active sales or support session is required.')
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? Math.min(requestedPage, 10000) : 1
  const query = search?.trim().slice(0, 100)
  const scope = `JOIN public.followup_assignments a ON a.record_id = r.id::text
    JOIN public.staff_members s ON s.id = a.staff_id
    WHERE a.staff_id=$1 AND s.role=$2 AND s.email=$3 AND s.status='active'`
  const params = [staff.id, staff.role, staff.email, literalSearch(query), PAGE_SIZE + 1, (page - 1) * PAGE_SIZE]
  const [orderRows, quoteRows, customerRows] = await Promise.all([
    pool.query(`SELECT r.id,r.ordernumber,r.status,r.customer_name,r.customer_email,r.customer_phone,
        r.shippingaddress,r.items,r.totalamount,r.email_verified_at,r.createdat,r.updatedat
      FROM public.orders r ${scope} AND a.record_type='order'
        AND ($4::text IS NULL OR r.ordernumber ILIKE $4 OR r.customer_name ILIKE $4 OR r.customer_email ILIKE $4 OR r.customer_phone ILIKE $4 OR r.items::text ILIKE $4)
      ORDER BY r.updatedat DESC NULLS LAST,r.id LIMIT $5 OFFSET $6`, params),
    pool.query(`SELECT r.id,r.full_name,r.phone,r.email,r.part_type,r.make,r.model,r.year,r.product_name,r.product_url,r.status,r.quote_amount,r.notes,r.created_at,r.updated_at
      FROM public.leads r ${scope} AND a.record_type='quote'
        AND ($4::text IS NULL OR r.id::text ILIKE $4 OR r.full_name ILIKE $4 OR r.email ILIKE $4 OR r.phone ILIKE $4 OR r.make ILIKE $4 OR r.model ILIKE $4 OR r.part_type ILIKE $4 OR r.product_name ILIKE $4)
      ORDER BY r.updated_at DESC NULLS LAST,r.id LIMIT $5 OFFSET $6`, params),
    pool.query(`WITH assigned AS (
      SELECT 'order' AS type,r.id::text AS id,r.customer_name AS name,r.customer_email AS email,r.customer_phone AS phone,r.status,r.totalamount AS amount,r.updatedat::timestamptz AS updated
        FROM public.orders r ${scope} AND a.record_type='order'
      UNION ALL
      SELECT 'quote' AS type,r.id::text AS id,r.full_name AS name,r.email,r.phone,r.status,0 AS amount,r.updated_at::timestamptz AS updated
        FROM public.leads r ${scope} AND a.record_type='quote'
    ), keyed AS (
      SELECT *,coalesce(nullif(lower(trim(email)),''),nullif(regexp_replace(coalesce(phone,''),'[^0-9]','','g'),''),type||':'||id) AS customer_key FROM assigned
    ), customers AS (
      SELECT customer_key AS key,max(name) AS name,max(email) AS email,max(phone) AS phone,
        count(*) FILTER(WHERE type='order')::int AS orders,
        coalesce(sum(amount) FILTER(WHERE type='order' AND status IN ('paid','shipped','delivered')),0) AS paid_total,
        count(*) FILTER(WHERE type='quote')::int AS quotes,
        count(*) FILTER(WHERE type='quote' AND status='won')::int AS quotes_won,max(updated) AS last_activity
      FROM keyed GROUP BY customer_key
    ) SELECT * FROM customers WHERE ($4::text IS NULL OR name ILIKE $4 OR email ILIKE $4 OR phone ILIKE $4)
      ORDER BY last_activity DESC NULLS LAST,key LIMIT $5 OFFSET $6`, params),
  ])
  const orders: StaffOrder[] = orderRows.rows.slice(0, PAGE_SIZE).map(r => ({
    id: String(r.id), orderNumber: String(r.ordernumber), status: String(r.status), customerName: nullable(r.customer_name), customerEmail: nullable(r.customer_email), customerPhone: nullable(r.customer_phone), shippingAddress: nullable(r.shippingaddress), ...projectItems(r.items), totalAmount: Number(r.totalamount), emailVerifiedAt: r.email_verified_at ? iso(r.email_verified_at) : null, createdAt: iso(r.createdat), updatedAt: iso(r.updatedat),
  }))
  const quotes: StaffQuote[] = quoteRows.rows.slice(0, PAGE_SIZE).map(r => ({
    id: Number(r.id), fullName: String(r.full_name), phone: String(r.phone ?? ''), email: String(r.email ?? ''), partType: String(r.part_type), make: nullable(r.make), model: nullable(r.model), year: nullable(r.year), productName: nullable(r.product_name), productUrl: safePath(r.product_url), status: String(r.status), quoteAmount: r.quote_amount == null ? null : Number(r.quote_amount), notes: nullable(r.notes), createdAt: iso(r.created_at), updatedAt: iso(r.updated_at),
  }))
  const customers: CustomerSummary[] = customerRows.rows.slice(0, PAGE_SIZE).map(r => ({
    key: String(r.key), name: String(r.name ?? ''), email: nullable(r.email), phone: nullable(r.phone), orders: Number(r.orders), paidTotal: Number(r.paid_total), quotes: Number(r.quotes), quotesWon: Number(r.quotes_won), lastActivity: r.last_activity ? iso(r.last_activity) : null,
  }))
  return { orders, quotes, customers, page, pageSize: PAGE_SIZE, checkedAt: new Date().toISOString(), hasMore: { orders: orderRows.rows.length > PAGE_SIZE, quotes: quoteRows.rows.length > PAGE_SIZE, customers: customerRows.rows.length > PAGE_SIZE } }
}
