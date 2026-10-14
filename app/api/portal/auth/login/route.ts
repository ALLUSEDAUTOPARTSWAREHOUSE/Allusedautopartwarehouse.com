import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/db'
import { createStaffToken, ensureStaffCredentialsTable, STAFF_COOKIE, verifyStaffPassword } from '@/lib/staff-auth'
import { validateAdminCredentials, generateAdminToken, ADMIN_COOKIE, ADMIN_SESSION_MAX_AGE } from '@/lib/admin-auth'
import { getAdminSessionVersion } from '@/lib/admin-passwords'

export const runtime = 'nodejs'

/**
 * One portal sign-in endpoint.
 * Staff accounts with provisioned credentials are checked first; all other credentials
 * are checked against the existing administrator authentication system.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const password = typeof body.password === 'string' ? body.password : ''
    if (!email || !password || email.length > 200 || password.length > 1024) {
      return NextResponse.json({ message: 'Enter your email and password.' }, { status: 400 })
    }

    await ensureStaffCredentialsTable()
    const staffResult = await pool.query(
      `SELECT s.id, s.name, s.email, s.role, s.status, c.password_hash, c.session_version
       FROM staff_members s JOIN staff_credentials c ON c.staff_id = s.id
       WHERE lower(s.email) = $1 LIMIT 1`, [email])
    const staff = staffResult.rows[0]

    if (staff) {
      if (staff.status !== 'active' || !await verifyStaffPassword(password, staff.password_hash)) {
        return NextResponse.json({ message: 'Invalid email or password, or account is inactive.' }, { status: 401 })
      }
      const session = createStaffToken(
        { id: staff.id, name: staff.name, email: staff.email, role: staff.role },
        Number(staff.session_version)
      )
      const redirectTo = staff.role === 'sales_agent' ? '/staff/sales'
        : staff.role === 'support_team' ? '/staff/support'
        : staff.role === 'developer_team' ? '/staff/developer' : null
      if (!redirectTo) return NextResponse.json({ message: 'This account does not have a supported portal role.' }, { status: 403 })
      const response = NextResponse.json({ success: true, role: staff.role, redirectTo })
      response.cookies.set(STAFF_COOKIE, session.token, {
        httpOnly: true, secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax', path: '/', maxAge: session.maxAge,
      })
      return response
    }

    const validation = await validateAdminCredentials(email, password)
    if (!validation.valid) {
      return NextResponse.json({ message: validation.message || 'Invalid email or password.' }, { status: 401 })
    }
    const token = generateAdminToken(email, await getAdminSessionVersion())
    const response = NextResponse.json({ success: true, role: 'admin', redirectTo: '/admin/workspace' })
    response.cookies.set(ADMIN_COOKIE, token, {
      httpOnly: true, secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', path: '/', maxAge: ADMIN_SESSION_MAX_AGE,
    })
    return response
  } catch (error) {
    console.error('[portal-auth] Sign-in failed', error)
    return NextResponse.json({ message: 'Unable to sign in right now. Please try again.' }, { status: 500 })
  }
}
