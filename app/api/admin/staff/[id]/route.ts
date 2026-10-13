import { db } from '@/lib/db'
import { staffMembers } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/admin-auth'

const VALID_ROLES = ['sales_agent', 'support_team', 'developer_team']

/**
 * PATCH /api/admin/staff/[id]
 * Update a staff member's details, role, or status.
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getAdminSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const { name, email, phone, role, department, title, status, notes } = body

    if (role !== undefined && !VALID_ROLES.includes(role)) {
      return NextResponse.json(
        { error: `Role must be one of: ${VALID_ROLES.join(', ')}` },
        { status: 400 }
      )
    }

    const cleanName = typeof name === "string" ? name.trim() : name
    const cleanEmail = typeof email === "string" ? email.trim().toLowerCase() : email
    if (name !== undefined && (typeof cleanName !== "string" || !cleanName || cleanName.length > 120)) {
      return NextResponse.json({ error: "Name must be between 1 and 120 characters." }, { status: 400 })
    }
    if (email !== undefined) {
      const at = typeof cleanEmail === "string" ? cleanEmail.indexOf("@") : -1
      if (typeof cleanEmail !== "string" || cleanEmail.length > 200 || at <= 0 || at !== cleanEmail.lastIndexOf("@") || cleanEmail.lastIndexOf(".") <= at + 1 || cleanEmail.endsWith(".") || cleanEmail.includes(" ")) {
        return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 })
      }
    }
    if (status !== undefined && status !== "active" && status !== "inactive") {
      return NextResponse.json({ error: "Status must be active or inactive." }, { status: 400 })
    }
    const updates: Record<string, unknown> = { updatedAt: new Date() }
    if (name !== undefined) updates.name = cleanName
    if (email !== undefined) updates.email = cleanEmail
    if (phone !== undefined) updates.phone = typeof phone === "string" ? phone.trim().slice(0, 30) || null : null
    if (role !== undefined) updates.role = role
    if (department !== undefined) updates.department = department
    if (title !== undefined) updates.title = title
    if (status !== undefined) updates.status = status
    if (notes !== undefined) updates.notes = notes

    await db.update(staffMembers).set(updates).where(eq(staffMembers.id, id))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[v0] Staff update error:', error)
    return NextResponse.json({ error: 'Failed to update staff member' }, { status: 500 })
  }
}

/**
 * DELETE /api/admin/staff/[id]
 * Remove a staff member from the directory.
 */
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getAdminSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    await db.delete(staffMembers).where(eq(staffMembers.id, id))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[v0] Staff delete error:', error)
    return NextResponse.json({ error: 'Failed to delete staff member' }, { status: 500 })
  }
}
