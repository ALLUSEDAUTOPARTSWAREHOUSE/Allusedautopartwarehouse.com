import 'server-only'
import { pool } from '@/lib/db'
import { isValidBrand } from '@/lib/brand-catalog'
import { isReplacementUpload, UPLOADED_ONLY_CATALOG } from '@/lib/catalog-reset-policy'

export async function resolveUploadedProductLink(slug: string): Promise<string | null> {
  if (!/^[a-z0-9-]{1,500}$/i.test(slug)) return null
  const { rows } = await pool.query(`SELECT m.brand, m.slug, m.source, m.updated_at
    FROM manual_products m
    LEFT JOIN product_overrides o ON o.brand = m.brand AND o.slug = m.slug
    WHERE m.slug = $1 AND COALESCE(o.hidden, false) = false LIMIT 2`, [slug])
  const matches = rows.filter(row => isValidBrand(row.brand) && (!UPLOADED_ONLY_CATALOG || isReplacementUpload({ source: row.source, updatedAt: new Date(row.updated_at).toISOString() })))
  if (matches.length !== 1) return null
  return `/brands/${matches[0].brand}/${matches[0].slug}`
}
