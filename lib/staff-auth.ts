import 'server-only'
import { createHmac, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'
import { cookies } from 'next/headers'
import { pool } from '@/lib/db'

const scrypt = promisify(scryptCallback)
export const STAFF_COOKIE = 'auapw_staff_session'
const TTL_SECONDS = 60 * 60 * 8
export type StaffRole = 'sales_agent' | 'support_team' | 'developer_team'
export type StaffSession = { id: string; email: string; name: string; role: StaffRole; exp: number }

function secret() {
  return process.env.BETTER_AUTH_SECRET || process.env.ADMIN_SESSION_SECRET || null
}
export async function ensureStaffCredentialsTable() {
  await pool.query(`CREATE TABLE IF NOT EXISTS staff_credentials (
    staff_id TEXT PRIMARY KEY,
    password_hash TEXT NOT NULL,
    session_version INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`)
}
export async function hashStaffPassword(password: string) {
  const salt = randomBytes(16).toString('hex')
  const derived = (await scrypt(password, salt, 64)) as Buffer
  return `scrypt:${salt}:${derived.toString('hex')}`
}
export async function verifyStaffPassword(password: string, encoded: string) {
  const [algorithm, salt, digest] = encoded.split(':')
  if (algorithm !== 'scrypt' || !salt || !digest) return false
  const expected = Buffer.from(digest, 'hex')
  const actual = (await scrypt(password, salt, expected.length)) as Buffer
  return expected.length === actual.length && timingSafeEqual(expected, actual)
}
function signature(value: string, key: string) {
  return createHmac('sha256', key).update(value).digest('base64url')
}
export function createStaffToken(staff: Omit<StaffSession, 'exp'>, version: number) {
  const key = secret()
  if (!key) throw new Error('Staff session signing secret is not configured')
  const payload: StaffSession & { v: number } = { ...staff, exp: Math.floor(Date.now()/1000) + TTL_SECONDS, v: version }
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url')
  return { token: encoded + '.' + signature(encoded, key), maxAge: TTL_SECONDS }
}
export async function getStaffSession(): Promise<StaffSession | null> {
  const key = secret()
  const token = (await cookies()).get(STAFF_COOKIE)?.value
  if (!key || !token) return null
  const [encoded, supplied] = token.split('.')
  if (!encoded || !supplied) return null
  const expected = Buffer.from(signature(encoded, key))
  const got = Buffer.from(supplied)
  if (expected.length !== got.length || !timingSafeEqual(expected, got)) return null
  try {
    const data = JSON.parse(Buffer.from(encoded, 'base64url').toString()) as StaffSession & { v: number }
    if (!data.id || !data.email || !data.exp || data.exp <= Date.now()/1000) return null
    if (!['sales_agent','support_team','developer_team'].includes(data.role)) return null
    await ensureStaffCredentialsTable()
    const result = await pool.query(
      `SELECT s.email, s.name, s.role, s.status, c.session_version
       FROM staff_members s JOIN staff_credentials c ON c.staff_id = s.id WHERE s.id = $1`, [data.id])
    const row = result.rows[0]
    if (!row || row.status !== 'active' || row.email !== data.email || row.role !== data.role || Number(row.session_version) !== Number(data.v)) return null
    return { id: data.id, email: data.email, name: data.name, role: data.role, exp: data.exp }
  } catch { return null }
}
export function staffHome(role: StaffRole) {
  return role === 'sales_agent' ? '/staff/sales' : role === 'support_team' ? '/staff/support' : '/staff/developer'
}
