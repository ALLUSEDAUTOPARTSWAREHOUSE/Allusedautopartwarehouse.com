import 'server-only'
import { createHash, randomBytes } from 'node:crypto'
import { pool } from '@/lib/db'

export const inviteDigest = (token: string) => createHash('sha256').update(token).digest('hex')

async function ensureTable() {
  await pool.query(`CREATE TABLE IF NOT EXISTS customer_invites (
    token_hash TEXT PRIMARY KEY, email TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL, consumed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`)
}

export async function createCustomerInvite(email: string) {
  await ensureTable()
  const token = randomBytes(32).toString('base64url')
  await pool.query(`INSERT INTO customer_invites (token_hash, email, expires_at)
    VALUES ($1, $2, NOW() + interval '72 hours')`, [inviteDigest(token), email.trim().toLowerCase()])
  return token
}

export async function consumeCustomerInvite(email: string, token: string | null | undefined) {
  if (!token || !/^[A-Za-z0-9_-]{43}$/.test(token)) return false
  await ensureTable()
  const result = await pool.query(`UPDATE customer_invites SET consumed_at = NOW()
    WHERE token_hash = $1 AND email = $2 AND consumed_at IS NULL AND expires_at > NOW()
    RETURNING token_hash`, [inviteDigest(token), email.trim().toLowerCase()])
  return result.rows.length === 1
}

export async function revokeCustomerInvite(token: string) {
  await pool.query('DELETE FROM customer_invites WHERE token_hash = $1', [inviteDigest(token)])
}
