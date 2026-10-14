import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/db'
import { createStaffToken, ensureStaffCredentialsTable, STAFF_COOKIE, verifyStaffPassword } from '@/lib/staff-auth'

export const runtime = 'nodejs'
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const password = typeof body.password === 'string' ? body.password : ''
    if (!email || !password || email.length > 200 || password.length > 1024) {
      return NextResponse.json({ error: 'Enter your work email and password.' }, { status: 400 })
    }
    if (!process.env.BETTER_AUTH_SECRET && !process.env.ADMIN_SESSION_SECRET) {
      return NextResponse.json({ error: 'Staff sign-in is not configured on this deployment.' }, { status: 503 })
    }
    await ensureStaffCredentialsTable()
    const result = await pool.query(
      `SELECT s.id, s.name, s.email, s.role, s.status, c.password_hash, c.session_version
       FROM staff_members s JOIN staff_credentials c ON c.staff_id = s.id
       WHERE lower(s.email) = $1 LIMIT 1`, [email])
    const row = result.rows[0]
    if (!row || row.status !== 'active' || !await verifyStaffPassword(password, row.password_hash)) {
      return NextResponse.json({ error: 'Invalid email or password, or account is inactive.' }, { status: 401 })
    }
    const session = createStaffToken({ id: row.id, name: row.name, email: row.email, role: row.role }, Number(row.session_version))
    const response = NextResponse.json({ success: true, role: row.role, redirectTo: row.role === 'sales_agent' ? '/staff/sales' : row.role === 'support_team' ? '/staff/support' : '/staff/developer' })
    response.cookies.set(STAFF_COOKIE, session.token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: session.maxAge })
    return response
  } catch (error) {
    console.error('[staff-auth] Login failed', error)
    return NextResponse.json({ error: 'Unable to sign in right now.' }, { status: 500 })
  }
}
