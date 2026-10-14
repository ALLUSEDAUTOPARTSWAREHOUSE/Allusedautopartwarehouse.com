import 'server-only'
import { createHash, createHmac, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto'
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
  await pool.query(`CREATE TABLE IF NOT EXISTS public.staff_credentials (
    staff_id TEXT PRIMARY KEY,
    password_hash TEXT NOT NULL,
    session_version INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  CREATE TABLE IF NOT EXISTS public.staff_login_attempts (
    bucket TEXT PRIMARY KEY,
    attempts INTEGER NOT NULL DEFAULT 0,
    window_started_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`)
}
export async function checkStaffLoginRateLimit(email: string, ip: string) {
  const emailKey = `email:${createHash('sha256').update(email).digest('hex')}`
  const ipKey = `ip:${createHash('sha256').update(ip).digest('hex')}`
  await pool.query("DELETE FROM public.staff_login_attempts WHERE window_started_at < now() - interval '1 day'")
  const { rows } = await pool.query(
    `INSERT INTO public.staff_login_attempts AS limits (bucket, attempts, window_started_at)
     SELECT bucket, 1, now() FROM unnest($1::text[]) AS source(bucket)
     ON CONFLICT (bucket) DO UPDATE SET
       attempts = CASE WHEN limits.window_started_at <= now() - interval '15 minutes' THEN 1 ELSE limits.attempts + 1 END,
       window_started_at = CASE WHEN limits.window_started_at <= now() - interval '15 minutes' THEN now() ELSE limits.window_started_at END
     RETURNING bucket, attempts`,
    [[emailKey, ipKey]],
  )
  const attempts = new Map(rows.map((row) => [row.bucket, Number(row.attempts)]))
  return (attempts.get(emailKey) ?? 0) <= 8 && (attempts.get(ipKey) ?? 0) <= 30
}
export async function hashStaffPassword(password: string) {
  const salt = randomBytes(16)
  const derived = (await scrypt(password, salt, 64)) as Buffer
  return `scrypt:${salt.toString('hex')}:${derived.toString('hex')}`
}
export async function verifyStaffPassword(password: string, encoded: string) {
  if (typeof encoded !== 'string') {
    await scrypt(password, Buffer.from('00112233445566778899aabbccddeeff', 'hex'), 64)
    return false
  }
  const [algorithm, salt, digest] = encoded.split(':')
  if (algorithm !== 'scrypt' || !salt || !digest || !/^[\da-f]{32}$/i.test(salt) || !/^[\da-f]{128}$/i.test(digest)) {
    await scrypt(password, Buffer.from('00112233445566778899aabbccddeeff', 'hex'), 64)
    return false
  }
  try {
    const expected = Buffer.from(digest, 'hex')
    const actual = (await scrypt(password, Buffer.from(salt, 'hex'), expected.length)) as Buffer
    return expected.length === actual.length && timingSafeEqual(expected, actual)
  } catch {
    return false
  }
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
