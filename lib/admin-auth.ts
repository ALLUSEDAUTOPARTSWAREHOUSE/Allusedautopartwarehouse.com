import { createHash, createHmac, timingSafeEqual } from 'crypto'
import { cookies } from 'next/headers'
import { getAdminSecurityState, getAdminSessionVersion, verifyPassword } from '@/lib/admin-passwords'

/**
 * Admin authentication backend.
 *
 * Credentials are sourced from environment variables. Sessions are stateless,
 * HMAC-signed tokens (signed with BETTER_AUTH_SECRET) with an expiry, stored in
 * an httpOnly cookie so they are never exposed to client-side JavaScript.
 *
 * There is deliberately no fallback password: ADMIN_PASSWORD must be set or
 * admin login stays disabled. Without BETTER_AUTH_SECRET the signing key is
 * derived from ADMIN_PASSWORD, so it is never a value anyone else knows (and
 * changing the password signs everyone out); the fixed dev key is only used
 * outside production.
 */

export const ADMIN_COOKIE = 'auapw_admin_session'
const SESSION_TTL_MS = 1000 * 60 * 60 * 8 // 8 hours

function getSecret(): string | null {
  const secret = process.env.BETTER_AUTH_SECRET || process.env.ADMIN_SESSION_SECRET
  if (secret) return secret
  const password = process.env.ADMIN_PASSWORD
  if (password) return createHash('sha256').update(`auapw-admin-session:${password}`).digest('hex')
  return process.env.NODE_ENV === 'production' ? null : 'auapw-dev-only-secret-change-me'
}

/** Which Vercel deployment this is, in the words the Vercel dashboard uses. */
function deploymentLabel(): string {
  if (process.env.VERCEL_ENV === 'production') return 'Production'
  if (process.env.VERCEL_ENV === 'preview') return 'Preview'
  return 'this server'
}

function getAdminCredentials() {
  return {
    email: process.env.ADMIN_EMAIL || 'Info@Allusedautopartswarehouse.com',
    password: process.env.ADMIN_PASSWORD || '',
  }
}

function sign(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('hex')
}

// Hash both sides first so the comparison takes the same time whatever the
// input lengths are (timingSafeEqual itself requires equal-length buffers).
function safeEqual(a: string, b: string): boolean {
  const hashA = createHash('sha256').update(a).digest()
  const hashB = createHash('sha256').update(b).digest()
  return timingSafeEqual(hashA, hashB)
}

/**
 * Validate admin login credentials against configured environment variables.
 */
export async function validateAdminCredentials(
  email: string,
  password: string
): Promise<{ valid: boolean; message: string }> {
  if (!email || !password) {
    return { valid: false, message: 'Email and password required' }
  }

  const creds = getAdminCredentials()
  const security = await getAdminSecurityState()
  if ((!security.passwordHash && !creds.password) || !getSecret()) {
    // Names only, never values: say exactly what to add and where, because
    // Vercel keeps separate settings for Production and Preview deployments.
    const where = deploymentLabel()
    console.error(`[admin] Login is disabled on ${where}: ADMIN_PASSWORD is not set`)
    return {
      valid: false,
      message:
        where === 'this server'
          ? 'Admin login is turned off: ADMIN_PASSWORD is not set on the server.'
          : `Admin login is turned off on this ${where} deployment: ADMIN_PASSWORD is not set for ${where} in Vercel → Settings → Environment Variables. Add it (tick ${where}), then redeploy.`,
    }
  }

  const emailOk = safeEqual(email.trim().toLowerCase(), creds.email.toLowerCase())
  const passwordOk = security.passwordHash
    ? await verifyPassword(password, security.passwordHash)
    : safeEqual(password, creds.password)

  if (!emailOk || !passwordOk) {
    return { valid: false, message: 'Invalid email or password' }
  }

  return { valid: true, message: 'Login successful' }
}

/**
 * Generate a stateless, signed admin session token.
 * Format: base64url(payload).signature
 */
export function generateAdminToken(adminEmail: string, sessionVersion = 0): string {
  const secret = getSecret()
  if (!secret) throw new Error('Admin session secret is not configured')
  const payload = {
    email: adminEmail,
    role: 'admin',
    sessionVersion,
    exp: Date.now() + SESSION_TTL_MS,
  }
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const signature = sign(encoded, secret)
  return `${encoded}.${signature}`
}

/**
 * Verify a signed admin session token.
 */
export function verifyAdminToken(token: string | undefined): {
  valid: boolean
  email?: string
} {
  const secret = getSecret()
  if (!secret || !token || !token.includes('.')) return { valid: false }

  const [encoded, signature] = token.split('.')
  const expected = sign(encoded, secret)

  if (!safeEqual(signature, expected)) return { valid: false }

  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString())
    if (payload.role !== 'admin') return { valid: false }
    if (typeof payload.exp !== 'number' || payload.exp < Date.now()) {
      return { valid: false }
    }
    return { valid: true, email: payload.email }
  } catch {
    return { valid: false }
  }
}

/**
 * Read and verify the admin session from the request cookies (server-side).
 */
export async function getAdminSession(): Promise<{ email: string } | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(ADMIN_COOKIE)?.value
  const result = verifyAdminToken(token)
  if (!result.valid || !result.email) return null
  const currentVersion = await getAdminSessionVersion()
  const tokenPayload = JSON.parse(Buffer.from(token!.split('.')[0], 'base64url').toString())
  if (Number(tokenPayload.sessionVersion ?? 0) !== currentVersion) return null
  return { email: result.email }
}

export const ADMIN_SESSION_MAX_AGE = SESSION_TTL_MS / 1000
