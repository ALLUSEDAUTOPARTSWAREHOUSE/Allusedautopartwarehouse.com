import { getAdminSession } from '@/lib/admin-auth'
import { pool } from '@/lib/db'
import { getFeedStats } from '@/lib/merchant'
export const dynamic = 'force-dynamic'
export async function GET() {
  if (!(await getAdminSession())) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const [catalog, uploads] = await Promise.allSettled([
    getFeedStats(),
    pool.query(`SELECT brand, count(*)::int AS records,
      count(*) FILTER (WHERE price IS NULL OR price <= 0)::int AS missing_prices,
      count(*) FILTER (WHERE image_url IS NULL OR btrim(image_url) = '')::int AS missing_images,
      count(*) FILTER (WHERE image_url IS NOT NULL AND btrim(image_url) <> '' AND image_url !~* '^https?://')::int AS invalid_image_urls
      FROM manual_products GROUP BY brand ORDER BY brand`),
  ])
  return Response.json({ checkedAt: new Date().toISOString(),
    catalog: catalog.status === 'fulfilled' ? catalog.value : null,
    uploads: uploads.status === 'fulfilled' ? uploads.value.rows : null,
    note: 'Uploaded-record counts include preserved archives. Image URL format is not a reachability check. Feed eligibility is not Google acceptance.',
  }, { headers: { 'Cache-Control': 'private, no-store' } })
}
