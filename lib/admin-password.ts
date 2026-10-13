import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'crypto'
import { promisify } from 'util'
import { pool } from '@/lib/db'

const scrypt = promisify(scryptCallback)

export async function readAdminPassword(): Promise<{ hash: string; version: string } | null> {
  if (!process.env.DATABASE_URL) return null
  await pool.query(`CREATE TABLE IF NOT EXISTS admin_password (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    hash TEXT NOT NULL,
    version TEXT NOT NULL
  )`)
  const result = await pool.query('SELECT hash, version FROM admin_password WHERE id = 1')
  return result.rows[0] ?? null
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex')
  const hash = await scrypt(password, salt, 64) as Buffer
  return `${salt}:${hash.toString('hex')}`
}

export async function matchesPassword(password: string, encoded: string): Promise<boolean> {
  const [salt, value] = encoded.split(':')
  if (!salt || !value || !/^[a-f0-9]{128}$/.test(value)) return false
  const actual = await scrypt(password, salt, 64) as Buffer
  return timingSafeEqual(actual, Buffer.from(value, 'hex'))
}

export async function replaceAdminPassword(password: string, expectedVersion: string | null): Promise<boolean> {
  if (!process.env.DATABASE_URL) throw new Error('Database required')
  const hash = await hashPassword(password)
  const version = randomBytes(16).toString('hex')
  const result = expectedVersion
    ? await pool.query('UPDATE admin_password SET hash = $1, version = $2 WHERE id = 1 AND version = $3 RETURNING id', [hash, version, expectedVersion])
    : await pool.query('INSERT INTO admin_password (id, hash, version) VALUES (1, $1, $2) ON CONFLICT DO NOTHING RETURNING id', [hash, version])
  return result.rowCount === 1
}
