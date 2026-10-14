import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/admin-auth'
import { pool } from '@/lib/db'
import { ensureStaffCredentialsTable, hashStaffPassword } from '@/lib/staff-auth'

export const runtime = 'nodejs'
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { id } = await params
    const body = await request.json()
    const password = typeof body.password === 'string' ? body.password : ''
    if (password.length < 12 || password.length > 256) {
      return NextResponse.json({ error: 'Set a password between 12 and 256 characters.' }, { status: 400 })
    }
    const staff = await pool.query('SELECT id, status FROM staff_members WHERE id = $1 LIMIT 1', [id])
    if (!staff.rows[0]) return NextResponse.json({ error: 'Staff member not found.' }, { status: 404 })
    if (staff.rows[0].status !== 'active') return NextResponse.json({ error: 'Activate this staff member before setting login access.' }, { status: 409 })
    await ensureStaffCredentialsTable()
    const passwordHash = await hashStaffPassword(password)
    await pool.query(
      `INSERT INTO staff_credentials (staff_id, password_hash, session_version, updated_at)
       VALUES ($1, $2, 0, NOW())
       ON CONFLICT (staff_id) DO UPDATE SET password_hash = EXCLUDED.password_hash,
       session_version = staff_credentials.session_version + 1, updated_at = NOW()`,
      [id, passwordHash])
    return NextResponse.json({ success: true, message: 'Staff login enabled or password reset. Existing sessions were revoked.' })
  } catch (error) {
    console.error('[staff-auth] Credential provisioning failed', error)
    return NextResponse.json({ error: 'Could not set staff credentials.' }, { status: 500 })
  }
}
