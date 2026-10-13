import "server-only"
import { randomUUID } from "crypto"
import { pool } from "@/lib/db"

export const QUOTE_STATUSES = ["new", "contacted", "quoted", "won", "lost"] as const
export const ORDER_STATUSES = [
  "pending",
  "reserved_pending_fitment",
  "confirmed",
  "paid",
  "shipped",
  "delivered",
  "cancelled",
] as const

export type QuoteStatus = (typeof QUOTE_STATUSES)[number]
export type OrderStatus = (typeof ORDER_STATUSES)[number]

export interface QuoteLead {
  id: number
  fullName: string
  phone: string
  email: string
  partType: string
  make: string | null
  model: string | null
  year: string | null
  partOption: string | null
  state: string | null
  zip: string | null
  notes: string | null
  source: string | null
  pageUrl: string | null
  status: string
  quoteAmount: number | null
  internalNotes: string | null
  createdAt: string
  updatedAt: string
}

export interface OrderLine {
  productId: string
  name: string
  make: string
  unitPrice: number
  quantity: number
  lineTotal: number
  url: string
}

export interface CustomerOrder {
  id: string
  orderNumber: string
  status: string
  customerName: string | null
  customerEmail: string | null
  customerPhone: string | null
  shippingAddress: string | null
  customerNotes: string | null
  internalNotes: string | null
  items: OrderLine[]
  subtotal: number
  tax: number
  shippingCost: number
  totalAmount: number
  paymentGateway: string | null
  stripeSessionId: string | null
  createdAt: string
  updatedAt: string
}

const toNumber = (v: unknown) => (v === null || v === undefined ? 0 : Number(v))
const toIso = (v: unknown) => (v instanceof Date ? v.toISOString() : String(v))

function mapLead(r: Record<string, unknown>): QuoteLead {
  return {
    id: Number(r.id),
    fullName: String(r.full_name),
    phone: String(r.phone),
    email: String(r.email ?? ""),
    partType: String(r.part_type),
    make: (r.make as string) ?? null,
    model: (r.model as string) ?? null,
    year: (r.year as string) ?? null,
    partOption: (r.part_option as string) ?? null,
    state: (r.state as string) ?? null,
    zip: (r.zip as string) ?? null,
    notes: (r.notes as string) ?? null,
    source: (r.source as string) ?? null,
    pageUrl: (r.page_url as string) ?? null,
    status: String(r.status),
    quoteAmount: r.quote_amount === null || r.quote_amount === undefined ? null : Number(r.quote_amount),
    internalNotes: (r.internal_notes as string) ?? null,
    createdAt: toIso(r.created_at),
    updatedAt: toIso(r.updated_at),
  }
}

function mapOrder(r: Record<string, unknown>): CustomerOrder {
  return {
    id: String(r.id),
    orderNumber: String(r.ordernumber),
    status: String(r.status),
    customerName: (r.customer_name as string) ?? null,
    customerEmail: (r.customer_email as string) ?? null,
    customerPhone: (r.customer_phone as string) ?? null,
    shippingAddress: (r.shippingaddress as string) ?? null,
    customerNotes: (r.customer_notes as string) ?? null,
    internalNotes: (r.internal_notes as string) ?? null,
    items: Array.isArray(r.items) ? (r.items as OrderLine[]) : [],
    subtotal: toNumber(r.subtotal),
    tax: toNumber(r.tax),
    shippingCost: toNumber(r.shippingcost),
    totalAmount: toNumber(r.totalamount),
    paymentGateway: (r.payment_gateway as string) ?? null,
    stripeSessionId: (r.stripe_session_id as string) ?? null,
    createdAt: toIso(r.createdat),
    updatedAt: toIso(r.updatedat),
  }
}

export interface NewQuoteInput {
  fullName: string
  phone: string
  email: string
  partType: string
  make: string
  model?: string
  year?: string
  partOption?: string
  state?: string
  zip?: string
  notes?: string
  source: string
  pageUrl?: string
}

export async function createQuoteLead(input: NewQuoteInput): Promise<QuoteLead> {
  const { rows } = await pool.query(
    `INSERT INTO public.leads
       (full_name, phone, email, part_type, make, model, year, part_option, state, zip, notes, source, page_url)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
     RETURNING *`,
    [
      input.fullName,
      input.phone,
      input.email,
      input.partType,
      input.make,
      input.model || null,
      input.year || null,
      input.partOption || null,
      input.state || null,
      input.zip || null,
      input.notes || null,
      input.source,
      input.pageUrl || null,
    ],
  )
  return mapLead(rows[0])
}

export interface NewOrderInput {
  customerName: string
  customerEmail: string
  customerPhone: string
  shippingAddress: string
  customerNotes?: string
  items: OrderLine[]
  subtotal: number
  tax: number
  shippingCost: number
  totalAmount: number
  paymentGateway?: string
  status?: OrderStatus
}

function makeOrderNumber() {
  const date = new Date().toISOString().slice(2, 10).replace(/-/g, "")
  const suffix = randomUUID().replace(/-/g, "").slice(0, 6).toUpperCase()
  return `AUA-${date}-${suffix}`
}

export async function createOrder(input: NewOrderInput): Promise<CustomerOrder> {
  const client = await pool.connect()
  try {
    await client.query("BEGIN")
    const id = randomUUID()
    const { rows } = await client.query(
      `INSERT INTO public.orders
         (id, userid, ordernumber, status, totalamount, subtotal, tax, shippingcost,
          shippingaddress, items, customer_name, customer_email, customer_phone, customer_notes, payment_gateway)
       VALUES ($1,'guest',$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10,$11,$12,$13,$14)
       RETURNING *`,
      [
        id,
        makeOrderNumber(),
        input.status ?? "pending",
        input.totalAmount,
        input.subtotal,
        input.tax,
        input.shippingCost,
        input.shippingAddress,
        JSON.stringify(input.items),
        input.customerName,
        input.customerEmail,
        input.customerPhone,
        input.customerNotes || null,
        input.paymentGateway || null,
      ],
    )
    for (const line of input.items) {
      await client.query(
        `INSERT INTO public.order_items (id, orderid, productid, quantity, unitprice, linetotal)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [randomUUID(), id, line.productId, line.quantity, line.unitPrice, line.lineTotal],
      )
    }
    await client.query("COMMIT")
    return mapOrder(rows[0])
  } catch (err) {
    await client.query("ROLLBACK")
    throw err
  } finally {
    client.release()
  }
}

/**
 * Records the Stripe Checkout Session id on a pending order so the
 * confirmation step can look the order back up by session id.
 */
export async function attachStripeSession(orderId: string, sessionId: string): Promise<void> {
  await pool.query(`UPDATE public.orders SET stripe_session_id = $2, updatedat = now() WHERE id = $1`, [
    orderId,
    sessionId,
  ])
}

export async function getOrderByStripeSession(sessionId: string): Promise<CustomerOrder | null> {
  const { rows } = await pool.query(`SELECT * FROM public.orders WHERE stripe_session_id = $1`, [sessionId])
  return rows[0] ? mapOrder(rows[0]) : null
}

/**
 * Marks an order paid after Stripe confirms the Checkout Session succeeded.
 * Returns null when it was already paid, so the browser confirmation, the
 * webhook and the daily reconcile can race without sending emails twice.
 */
export async function markOrderPaid(orderId: string): Promise<CustomerOrder | null> {
  const { rows } = await pool.query(
    `UPDATE public.orders SET status = 'paid', updatedat = now() WHERE id = $1 AND status <> 'paid' RETURNING *`,
    [orderId],
  )
  return rows[0] ? mapOrder(rows[0]) : null
}

/** Card orders still pending after their Stripe session was created, for the daily reconcile. */
export async function listUnconfirmedStripeSessions(olderThanMinutes: number, withinDays: number): Promise<string[]> {
  const { rows } = await pool.query(
    `SELECT stripe_session_id FROM public.orders
      WHERE status = 'pending' AND stripe_session_id IS NOT NULL
        AND createdat < now() - make_interval(mins => $1)
        AND createdat > now() - make_interval(days => $2)
      ORDER BY createdat`,
    [olderThanMinutes, withinDays],
  )
  return rows.map((r) => String(r.stripe_session_id))
}

export async function listQuoteLeads(status?: string, search?: string, limit = 300): Promise<QuoteLead[]> {
  const { rows } = await pool.query(
    `SELECT * FROM public.leads
     WHERE ($1::text IS NULL OR status = $1)
       AND ($2::text IS NULL OR full_name ILIKE $2 OR phone ILIKE $2 OR email ILIKE $2 OR make ILIKE $2 OR model ILIKE $2)
     ORDER BY created_at DESC
     LIMIT $3`,
    [status || null, search ? `%${search}%` : null, limit],
  )
  return rows.map(mapLead)
}

export async function listOrders(status?: string, search?: string, limit = 300): Promise<CustomerOrder[]> {
  const { rows } = await pool.query(
    `SELECT * FROM public.orders
     WHERE ($1::text IS NULL OR status = $1)
       AND ($2::text IS NULL OR ordernumber ILIKE $2 OR customer_name ILIKE $2 OR customer_phone ILIKE $2 OR customer_email ILIKE $2)
     ORDER BY createdat DESC
     LIMIT $3`,
    [status || null, search ? `%${search}%` : null, limit],
  )
  return rows.map(mapOrder)
}

export async function getOrderById(id: string): Promise<CustomerOrder | null> {
  const { rows } = await pool.query(`SELECT * FROM public.orders WHERE id = $1`, [id])
  return rows[0] ? mapOrder(rows[0]) : null
}

export async function getQuoteLeadById(id: number): Promise<QuoteLead | null> {
  const { rows } = await pool.query(`SELECT * FROM public.leads WHERE id = $1`, [id])
  return rows[0] ? mapLead(rows[0]) : null
}

export async function countByStatus(table: "leads" | "orders"): Promise<Record<string, number>> {
  const sql =
    table === "leads"
      ? `SELECT status, count(*)::int AS n FROM public.leads GROUP BY status`
      : `SELECT status, count(*)::int AS n FROM public.orders GROUP BY status`
  const { rows } = await pool.query(sql)
  return Object.fromEntries(rows.map((r) => [r.status, r.n]))
}

export async function updateQuoteLead(
  id: number,
  patch: { status: QuoteStatus; internalNotes: string; quoteAmount: number | null },
) {
  await pool.query(
    `UPDATE public.leads SET status = $2, internal_notes = $3, quote_amount = $4, updated_at = now() WHERE id = $1`,
    [id, patch.status, patch.internalNotes || null, patch.quoteAmount],
  )
}

export async function updateOrder(id: string, patch: { status: OrderStatus; internalNotes: string }) {
  await pool.query(
    `UPDATE public.orders SET status = $2, internal_notes = $3, updatedat = now() WHERE id = $1`,
    [id, patch.status, patch.internalNotes || null],
  )
}

/** Admin-only callers must authenticate before invoking this lookup. */
export async function getOrderByNumber(orderNumber: string): Promise<CustomerOrder | null> {
  const { rows } = await pool.query("SELECT * FROM public.orders WHERE ordernumber = $1 LIMIT 1", [orderNumber])
  return rows[0] ? mapOrder(rows[0]) : null
}
