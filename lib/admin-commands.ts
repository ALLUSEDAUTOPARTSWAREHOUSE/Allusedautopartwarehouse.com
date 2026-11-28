import 'server-only'
import { createHash, randomUUID } from 'node:crypto'
import type { Pool, PoolClient } from 'pg'
import { pool } from '@/lib/db'
import { getAdminSession } from '@/lib/admin-auth'
import {
  commandIdSchema, developmentPlanSchema, staffCreationSchema, staffRoleChangeSchema,
  staffSearchSchema, type AdminCommandView, type CommandKind, type CommandStatus,
  type DevelopmentPlanInput, type StaffCreationInput, type StaffRoleChangeInput,
} from '@/lib/admin-command-policy'

const APPROVAL_TTL_MS = 15 * 60 * 1000
const STAFF_FIELDS = 'id, name, email, role, department, title, status, extract(epoch from "updatedAt")::text AS version'
type Json = Record<string, unknown>
type StaffRow = { id: string; name: string; email: string; role: string; department: string | null; title: string | null; status: string; version: string }
type CommandRow = {
  id: string; kind: CommandKind; status: CommandStatus; actor_email: string;
  summary: string; payload: Json; preview: Json; target_id: string | null;
  target_fingerprint: string | null; created_at: Date | string; expires_at: Date | string | null;
  decided_at: Date | string | null; result: Json | null;
}
type Dependencies = {
  database: Pick<Pool, 'query' | 'connect'>
  session: () => Promise<{ email: string } | null>
  now?: () => Date
  id?: () => string
}

export class AdminCommandError extends Error {
  constructor(message: string, readonly status = 400, readonly code = 'INVALID_COMMAND') { super(message); this.name = 'AdminCommandError' }
}
const iso = (value: Date | string) => value instanceof Date ? value.toISOString() : new Date(value).toISOString()
const fingerprint = (staff: StaffRow) => createHash('sha256').update(JSON.stringify({ id: staff.id, name: staff.name, email: staff.email, role: staff.role, status: staff.status, department: staff.department, title: staff.title, version: staff.version })).digest('hex')
function parse<T>(schema: { safeParse: (value: unknown) => { success: true; data: T } | { success: false } }, value: unknown): T {
  const checked = schema.safeParse(value)
  if (!checked.success) throw new AdminCommandError('The command contains missing, unsupported, or invalid fields.')
  return checked.data
}
function publicCommand(row: CommandRow, now: Date): AdminCommandView {
  const expired = row.status === 'pending_approval' && row.expires_at !== null && new Date(row.expires_at).getTime() <= now.getTime()
  const status = expired ? 'expired' : row.status
  return {
    type: 'admin-command', commandId: row.id, kind: row.kind, status, summary: row.summary,
    preview: row.preview, createdAt: iso(row.created_at), expiresAt: row.expires_at ? iso(row.expires_at) : null,
    decidedAt: row.decided_at ? iso(row.decided_at) : null, approvalUrl: `/api/admin/commands/${encodeURIComponent(row.id)}`,
    canApprove: status === 'pending_approval', result: row.result,
  }
}
function storageError(error: unknown): never {
  if (error instanceof AdminCommandError) throw error
  if (error && typeof error === 'object' && 'code' in error && error.code === '42P01') {
    throw new AdminCommandError('Command storage is not ready. Apply the reviewed admin-command migration before using staff commands.', 503, 'COMMAND_STORAGE_UNAVAILABLE')
  }
  throw new AdminCommandError('The command could not be saved or processed. Refresh its status before retrying.', 503, 'COMMAND_STORAGE_ERROR')
}

/** Injectable dependencies keep authorization and replay/stale rules testable.
 * Every public operation obtains its actor from the server session, never input. */
export function createAdminCommandService(deps: Dependencies) {
  const database = deps.database, now = deps.now || (() => new Date()), newId = deps.id || randomUUID
  async function actor() {
    let session: { email: string } | null
    try { session = await deps.session() } catch { throw new AdminCommandError('Administrator authorization could not be verified. No command was processed.', 503, 'AUTH_UNAVAILABLE') }
    if (!session || typeof session.email !== 'string' || !session.email.trim()) throw new AdminCommandError('Administrator sign-in is required.', 401, 'UNAUTHORIZED')
    return session.email.trim().toLowerCase()
  }
  async function audit(client: PoolClient, commandId: string, email: string, action: string, outcome: string, detail: Json = {}) {
    await client.query('INSERT INTO public.admin_command_events (id, command_id, actor_email, action, outcome, detail) VALUES ($1,$2,$3,$4,$5,$6)', [newId(), commandId, email, action, outcome, JSON.stringify(detail)])
  }
  async function create(email: string, kind: CommandKind, summary: string, payload: Json, preview: Json, target?: StaffRow) {
    const planned = kind === 'development.plan', id = newId(), created = now()
    const client = await database.connect()
    try {
      await client.query('BEGIN')
      const { rows } = await client.query<CommandRow>(`INSERT INTO public.admin_commands
        (id,kind,status,actor_email,summary,payload,preview,target_id,target_fingerprint,created_at,expires_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [id, kind, planned ? 'planned' : 'pending_approval', email, summary, JSON.stringify(payload), JSON.stringify(preview), target?.id || null, target ? fingerprint(target) : null, created, planned ? null : new Date(created.getTime() + APPROVAL_TTL_MS)])
      await audit(client, id, email, planned ? 'plan_saved' : 'command_prepared', planned ? 'not_run' : 'awaiting_approval', { kind })
      await client.query('COMMIT')
      return publicCommand(rows[0], now())
    } catch (error) { await client.query('ROLLBACK'); storageError(error) } finally { client.release() }
  }

  async function searchStaff(input: unknown) {
    await actor()
    const filters = parse(staffSearchSchema, input)
    try {
      const result = await database.query<StaffRow>(`SELECT ${STAFF_FIELDS} FROM public.staff_members
        WHERE ($1::text IS NULL OR name ILIKE $1 OR email ILIKE $1 OR id = $3)
          AND ($2::text IS NULL OR role = $2)
        ORDER BY "createdAt" DESC, id LIMIT $4`, [filters.q ? `%${filters.q.replace(/[\\%_]/g, '\\$&')}%` : null, filters.role || null, filters.q || '', filters.limit])
      return { checkedAt: now().toISOString(), sourceUrl: '/admin/team', limit: filters.limit, matched: result.rows.length, roles: ['sales_agent', 'support_team', 'developer_team'], staff: result.rows.map(({ version: _version, ...staff }) => staff), note: 'Staff profiles are separate from administrator credentials and Better Auth customer accounts. These results do not expose credentials or invitation tokens.' }
    } catch (error) { storageError(error) }
  }

  async function prepareStaffCreation(input: StaffCreationInput) {
    const email = await actor(), values = parse(staffCreationSchema, input)
    try {
      const duplicate = await database.query('SELECT id FROM public.staff_members WHERE lower(trim(email)) = $1 LIMIT 1', [values.email])
      if (duplicate.rows.length) throw new AdminCommandError('A staff profile already uses this email. Search the staff directory and select the exact profile.', 409, 'STAFF_ALREADY_EXISTS')
      return await create(email, 'staff.create', `Create ${values.name} as ${values.role}.`, values, { ...values, status: 'active', provisioning: 'profile_only', nextStep: 'After creation, an administrator can send the existing staff invitation separately. No password or invitation is created by this command.' })
    } catch (error) { storageError(error) }
  }

  async function prepareStaffRoleChange(input: StaffRoleChangeInput) {
    const email = await actor(), values = parse(staffRoleChangeSchema, input)
    try {
      const found = await database.query<StaffRow>(`SELECT ${STAFF_FIELDS} FROM public.staff_members WHERE id = $1 LIMIT 1`, [values.staffId])
      const staff = found.rows[0]
      if (!staff) throw new AdminCommandError('Staff profile not found. Search the staff directory for its exact ID.', 404, 'STAFF_NOT_FOUND')
      if (staff.role === values.role) throw new AdminCommandError('This staff profile already has the requested role. No change is needed.', 409, 'NO_CHANGE')
      return await create(email, 'staff.role.change', `Change ${staff.name} from ${staff.role} to ${values.role}.`, values, {
        staffId: staff.id, name: staff.name, email: staff.email, currentRole: staff.role, newRole: values.role, currentStatus: staff.status, reason: values.reason,
        sessionImpact: 'Existing staff sessions will be invalidated. The account keeps its current active/inactive status; administrator access is not granted.',
      }, staff)
    } catch (error) { storageError(error) }
  }

  async function planDevelopmentTask(input: DevelopmentPlanInput) {
    const email = await actor(), values = parse(developmentPlanSchema, input)
    const checks = ['Review the exact branch, repository instructions, and affected source before changes.', 'Add or update behavior and permission regression tests for the requested change.', 'Run pnpm test and inspect every failure.', 'Run pnpm run typecheck and pnpm lint; distinguish pre-existing failures.', 'Run pnpm build in the deployment-compatible environment.', 'Review the diff, migration impact, rollback, and preview before a separately authorized deployment.']
    try {
      return await create(email, 'development.plan', `Plan ${values.kind}: ${values.goal.slice(0,180)}`, values, {
        ...values, repository: 'ALLUSEDAUTOPARTSWAREHOUSE/Allusedautopartwarehouse.com', checks,
        executionStatus: 'not_run', runnerAvailable: false,
        limitation: 'This admin runtime has no connected repository sandbox, test runner, or deployment executor. The saved plan does not execute code or claim test results.',
      })
    } catch (error) { storageError(error) }
  }

  async function getAdminCommandStatus(commandId: string) {
    const email = await actor(), id = parse(commandIdSchema, commandId)
    try {
      const { rows } = await database.query<CommandRow>('SELECT * FROM public.admin_commands WHERE id = $1 AND actor_email = $2', [id, email])
      if (!rows[0]) throw new AdminCommandError('Command not found.', 404, 'COMMAND_NOT_FOUND')
      const events = await database.query<{ action: string; outcome: string; created_at: Date }>('SELECT action,outcome,created_at FROM public.admin_command_events WHERE command_id=$1 AND actor_email=$2 ORDER BY created_at ASC,id ASC LIMIT 50', [id, email])
      return { ...publicCommand(rows[0], now()), events: events.rows.map(event => ({ action: event.action, outcome: event.outcome, createdAt: iso(event.created_at) })) }
    } catch (error) { storageError(error) }
  }

  async function listAdminCommandHistory(limit = 20) {
    const email = await actor()
    if (!Number.isInteger(limit) || limit < 1 || limit > 50) throw new AdminCommandError('Choose a history limit between 1 and 50.')
    try {
      const { rows } = await database.query<CommandRow>('SELECT * FROM public.admin_commands WHERE actor_email=$1 ORDER BY created_at DESC,id DESC LIMIT $2', [email, limit])
      return { checkedAt: now().toISOString(), limit, commands: rows.map(row => publicCommand(row, now())), note: 'History contains commands prepared by this administrator identity. Planned checks are not execution results.' }
    } catch (error) { storageError(error) }
  }

  /** Intentionally NOT exposed as an AI tool. Only the explicit approval route calls this. */
  async function decideAdminCommand(commandId: string, decision: 'approve' | 'deny') {
    const email = await actor(), id = parse(commandIdSchema, commandId)
    if (decision !== 'approve' && decision !== 'deny') throw new AdminCommandError('Choose approve or deny.')
    const client = await database.connect()
    try {
      await client.query('BEGIN')
      const selected = await client.query<CommandRow>('SELECT * FROM public.admin_commands WHERE id=$1 AND actor_email=$2 FOR UPDATE', [id, email])
      const command = selected.rows[0]
      if (!command) throw new AdminCommandError('Command not found.', 404, 'COMMAND_NOT_FOUND')
      // An already committed decision is idempotent; denied/expired/stale commands cannot be revived.
      if ((command.status === 'completed' && decision === 'approve') || (command.status === 'denied' && decision === 'deny')) { await client.query('COMMIT'); return publicCommand(command, now()) }
      if (command.status !== 'pending_approval') throw new AdminCommandError('This command is no longer awaiting approval. Prepare a new command if another change is needed.', 409, 'COMMAND_NOT_PENDING')
      const finish = async (status: CommandStatus, action: string, result: Json) => {
        const updated = await client.query<CommandRow>('UPDATE public.admin_commands SET status=$1,result=$2,decided_at=NOW(),decided_by=$3 WHERE id=$4 RETURNING *', [status, JSON.stringify(result), email, id])
        await audit(client, id, email, action, status, { kind: command.kind })
        await client.query('COMMIT')
        return publicCommand(updated.rows[0], now())
      }
      if (!command.expires_at || new Date(command.expires_at).getTime() <= now().getTime()) return await finish('expired', 'approval_expired', { message: 'The review window expired. Prepare a fresh preview. No staff change was applied.' })
      if (decision === 'deny') return await finish('denied', 'command_denied', { message: 'Command cancelled. No staff change was applied.' })
      if (command.kind === 'staff.create') {
        const values = parse(staffCreationSchema, command.payload)
        // Serialize command-created profiles and recheck the actual directory at approval time.
        await client.query('LOCK TABLE public.staff_members IN SHARE ROW EXCLUSIVE MODE')
        const duplicate = await client.query('SELECT id FROM public.staff_members WHERE lower(trim(email))=$1 LIMIT 1', [values.email])
        if (duplicate.rows.length) return await finish('stale', 'approval_stale', { message: 'This email now belongs to a staff profile. Refresh the directory and prepare a new command.' })
        const staffId = `staff_${newId()}`
        const inserted = await client.query(`INSERT INTO public.staff_members (id,name,email,role,department,title,status,"createdAt","updatedAt")
          VALUES ($1,$2,$3,$4,$5,$6,'active',NOW(),NOW()) RETURNING id,name,email,role,status`, [staffId, values.name, values.email, values.role, values.department || null, values.title || null])
        return await finish('completed', 'staff_profile_created', { message: 'Staff profile created. Login credentials and invitation delivery remain separate.', staff: inserted.rows[0], provisioning: 'profile_only', invitationSent: false, sourceUrl: '/admin/team' })
      }
      if (command.kind === 'staff.role.change') {
        const values = parse(staffRoleChangeSchema, command.payload)
        const found = await client.query<StaffRow>(`SELECT ${STAFF_FIELDS} FROM public.staff_members WHERE id=$1 FOR UPDATE`, [values.staffId])
        const staff = found.rows[0]
        if (!staff || fingerprint(staff) !== command.target_fingerprint) return await finish('stale', 'approval_stale', { message: 'The staff record changed after this preview. No role was changed; prepare a new preview.' })
        await client.query('UPDATE public.staff_members SET role=$1,"updatedAt"=NOW() WHERE id=$2', [values.role, staff.id])
        const revoked = await client.query('UPDATE public.staff_credentials SET session_version=session_version+1,updated_at=NOW() WHERE staff_id=$1', [staff.id])
        return await finish('completed', 'staff_role_changed', { message: 'Staff role updated. Existing staff sessions are invalidated; administrator access was not granted.', staff: { id: staff.id, name: staff.name, email: staff.email, role: values.role, status: staff.status }, previousRole: staff.role, sessionVersionIncremented: (revoked.rowCount || 0) > 0, sourceUrl: '/admin/team' })
      }
      throw new AdminCommandError('This command has no executable staff action.', 409, 'COMMAND_NOT_EXECUTABLE')
    } catch (error) { await client.query('ROLLBACK'); storageError(error) } finally { client.release() }
  }
  return { searchStaff, prepareStaffCreation, prepareStaffRoleChange, planDevelopmentTask, getAdminCommandStatus, listAdminCommandHistory, decideAdminCommand }
}

const commands = createAdminCommandService({ database: pool, session: getAdminSession })
export const { searchStaff, prepareStaffCreation, prepareStaffRoleChange, planDevelopmentTask, getAdminCommandStatus, listAdminCommandHistory, decideAdminCommand } = commands
