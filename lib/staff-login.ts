import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/db'
import { ADMIN_COOKIE } from '@/lib/admin-auth'
import {
  checkStaffLoginRateLimit,
  createStaffToken,
  ensureStaffCredentialsTable,
  STAFF_COOKIE,
  verifyStaffPassword,
} from '@/lib/staff-auth'

const DUMMY_PASSWORD_HASH = 'scrypt:00112233445566778899aabbccddeeff:8007eeb15362bd8dc3e39c4e00d305467e5691517da590c846a726a531517818ef69df5baf3c53495d4b513d94c9bdcb04e59d6e5e35cde473cd4ea5fe07e37c'

export async function handleStaffLogin(request: NextRequest, errorField: 'error' | 'message') {
  const failure = (message: string, status: number) => NextResponse.json({ [errorField]: message }, { status })
  try {
    const body = await request.json()
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const password = typeof body.password === 'string' ? body.password : ''
    if (!email || !password || email.length > 200 || password.length > 1024) {
      return failure('Enter your work email and password.', 400)
    }
    if (!process.env.BETTER_AUTH_SECRET && !process.env.ADMIN_SESSION_SECRET) {
      return failure('Staff sign-in is not configured on this deployment.', 503)
    }

    await ensureStaffCredentialsTable()
    const forwardedFor = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    const ip = request.headers.get('x-real-ip')?.trim() || forwardedFor || 'unknown'
    if (!await checkStaffLoginRateLimit(email, ip)) {
      return failure('Too many sign-in attempts. Please try again later.', 429)
    }

    const result = await pool.query(
      `SELECT s.id, s.name, s.email, s.role, s.status, c.password_hash, c.session_version
       FROM public.staff_members s JOIN public.staff_credentials c ON c.staff_id = s.id
       WHERE lower(s.email) = $1 LIMIT 2`,
      [email],
    )
    if (result.rows.length !== 1) {
      await verifyStaffPassword(password, DUMMY_PASSWORD_HASH)
      return failure('Invalid email or password, or account is inactive.', 401)
    }

    const row = result.rows[0]
    const passwordValid = await verifyStaffPassword(password, row.password_hash)
    if (row.status !== 'active' || !passwordValid) {
      return failure('Invalid email or password, or account is inactive.', 401)
    }
    if (!['sales_agent', 'support_team', 'developer_team'].includes(row.role)) {
      return failure('This account does not have a supported portal role.', 403)
    }

    const session = createStaffToken(
      { id: row.id, name: row.name, email: row.email, role: row.role },
      Number(row.session_version),
    )
    const redirectTo = row.role === 'sales_agent' ? '/staff/sales'
      : row.role === 'support_team' ? '/staff/support' : '/staff/developer'
    const response = NextResponse.json({ success: true, role: row.role, redirectTo })
    response.cookies.set(STAFF_COOKIE, session.token, {
      httpOnly: true, secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', path: '/', maxAge: session.maxAge,
    })
    response.cookies.set(ADMIN_COOKIE, '', {
      httpOnly: true, secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', path: '/', maxAge: 0,
    })
    return response
  } catch (error) {
    console.error('[staff-auth] Login failed', error)
    return failure('Unable to sign in right now.', 500)
  }
}
