import "server-only"

import { pool } from "@/lib/db"

export type FollowupRecordType = "order" | "quote"
export type FollowupStaffRole = "sales_agent" | "support_team" | "developer_team"

export interface FollowupStaffOption {
  id: string
  name: string
  email: string
  role: FollowupStaffRole
}

export interface FollowupAssignment {
  recordId: string
  staffId: string
  staffName: string | null
  staffEmail: string | null
  staffRole: FollowupStaffRole | null
  staffStatus: string | null
  updatedAt: string
}

let tableReady: Promise<void> | null = null

async function ensureAssignmentsTable(): Promise<void> {
  tableReady ??= pool.query(`
    CREATE TABLE IF NOT EXISTS public.followup_assignments (
      record_type text NOT NULL CHECK (record_type IN ('order', 'quote')),
      record_id text NOT NULL,
      staff_id text NOT NULL,
      assigned_by_email text,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      PRIMARY KEY (record_type, record_id)
    )
  `).then(() => undefined).catch((error) => {
    tableReady = null
    throw error
  })
  return tableReady
}

/** Active sales/support staff are eligible for customer follow-up assignment. */
export async function getActiveSalesSupportStaff(): Promise<FollowupStaffOption[]> {
  await ensureAssignmentsTable()
  const { rows } = await pool.query(
    `SELECT id, name, email, role
       FROM public.staff_members
      WHERE status = 'active' AND role IN ('sales_agent', 'support_team')
      ORDER BY name ASC
      LIMIT 100`,
  )
  return rows.map((row: { id: string; name: string; email: string; role: FollowupStaffRole }) => ({
    id: String(row.id),
    name: String(row.name),
    email: String(row.email),
    role: row.role,
  }))
}

export async function getFollowupAssignments(
  recordType: FollowupRecordType,
  recordIds: string[],
): Promise<Map<string, FollowupAssignment>> {
  await ensureAssignmentsTable()
  if (recordIds.length === 0) return new Map()
  const { rows } = await pool.query(
    `SELECT a.record_id, a.staff_id, s.name AS staff_name, s.email AS staff_email,
            s.role AS staff_role, s.status AS staff_status, a.updated_at
       FROM public.followup_assignments a
       LEFT JOIN public.staff_members s ON s.id = a.staff_id
      WHERE a.record_type = $1 AND a.record_id = ANY($2::text[])`,
    [recordType, recordIds],
  )
  const entries: [string, FollowupAssignment][] = rows.map((row: {
    record_id: string
    staff_id: string
    staff_name: string | null
    staff_email: string | null
    staff_role: FollowupStaffRole | null
    staff_status: string | null
    updated_at: Date | string
  }) => [String(row.record_id), {
    recordId: String(row.record_id),
    staffId: String(row.staff_id),
    staffName: row.staff_name,
    staffEmail: row.staff_email,
    staffRole: row.staff_role,
    staffStatus: row.staff_status,
    updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at),
  }])
  return new Map(entries)
}

/** Assign or clear one order/quote. Only an active sales/support member may be assigned. */
export async function setFollowupAssignment(
  recordType: FollowupRecordType,
  recordId: string,
  staffId: string,
  assignedByEmail: string,
): Promise<FollowupAssignment | null> {
  await ensureAssignmentsTable()
  if (!staffId) {
    await pool.query("DELETE FROM public.followup_assignments WHERE record_type = $1 AND record_id = $2", [recordType, recordId])
    return null
  }

  const { rows: staff } = await pool.query(
    `SELECT id, name, email, role, status
       FROM public.staff_members
      WHERE id = $1 AND status = 'active' AND role IN ('sales_agent', 'support_team')
      LIMIT 1`,
    [staffId],
  )
  if (!staff[0]) throw new Error("Choose an active sales or support team member.")

  const { rows } = await pool.query(
    `INSERT INTO public.followup_assignments (record_type, record_id, staff_id, assigned_by_email, updated_at)
     VALUES ($1, $2, $3, $4, now())
     ON CONFLICT (record_type, record_id) DO UPDATE
       SET staff_id = EXCLUDED.staff_id, assigned_by_email = EXCLUDED.assigned_by_email, updated_at = now()
     RETURNING record_id, staff_id, updated_at`,
    [recordType, recordId, staffId, assignedByEmail],
  )
  const member = staff[0]
  const updated = rows[0]
  return {
    recordId: String(updated.record_id),
    staffId: String(updated.staff_id),
    staffName: String(member.name),
    staffEmail: String(member.email),
    staffRole: member.role as FollowupStaffRole,
    staffStatus: String(member.status),
    updatedAt: updated.updated_at instanceof Date ? updated.updated_at.toISOString() : String(updated.updated_at),
  }
}
