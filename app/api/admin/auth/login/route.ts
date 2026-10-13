import { NextRequest, NextResponse } from 'next/server'
import {
  validateAdminCredentials,
  generateAdminToken,
  ADMIN_COOKIE,
  ADMIN_SESSION_MAX_AGE,
} from '@/lib/admin-auth'
import { getAdminSessionVersion } from '@/lib/admin-passwords'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    // Accept either `email` or legacy `username`
    const email: string = body.email ?? body.username
    const password: string = body.password

    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password required' },
        { status: 400 }
      )
    }

    const validation = await validateAdminCredentials(email, password)

    if (!validation.valid) {
      console.log(
        `[v0] Failed admin login attempt for: ${email} at ${new Date().toISOString()}`
      )
      return NextResponse.json({ message: validation.message }, { status: 401 })
    }

    const token = generateAdminToken(email.trim().toLowerCase(), await getAdminSessionVersion())

    console.log(`[v0] Admin login successful for: ${email}`)

    const response = NextResponse.json(
      {
        success: true,
        message: 'Login successful',
        user: { email, role: 'admin' },
      },
      { status: 200 }
    )

    response.cookies.set(ADMIN_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: ADMIN_SESSION_MAX_AGE,
    })

    return response
  } catch (error) {
    console.error('[v0] Admin login error:', error)
    return NextResponse.json({ message: 'Authentication error' }, { status: 500 })
  }
}
