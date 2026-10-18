import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/db'
import { consumeStaffInvite } from '@/lib/staff-invites'
import { ensureStaffCredentialsTable, hashStaffPassword } from '@/lib/staff-auth'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const token = typeof body.token === 'string' ? body.token : ''
    const staffId = typeof body.staffId === 'string' ? body.staffId : ''
    const password = typeof body.password === 'string' ? body.password : ''
    if (!token || !staffId || token.length > 512 || staffId.length > 200) {
      return NextResponse.json({ error: 'This invitation link is invalid.' }, { status: 400 })
    }
    if (password.length < 12 || password.length > 256) {
      return NextResponse.json({ error: 'Choose a password between 12 and 256 characters.' }, { status: 400 })
    }
    const staff = await pool.query('SELECT id, status FROM staff_members WHERE id = $1 LIMIT 1', [staffId])
    if (!staff.rows[0] || staff.rows[0].status !== 'active') {
      return NextResponse.json({ error: 'This invitation is no longer valid.' }, { status: 410 })
    }
    if (!await consumeStaffInvite(token, staffId)) {
      return NextResponse.json({ error: 'This invitation link is invalid or has expired. Ask your administrator to send a new one.' }, { status: 410 })
    }
    await ensureStaffCredentialsTable()
    const passwordHash = await hashStaffPassword(password)
    await pool.query(
      `INSERT INTO staff_credentials (staff_id, password_hash, session_version, updated_at)
       VALUES ($1, $2, 0, NOW())
       ON CONFLICT (staff_id) DO UPDATE SET password_hash = EXCLUDED.password_hash,
       session_version = staff_credentials.session_version + 1, updated_at = NOW()`,
      [staffId, passwordHash])
    return NextResponse.json({ success: true, message: 'Password set. You can now sign in.' })
  } catch (error) {
    console.error('[staff-invites] Accept invite failed', error)
    return NextResponse.json({ error: 'Unable to activate your account right now.' }, { status: 500 })
  }
}
