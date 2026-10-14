import { NextResponse } from 'next/server'
import { getStaffSession } from '@/lib/staff-auth'
export async function GET() {
  const session = await getStaffSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json({ staff: { id: session.id, name: session.name, email: session.email, role: session.role } })
}
