import { NextRequest, NextResponse } from 'next/server'
import {
  validateAdminCredentials,
  generateAdminToken,
  ADMIN_COOKIE,
  ADMIN_SESSION_MAX_AGE,
} from '@/lib/admin-auth'
import { getAdminSessionVersion } from '@/lib/admin-passwords'
import { STAFF_COOKIE } from '@/lib/staff-auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const rawEmail = typeof body.email === 'string' ? body.email : typeof body.username === 'string' ? body.username : ''
    const email = rawEmail.trim().toLowerCase()
    const password = typeof body.password === 'string' ? body.password : ''
    if (!email || !password || email.length > 200 || password.length > 1024) {
      return NextResponse.json({ message: 'Enter your email and password.' }, { status: 400 })
    }

    const validation = await validateAdminCredentials(email, password)

    if (!validation.valid) {
      return NextResponse.json(
        { message: validation.message },
        { status: validation.message.startsWith('Admin login is turned off') ? 503 : 401 },
      )
    }

    const token = generateAdminToken(email, await getAdminSessionVersion())
    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      user: { email, role: 'admin' },
      role: 'admin',
      redirectTo: '/admin/workspace',
    })

    response.cookies.set(ADMIN_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: ADMIN_SESSION_MAX_AGE,
    })
    response.cookies.set(STAFF_COOKIE, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    })

    return response
  } catch (error) {
    console.error('[admin-auth] Login failed', error)
    return NextResponse.json({ message: 'Unable to sign in right now. Please try again.' }, { status: 500 })
  }
}
