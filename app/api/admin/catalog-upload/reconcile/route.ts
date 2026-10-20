import { head } from '@vercel/blob'
import { getAdminSession } from '@/lib/admin-auth'
import { pool } from '@/lib/db'
import { validCatalogUploadPath } from '@/lib/catalog-upload-policy'

export const runtime = 'nodejs'

/** Recover a missed completion callback only after storage confirms the exact file. */
export async function POST(request: Request) {
  if (!(await getAdminSession())) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  if (request.headers.get('origin') !== new URL(request.url).origin) return Response.json({ error: 'Invalid origin' }, { status: 403 })
  const body = await request.json().catch(() => null)
  const pathname = typeof body?.pathname === 'string' ? body.pathname : ''
  if (!validCatalogUploadPath(pathname)) return Response.json({ error: 'Invalid staged file.' }, { status: 400 })
  if (!(process.env.CATALOG_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN)) return Response.json({ error: 'Private file storage is not configured.' }, { status: 503 })
  try {
    const { rows } = await pool.query<{ brand: string; expected_bytes: string; status: string }>(
      'SELECT brand, expected_bytes, status FROM catalog_staged_uploads WHERE pathname = $1', [pathname],
    )
    const staged = rows[0]
    if (!staged || staged.brand !== pathname.split('/')[1]) return Response.json({ error: 'Staged file not found.' }, { status: 404 })
    if (staged.status !== 'uploading') return Response.json({ ok: true, message: 'File status is already confirmed. Refresh the list.' })
    const blob = await head(pathname, { token: process.env.CATALOG_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN })
    if (blob.pathname !== pathname || blob.size !== Number(staged.expected_bytes)) {
      return Response.json({ error: 'Storage has not confirmed a complete matching file. Nothing was imported.' }, { status: 409 })
    }
    await pool.query("UPDATE catalog_staged_uploads SET blob_url = $2, status = 'uploaded', uploaded_at = NOW() WHERE pathname = $1 AND status = 'uploading'", [pathname, blob.url])
    return Response.json({ ok: true, message: 'Stored file verified. Preview the rows before importing. No products were changed.' })
  } catch {
    return Response.json({ error: 'Could not verify the stored file. It may be incomplete or storage may be unavailable. No products were changed.' }, { status: 503 })
  }
}
