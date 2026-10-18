import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { getAdminSession } from '@/lib/admin-auth'
import { getStaffSession } from '@/lib/staff-auth'

export async function GET() {
  const [userSession, adminSession, staffSession] = await Promise.all([
    auth.api.getSession({ headers: await headers() }),
    getAdminSession(),
    getStaffSession(),
  ])
  const audience = adminSession || staffSession ? 'team' : userSession?.user ? 'customer' : null
  return NextResponse.json({ authorized: audience !== null, audience })
}
