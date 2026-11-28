import 'server-only'
import { randomUUID } from 'node:crypto'
import type { PoolClient } from 'pg'
import { z } from 'zod'
import { pool } from '@/lib/db'
import { getAdminSession } from '@/lib/admin-auth'
import { getStaffSession } from '@/lib/staff-auth'

export const recordActivitySchema = z.object({
  eventId: z.string().uuid(),
  recordType: z.enum(['order', 'quote']),
  recordId: z.string().trim().min(1).max(64),
  action: z.enum(['record_opened', 'outcome_reported']),
  outcome: z.enum(['confirmed', 'unable', 'follow_up', 'in_progress', 'closed']).optional(),
  note: z.string().trim().max(1000).optional().default(''),
}).strict().superRefine((value, ctx) => {
  if (value.action === 'outcome_reported' && !value.outcome) ctx.addIssue({ code: 'custom', path: ['outcome'], message: 'Choose an outcome.' })
  if (value.action === 'record_opened' && value.outcome) ctx.addIssue({ code: 'custom', path: ['outcome'], message: 'Opening a record is not a business outcome.' })
})

export interface ActivityActor { id: string; name: string; role: string }
export async function getActivityActor(): Promise<ActivityActor | null> {
  const admin = await getAdminSession()
  if (admin) {
    const email = admin.email.trim().toLowerCase()
    return { id: `admin:${email}`, name: email, role: 'admin' }
  }
  const staff = await getStaffSession()
  return staff ? { id: staff.id, name: staff.name, role: staff.role } : null
}

export async function recordActivity(actor: ActivityActor, raw: unknown) {
  const input = recordActivitySchema.parse(raw)
  if (actor.role !== 'admin' && !['sales_agent', 'support_team'].includes(actor.role)) throw Object.assign(new Error('This account cannot access customer work.'), { status: 403 })
  const table = input.recordType === 'order' ? 'orders' : 'leads'
  const scope = actor.role === 'admin' ? '' : ` AND EXISTS (SELECT 1 FROM public.followup_assignments a WHERE a.record_type=$2 AND a.record_id=r.id::text AND a.staff_id=$3)`
  const record = await pool.query(`SELECT r.status FROM public.${table} r WHERE r.id::text=$1${scope}`, actor.role === 'admin' ? [input.recordId] : [input.recordId, input.recordType, actor.id])
  if (!record.rows[0]) throw Object.assign(new Error('The record is not available to this account.'), { status: 404 })
  const result = await pool.query(
    `INSERT INTO public.record_activity(id,actor_id,actor_name,actor_role,record_type,record_id,action,outcome,source_status,note)
     VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) ON CONFLICT(id) DO NOTHING RETURNING id,created_at,source_status`,
    [input.eventId, actor.id, actor.name, actor.role, input.recordType, input.recordId, input.action, input.outcome ?? null, record.rows[0].status ?? null, input.note],
  )
  if (result.rows[0]) return { ok: true, duplicate: false, eventId: result.rows[0].id, recordedAt: result.rows[0].created_at, sourceStatus: result.rows[0].source_status, sourceChanged: false }
  // A retry acknowledges only the original actor and exact client payload.
  // Reusing an event ID cannot silently acknowledge another record or outcome.
  const existing = await pool.query(
    'SELECT id,actor_id,record_type,record_id,action,outcome,note,created_at,source_status FROM public.record_activity WHERE id=$1 AND actor_id=$2',
    [input.eventId, actor.id],
  )
  const saved = existing.rows[0]
  if (!saved || saved.record_type !== input.recordType || saved.record_id !== input.recordId || saved.action !== input.action || (saved.outcome ?? null) !== (input.outcome ?? null) || saved.note !== input.note) {
    throw Object.assign(new Error('This event ID already belongs to a different recorded action. Refresh the result and submit a new event for a new action.'), { status: 409 })
  }
  return { ok: true, duplicate: true, eventId: saved.id, recordedAt: saved.created_at, sourceStatus: saved.source_status, sourceChanged: false }
}

/** Called inside the same transaction that changes the source record. Errors
 * propagate so an unavailable audit store rolls back the business mutation. */
export async function writeSavedAction(client: Pick<PoolClient, 'query'>, actor: ActivityActor, type: 'order' | 'quote', id: string, status: string): Promise<void> {
  await client.query(
    `INSERT INTO public.record_activity(id,actor_id,actor_name,actor_role,record_type,record_id,action,outcome,source_status,note)
     VALUES($1,$2,$3,$4,$5,$6,'source_status_saved',$7,$7,$8)`,
    [randomUUID(), actor.id, actor.name, actor.role, type, id, status, 'Saved with the source change in the same database transaction.'],
  )
}

export async function getRecordActivityReport() {
  const actor = await getActivityActor()
  if (!actor) throw Object.assign(new Error('Sign in to read activity.'), { status: 401 })
  if (actor.role !== 'admin' && !['sales_agent', 'support_team'].includes(actor.role)) throw Object.assign(new Error('Customer work reports are not available to this account.'), { status: 403 })
  const where = actor.role === 'admin' ? 'TRUE' : 'actor_id=$1'
  const params = actor.role === 'admin' ? [] : [actor.id]
  const [events, totals, people] = await Promise.all([
    pool.query(`SELECT id,actor_name,actor_role,record_type,record_id,action,outcome,source_status,note,created_at FROM public.record_activity WHERE ${where} ORDER BY created_at DESC,id DESC LIMIT 200`, params),
    pool.query(`SELECT count(*)::int AS events,count(*) FILTER(WHERE action='record_opened')::int AS opens,count(*) FILTER(WHERE action='source_status_saved')::int AS saved_changes,min(created_at) AS measurement_started_at FROM public.record_activity WHERE ${where}`, params),
    pool.query(`WITH scoped_events AS (SELECT * FROM public.record_activity WHERE ${where}),
      latest_identity AS (
        SELECT actor_id,actor_name,actor_role,
          row_number() OVER (PARTITION BY actor_id ORDER BY created_at DESC,id DESC) AS position
        FROM scoped_events
      )
      SELECT e.actor_id,i.actor_name,i.actor_role,
        count(*) FILTER(WHERE e.action='record_opened')::int AS opens,
        count(DISTINCT (e.record_type,e.record_id)) FILTER(WHERE e.action='outcome_reported' AND e.outcome='confirmed')::int AS confirmed,
        count(DISTINCT (e.record_type,e.record_id)) FILTER(WHERE e.action='outcome_reported' AND e.outcome='unable')::int AS unable,
        count(DISTINCT (e.record_type,e.record_id)) FILTER(WHERE e.action='outcome_reported' AND e.outcome='follow_up')::int AS follow_up,
        max(e.created_at) AS last_activity
      FROM scoped_events e JOIN latest_identity i ON i.actor_id=e.actor_id AND i.position=1
      GROUP BY e.actor_id,i.actor_name,i.actor_role ORDER BY last_activity DESC,e.actor_id LIMIT 100`,params),
  ])
  return { available: true, checkedAt: new Date().toISOString(), sourceUrl: '/admin/activity', scope: actor.role === 'admin' ? 'All recorded dashboard activity' : 'Your recorded dashboard activity', events: events.rows, summary: totals.rows[0], byAgent: people.rows, limits: { events:200, agents:100 }, note: 'Record opens, staff-reported workflow outcomes, and source status saves are distinct events. Outcome totals count distinct records per stable person ID across recorded history; they are not current status totals or proof of payment. Person labels use their latest recorded name and role; individual events retain the identity recorded at that time. Shared admin logins identify the account, not an individual person. Events before this feature was enabled are not reconstructed.' }
}
