import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { ADMIN_COOKIE, getAdminSession, validateAdminCredentials } from '@/lib/admin-auth'
import { readAdminPassword, replaceAdminPassword } from '@/lib/admin-password'

const schema = z.object({
  currentPassword: z.string().min(1).max(256),
  newPassword: z.string().min(12).max(256),
})

export async function POST(req: NextRequest) {
  if (req.headers.get('origin') !== req.nextUrl.origin) return NextResponse.json({ error: 'Invalid origin' }, { status: 403 })
  try {
    const session = await getAdminSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!process.env.DATABASE_URL) return NextResponse.json({ error: 'Password changes require a configured database.' }, { status: 503 })
    const parsed = schema.safeParse(await req.json().catch(() => null))
    if (!parsed.success) return NextResponse.json({ error: 'Use a new password between 12 and 256 characters.' }, { status: 400 })
    const before = await readAdminPassword()
    const valid = await validateAdminCredentials(session.email, parsed.data.currentPassword)
    if (!valid.valid) return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 400 })
    if (parsed.data.currentPassword === parsed.data.newPassword) return NextResponse.json({ error: 'Choose a different new password.' }, { status: 400 })
    if (!(await replaceAdminPassword(parsed.data.newPassword, before?.version ?? null))) {
      return NextResponse.json({ error: 'Password changed in another session. Sign in again.' }, { status: 409 })
    }
    const response = NextResponse.json({ ok: true })
    response.cookies.set(ADMIN_COOKIE, '', { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 0 })
    return response
  } catch {
    return NextResponse.json({ error: 'Unable to change password. Please try again.' }, { status: 503 })
  }
}
