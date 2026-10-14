import { NextResponse } from 'next/server'
import { STAFF_COOKIE } from '@/lib/staff-auth'
export async function POST() {
  const response = NextResponse.json({ success: true })
  response.cookies.set(STAFF_COOKIE, '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 0 })
  return response
}
