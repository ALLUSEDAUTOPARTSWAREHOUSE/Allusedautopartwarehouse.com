import { get } from '@vercel/blob'
import { revalidatePath } from 'next/cache'
import { getAdminSession } from '@/lib/admin-auth'
import { ensureCatalogUploads } from '@/lib/catalog-upload-records'
import { validCatalogUploadPath } from '@/lib/catalog-upload-policy'
import { importProductSheet } from '@/lib/manual-products'
import { BRAND_DIRECTORY, isValidBrand } from '@/lib/brand-catalog'
import { pool } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Keep synchronous imports bounded. Larger staged files must be split into smaller workbooks.
const MAX_IMPORT_BYTES = 20 * 1024 * 1024

export async function POST(request: Request) {
  if (!(await getAdminSession())) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json().catch(() => null) as { pathname?: unknown; action?: unknown; confirm?: unknown } | null
  const pathname = typeof body?.pathname === 'string' ? body.pathname : ''
  const action = body?.action
  if (!validCatalogUploadPath(pathname) || !['preview', 'import'].includes(String(action))) {
    return Response.json({ error: 'Choose a valid staged file and action.' }, { status: 400 })
  }
  if (action === 'import' && body?.confirm !== true) {
    return Response.json({ error: 'Confirm the import before saving products.' }, { status: 400 })
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return Response.json({ error: 'Private file storage is not configured. No products were changed.' }, { status: 503 })
  }

  try {
    await ensureCatalogUploads()
    const { rows } = await pool.query<{ pathname: string; brand: string; status: string; expected_bytes: string }>(
      'SELECT pathname, brand, status, expected_bytes FROM catalog_staged_uploads WHERE pathname = $1 LIMIT 1',
      [pathname],
    )
    const staged = rows[0]
    if (!staged || staged.status !== 'uploaded') {
      return Response.json({ error: 'This file is not available for import. Refresh the upload list and check its status.' }, { status: 409 })
    }
    if (!isValidBrand(staged.brand) || pathname.split('/')[1] !== staged.brand) {
      return Response.json({ error: 'The staged file brand does not match its storage path.' }, { status: 400 })
    }
    const size = Number(staged.expected_bytes)
    if (!Number.isSafeInteger(size) || size < 1 || size > MAX_IMPORT_BYTES) {
      return Response.json({ error: 'This synchronous importer supports files up to 20 MB. Split this workbook into smaller files; the staged original is preserved.' }, { status: 413 })
    }

    const blob = await get(pathname, { access: 'private' })
    if (!blob || blob.statusCode !== 200 || !blob.stream) {
      return Response.json({ error: 'The staged file could not be read from private storage. No products were changed.' }, { status: 404 })
    }
    const bytes = Buffer.from(await new Response(blob.stream).arrayBuffer())
    if (bytes.length !== size) {
      return Response.json({ error: 'The stored file size does not match its upload record. No products were changed.' }, { status: 409 })
    }

    const dryRun = action === 'preview'
    const result = await importProductSheet(staged.brand, bytes, 'all', dryRun)
    if (dryRun) {
      return Response.json({ ok: true, preview: true, brand: staged.brand, ...result, message: 'Preview complete. Nothing was saved. Confirm import only after reviewing the counts.' })
    }
    if (result.inserted === 0) {
      return Response.json({ error: 'No usable product rows were found. Nothing was imported.' }, { status: 422 })
    }

    await pool.query("UPDATE catalog_staged_uploads SET status = 'imported' WHERE pathname = $1 AND status = 'uploaded'", [pathname])
    revalidatePath('/admin/uploads')
    revalidatePath('/admin/merchant')
    revalidatePath('/admin/products')
    revalidatePath('/feeds/google-shopping.xml')
    for (const brand of BRAND_DIRECTORY) revalidatePath('/brands/' + brand.slug, 'layout')
    return Response.json({ ok: true, preview: false, brand: staged.brand, ...result, message: `Imported ${result.inserted} rows. ${result.skipped} rows skipped; ${result.missingPrices} rows have no valid price. Website and feed caches were revalidated. This does not submit products to Google Merchant or OpenAI Ads.` })
  } catch (error) {
    const reason = error as { message?: string; code?: string }
    const message = reason.message === 'INVALID_WORKBOOK' ? 'The staged file is not a readable Excel/CSV workbook.'
      : reason.message === 'NO_PRODUCT_SHEET' ? 'No product sheet found. Include a Name, name, or Product Name column.'
      : reason.message === 'BRAND_MISMATCH' ? 'The workbook contains rows for another brand. Nothing was saved.'
      : reason.message === 'DUPLICATE_PRODUCTS' ? 'Duplicate product identities found. Give each product a unique Product URL or name; nothing was saved.'
      : reason.code === '42P01' ? 'A catalog database table is missing. No products were saved.'
      : 'Import failed. The database transaction was rolled back; refresh the upload list and retry.'
    return Response.json({ error: message }, { status: 422 })
  }
}
