import { auth } from '@/lib/auth'
import { pool } from '@/lib/db'

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session?.user?.id) return Response.json({ error: 'Please sign in to view your orders.' }, { status: 401 })
  const orderNumber = new URL(request.url).searchParams.get('orderNumber')?.trim()
  if (!orderNumber || orderNumber.length > 100) return Response.json({ error: 'Enter a valid order number.' }, { status: 400 })
  try {
    // Never match by a supplied email, and never expose unclaimed guest orders.
    const { rows } = await pool.query(
      'SELECT ordernumber, status, createdat FROM public.orders WHERE ordernumber = $1 AND userid = $2 AND userid <> $3 LIMIT 1',
      [orderNumber, session.user.id, 'guest'],
    )
    if (!rows[0]) return Response.json({ error: 'No order linked to your account was found. For guest purchases, contact support for verification.' }, { status: 404 })
    return Response.json({ orderNumber: rows[0].ordernumber, status: rows[0].status, createdAt: rows[0].createdat }, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch {
    return Response.json({ error: 'Order status is temporarily unavailable.' }, { status: 503 })
  }
}
