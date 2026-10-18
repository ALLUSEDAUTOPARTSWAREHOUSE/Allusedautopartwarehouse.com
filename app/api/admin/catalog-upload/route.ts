import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { getAdminSession } from '@/lib/admin-auth'
import { isValidBrand } from '@/lib/brand-catalog'
import { pool } from '@/lib/db'
import { ensureCatalogUploads } from '@/lib/catalog-upload-records'
import { CATALOG_UPLOAD_TYPES, MAX_CATALOG_UPLOAD_BYTES, validCatalogUpload, validCatalogUploadPath } from '@/lib/catalog-upload-policy'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as HandleUploadBody | null
  if (!body || !['blob.generate-client-token', 'blob.upload-completed'].includes(body.type)) {
    return Response.json({ error: 'Invalid upload request.' }, { status: 400 })
  }
  // Completion callbacks have no browser session; handleUpload verifies their signature.
  if (body.type === 'blob.generate-client-token') {
    if (!(await getAdminSession())) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    if (request.headers.get('origin') !== new URL(request.url).origin) return Response.json({ error: 'Invalid origin' }, { status: 403 })
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN) return Response.json({ error: 'Private Blob storage is not configured.' }, { status: 503 })
  try {
    const result = await handleUpload({
      request, body,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const payload = JSON.parse(clientPayload || '{}')
        const brand = pathname.split('/')[1]
        if (!validCatalogUploadPath(pathname) || !isValidBrand(brand) || !validCatalogUpload(payload.name, payload.size)) throw new Error('Invalid catalog file')
        if (pathname.split('.').pop() !== payload.name.split('.').pop()?.toLowerCase()) throw new Error('File extension mismatch')
        await ensureCatalogUploads()
        await pool.query(`INSERT INTO catalog_staged_uploads (pathname, brand, original_name, expected_bytes)
          VALUES ($1, $2, $3, $4)`, [pathname, brand, payload.name.slice(0, 200), payload.size])
        return {
          allowedContentTypes: CATALOG_UPLOAD_TYPES,
          maximumSizeInBytes: MAX_CATALOG_UPLOAD_BYTES,
          validUntil: Date.now() + 60 * 60 * 1000,
          addRandomSuffix: false,
          tokenPayload: JSON.stringify({ pathname }),
        }
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        const payload = JSON.parse(tokenPayload || '{}')
        if (payload.pathname !== blob.pathname || !validCatalogUploadPath(blob.pathname)) throw new Error('Upload mismatch')
        await pool.query(`UPDATE catalog_staged_uploads SET blob_url = $2, status = 'uploaded', uploaded_at = NOW()
          WHERE pathname = $1 AND status = 'uploading'`, [blob.pathname, blob.url])
      },
    })
    return Response.json(result)
  } catch {
    return Response.json({ error: 'Upload authorization or confirmation failed. Check storage configuration and retry.' }, { status: 400 })
  }
}

export async function GET() {
  if (!(await getAdminSession())) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    await ensureCatalogUploads()
    const { rows } = await pool.query(`SELECT pathname, brand, original_name, expected_bytes, status, created_at
      FROM catalog_staged_uploads ORDER BY created_at DESC LIMIT 20`)
    return Response.json({ uploads: rows }, { headers: { 'Cache-Control': 'private, no-store' } })
  } catch {
    return Response.json({ error: 'Could not read staged uploads.' }, { status: 503 })
  }
}
