import 'server-only'
import { pool } from '@/lib/db'

export async function ensureCatalogUploads() {
  await pool.query(`CREATE TABLE IF NOT EXISTS catalog_staged_uploads (
    pathname TEXT PRIMARY KEY, brand TEXT NOT NULL, original_name TEXT NOT NULL,
    expected_bytes BIGINT NOT NULL, blob_url TEXT,
    status TEXT NOT NULL DEFAULT 'uploading', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    uploaded_at TIMESTAMPTZ
  )`)
}
