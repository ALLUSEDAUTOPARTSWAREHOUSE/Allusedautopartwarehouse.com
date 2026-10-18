import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/admin-auth'
import { pool } from '@/lib/db'
import { createStaffInvite, sendStaffInviteEmail } from '@/lib/staff-invites'

export const runtime = 'nodejs'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (request.headers.get('origin') !== new URL(request.url).origin) return NextResponse.json({ error: 'Invalid origin' }, { status: 403 })
  try {
    const { id } = await params
    const result = await pool.query(
      'SELECT id, name, email, status FROM staff_members WHERE id = $1 LIMIT 1', [id])
    const staff = result.rows[0]
    if (!staff) return NextResponse.json({ error: 'Staff member not found.' }, { status: 404 })
    if (staff.status !== 'active') {
      return NextResponse.json({ error: 'Activate this staff member before sending an invitation.' }, { status: 409 })
    }
    const token = await createStaffInvite(staff.id)
    const configuredOrigin = process.env.AUAPW_PUBLIC_URL || process.env.BETTER_AUTH_URL
    if (!configuredOrigin) throw new Error('Public invitation origin is not configured')
    const base = new URL(configuredOrigin)
    if (base.protocol !== 'https:' || base.username || base.password) throw new Error('Invalid invitation origin')
    const origin = base.origin
    const inviteUrl = `${origin}/staff/accept-invite?token=${encodeURIComponent(token)}&staff=${encodeURIComponent(staff.id)}`
    await sendStaffInviteEmail({ email: staff.email, name: staff.name, inviteUrl })
    return NextResponse.json({ success: true, message: `Invitation sent to ${staff.email}.` })
  } catch (error) {
    console.error('[staff-invites] Invite failed', error)
    return NextResponse.json({ error: 'Could not send the invitation.' }, { status: 500 })
  }
}
