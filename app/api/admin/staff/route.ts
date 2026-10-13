import { db } from '@/lib/db'
import { staffMembers } from '@/lib/db/schema'
import { desc } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/admin-auth'

const VALID_ROLES = ['sales_agent', 'support_team', 'developer_team']

/**
 * GET /api/admin/staff
 * List all staff members (sales agents, support team, developer team).
 */
export async function GET() {
  try {
    const session = await getAdminSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const staff = await db.select().from(staffMembers).orderBy(desc(staffMembers.createdAt))
    return NextResponse.json({ staff })
  } catch (error) {
    console.error('[v0] Staff list error:', error)
    return NextResponse.json({ error: 'Failed to fetch staff' }, { status: 500 })
  }
}

/**
 * POST /api/admin/staff
 * Add a new staff member.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getAdminSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { name, email, phone, role, department, title, notes } = body
    const cleanName = typeof name === "string" ? name.trim() : ""
    const cleanEmail = typeof email === "string" ? email.trim().toLowerCase() : ""

    if (!cleanName || !cleanEmail || !role) {
      return NextResponse.json(
        { error: 'Missing required fields: name, email, role' },
        { status: 400 }
      )
    }

    const at = cleanEmail.indexOf("@")
    if (cleanName.length > 120 || cleanEmail.length > 200 || at <= 0 || at !== cleanEmail.lastIndexOf("@") || cleanEmail.lastIndexOf(".") <= at + 1 || cleanEmail.endsWith(".") || cleanEmail.includes(" ")) {
      return NextResponse.json({ error: "Enter a valid name and email address." }, { status: 400 })
    }
      return NextResponse.json({ error: "Enter a valid name and email address." }, { status: 400 })
    }

    if (!VALID_ROLES.includes(role)) {
      return NextResponse.json(
        { error: `Role must be one of: ${VALID_ROLES.join(', ')}` },
        { status: 400 }
      )
    }

    const newStaff = {
      id: `staff_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      name: cleanName,
      email: cleanEmail,
      phone: phone || null,
      role,
      department: department || null,
      title: title || null,
      status: 'active',
      notes: notes || null,
    }

    await db.insert(staffMembers).values(newStaff)

    return NextResponse.json({ staff: newStaff }, { status: 201 })
  } catch (error) {
    console.error('[v0] Staff create error:', error)
    return NextResponse.json({ error: 'Failed to create staff member' }, { status: 500 })
  }
}
