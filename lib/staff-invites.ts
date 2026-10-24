import 'server-only'
import { createHash, randomBytes } from 'node:crypto'
import { createElement } from 'react'
import StaffInviteEmail from '@/emails/staff-invite'
import { pool } from '@/lib/db'
import { emailFromAddress, sendReactEmail } from '@/lib/mailer'

const INVITE_TTL_HOURS = 72

function tokenDigest(token: string) {
  const secret = process.env.BETTER_AUTH_SECRET || process.env.ADMIN_SESSION_SECRET
  if (!secret) throw new Error('Staff invite signing secret is not configured')
  return createHash('sha256').update(`${token}:${secret}`).digest('hex')
}

export async function ensureStaffInvitesTable() {
  await pool.query(`CREATE TABLE IF NOT EXISTS staff_invites (
    id BIGSERIAL PRIMARY KEY,
    staff_id TEXT NOT NULL,
    token_hash TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    consumed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`)
  await pool.query('CREATE INDEX IF NOT EXISTS staff_invites_staff_idx ON staff_invites (staff_id, created_at DESC)')
}

export async function createStaffInvite(staffId: string) {
  await ensureStaffInvitesTable()
  await pool.query('UPDATE staff_invites SET consumed_at = NOW() WHERE staff_id = $1 AND consumed_at IS NULL', [staffId])
  const token = randomBytes(32).toString('base64url')
  await pool.query(
    `INSERT INTO staff_invites (staff_id, token_hash, expires_at) VALUES ($1, $2, NOW() + ($3 || ' hours')::interval)`,
    [staffId, tokenDigest(token), String(INVITE_TTL_HOURS)])
  return token
}

export async function consumeStaffInvite(token: string, staffId: string) {
  await ensureStaffInvitesTable()
  const result = await pool.query(
    `UPDATE staff_invites SET consumed_at = NOW()
     WHERE staff_id = $1 AND token_hash = $2
       AND consumed_at IS NULL AND expires_at > NOW()
     RETURNING id`,
    [staffId, tokenDigest(token)])
  return result.rows.length === 1
}

export async function sendStaffInviteEmail(params: { email: string; name: string; inviteUrl: string }) {
  const result = await sendReactEmail({
    from: process.env.ADMIN_RESET_FROM || emailFromAddress(),
    to: [params.email],
    subject: 'You are invited to the AUAPW team portal',
    react: createElement(StaffInviteEmail, {
      name: params.name,
      inviteUrl: params.inviteUrl,
      expiresHours: INVITE_TTL_HOURS,
    }),
  })
  if (!result.ok) {
    console.error('[staff-invites] Email provider rejected invite email', result.error)
    throw new Error('Unable to send the invitation email. Check the email provider configuration.')
  }
}
