import "server-only"
import { randomBytes, scrypt as scryptCallback, timingSafeEqual, createHash } from "crypto"
import { promisify } from "util"
import { pool } from "@/lib/db"

const scrypt = promisify(scryptCallback) as (password: string, salt: Buffer, keylen: number) => Promise<Buffer>

export async function ensurePasswordTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS public.admin_security_settings (
      id integer PRIMARY KEY CHECK (id = 1),
      password_hash text,
      session_version integer NOT NULL DEFAULT 0,
      updated_at timestamptz NOT NULL DEFAULT now()
    );
    INSERT INTO public.admin_security_settings (id, session_version)
      VALUES (1, 0) ON CONFLICT (id) DO NOTHING;
    CREATE TABLE IF NOT EXISTS public.staff_credentials (
      staff_id text PRIMARY KEY,
      password_hash text NOT NULL,
      session_version integer NOT NULL DEFAULT 0,
      updated_at timestamptz NOT NULL DEFAULT now()
    );
  `)
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16)
  const key = await scrypt(password, salt, 64)
  return `scrypt:${salt.toString("hex")}:${key.toString("hex")}`
}

export async function verifyPassword(password: string, encoded: string): Promise<boolean> {
  const [scheme, saltHex, keyHex] = encoded.split(":")
  if (scheme !== "scrypt" || !saltHex || !keyHex) return false
  try {
    const expected = Buffer.from(keyHex, "hex")
    const actual = await scrypt(password, Buffer.from(saltHex, "hex"), expected.length)
    return actual.length === expected.length && timingSafeEqual(actual, expected)
  } catch { return false }
}

function constantTimeTextEqual(a: string, b: string): boolean {
  const aa = createHash("sha256").update(a).digest()
  const bb = createHash("sha256").update(b).digest()
  return timingSafeEqual(aa, bb)
}

export async function getAdminSecurityState(): Promise<{ passwordHash: string | null; sessionVersion: number }> {
  await ensurePasswordTables()
  const result = await pool.query("SELECT password_hash, session_version FROM public.admin_security_settings WHERE id = 1")
  return {
    passwordHash: result.rows[0]?.password_hash ?? null,
    sessionVersion: Number(result.rows[0]?.session_version ?? 0),
  }
}

export async function verifyCurrentAdminPassword(password: string): Promise<boolean> {
  const state = await getAdminSecurityState()
  if (state.passwordHash) return verifyPassword(password, state.passwordHash)
  const configured = process.env.ADMIN_PASSWORD || ""
  return Boolean(configured) && constantTimeTextEqual(password, configured)
}

export async function saveAdminPassword(password: string): Promise<number> {
  const passwordHash = await hashPassword(password)
  await ensurePasswordTables()
  const result = await pool.query(
    `INSERT INTO public.admin_security_settings (id, password_hash, session_version, updated_at)
     VALUES (1, $1, 1, now())
     ON CONFLICT (id) DO UPDATE SET password_hash = EXCLUDED.password_hash,
       session_version = public.admin_security_settings.session_version + 1, updated_at = now()
     RETURNING session_version`,
    [passwordHash],
  )
  return Number(result.rows[0].session_version)
}

export async function getAdminSessionVersion(): Promise<number> {
  return (await getAdminSecurityState()).sessionVersion
}

export async function listStaffPasswordStates() {
  await ensurePasswordTables()
  const result = await pool.query(`
    SELECT s.id, s.name, s.email, s.role, s.status,
      (c.staff_id IS NOT NULL) AS has_password,
      c.updated_at AS password_updated_at
    FROM public.staff_members s
    LEFT JOIN public.staff_credentials c ON c.staff_id = s.id
    ORDER BY s.name ASC
  `)
  return result.rows.map((row) => ({
    id: String(row.id), name: String(row.name), email: String(row.email),
    role: String(row.role), status: String(row.status),
    hasPassword: Boolean(row.has_password),
    passwordUpdatedAt: row.password_updated_at ? new Date(row.password_updated_at).toISOString() : null,
  }))
}

export async function setStaffPassword(staffId: string, password: string) {
  const passwordHash = await hashPassword(password)
  await ensurePasswordTables()
  await pool.query(
    `INSERT INTO public.staff_credentials (staff_id, password_hash, session_version, updated_at)
     SELECT id, $2, 1, now() FROM public.staff_members WHERE id = $1
     ON CONFLICT (staff_id) DO UPDATE SET password_hash = EXCLUDED.password_hash,
       session_version = public.staff_credentials.session_version + 1, updated_at = now()`,
    [staffId, passwordHash],
  )
  const result = await pool.query("SELECT 1 FROM public.staff_credentials WHERE staff_id = $1", [staffId])
  if (!result.rowCount) throw new Error("Staff member not found")
}

export async function removeStaffPassword(staffId: string) {
  await ensurePasswordTables()
  await pool.query("DELETE FROM public.staff_credentials WHERE staff_id = $1", [staffId])
}
