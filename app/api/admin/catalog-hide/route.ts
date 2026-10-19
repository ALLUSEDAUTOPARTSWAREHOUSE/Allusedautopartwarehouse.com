import { getAdminSession } from '@/lib/admin-auth'
import { pool } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export async function POST(request: Request) {
  if (!(await getAdminSession())) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  if (request.headers.get('origin') !== new URL(request.url).origin) return Response.json({ error: 'Invalid origin' }, { status: 403 })
  const body = await request.json().catch(() => null)
  if (body?.confirmation !== 'HIDE ALL PRODUCTS') return Response.json({ error: 'Type HIDE ALL PRODUCTS to confirm.' }, { status: 400 })
  try {
    // One atomic statement preserves catalog rows and unrelated override fields.
    const result = await pool.query(`INSERT INTO product_overrides (brand, slug, hidden, exclude_from_feed, updated_at)
      SELECT brand, slug, true, true, NOW() FROM manual_products
      ON CONFLICT (brand, slug) DO UPDATE SET hidden = true, exclude_from_feed = true, updated_at = NOW()
      RETURNING brand`)
    revalidatePath('/', 'layout')
    return Response.json({ affected: result.rowCount, message: 'Uploaded/manual records hidden and excluded from the local feed. Old bundled catalogs remain excluded by replacement mode. Records and order history are preserved. External account removal is not confirmed.' })
  } catch {
    return Response.json({ error: 'Could not confirm the hide operation. Refresh product visibility before retrying.' }, { status: 503 })
  }
}
