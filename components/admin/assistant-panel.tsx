'use client'

import { useId, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { useChat } from '@ai-sdk/react'
import Link from 'next/link'
import { DefaultChatTransport, lastAssistantMessageIsCompleteWithApprovalResponses } from 'ai'
import { AlertCircle, Bot, Check, Clock3, FileText, Loader2, RefreshCw, Send, ShieldCheck, X } from 'lucide-react'
import { BUSINESS_WORKFLOWS } from '@/lib/admin-workflows'
import { ADMIN_DEPARTMENTS, type AdminCommandView } from '@/lib/admin-command-policy'
import { cn } from '@/lib/utils'
import type { AdminAssistantMessage } from '@/lib/admin-assistant'
import type { StaffAssistantMessage } from '@/lib/staff-assistant'

const WORKSPACE_SUGGESTIONS: Record<string, readonly string[]> = {
  all: [
    'Summarize recorded business priorities, source timestamps, unavailable data, and what needs follow-up.',
    'Give me a full operations health report. Separate configuration presence from verified provider connectivity.',
    'Show my recent saved admin commands and their confirmed outcomes.',
    'What should the team prioritize today? Use recorded evidence and explain any unavailable data.',
  ],
  products: [
    'Find catalog pages missing a price. Show exact product references and the total match count.',
    'Search the catalog for a part using the brand, vehicle, and part details I provide.',
    'Find products with illustrative images and prepare the exact Google-feed exclusion list for review.',
  ],
  reports: [
    'Report recorded revenue, orders, and quote outcomes with the time window, time zone, sources, and unavailable sections.',
    'Compare the latest 7 Google feed health snapshots using their actual snapshot dates.',
    'Show recent saved admin commands and distinguish completed changes, pending approvals, and unexecuted plans.',
  ],
  sales: [
    'Review new quote requests waiting for follow-up. State the record limit and the age of each lead.',
    'Prepare a sales follow-up draft from a verified quote request. Ask me which lead to use.',
    'Find pending orders that have not been updated for 24 hours, and explain the evidence and sample limits.',
  ],
  orders: [
    'Look up an exact order number and report its recorded status, amount, timestamps, and source link. Ask me for the order number.',
    'Review the recent order queue and identify recorded items needing follow-up. Do not infer payment or delivery success.',
  ],
  support: [
    'Review open customer chats and identify conversations needing attention, stating which records were checked.',
    'Prepare a support reply from a specific recorded order or conversation. Ask me which record and identify missing facts.',
  ],
  buying: [
    'Review catalog records for the part I need to source. Identify verified attributes and missing supplier or purchase evidence.',
    'Prepare a sourcing checklist from a specific verified part request. Ask me for the record details.',
  ],
  disputes: [
    'Prepare a factual dispute review from the exact order and evidence I provide. Separate verified facts from missing evidence.',
    'List the documents needed to review an order dispute. Do not infer a payment-provider decision.',
  ],
  reputation: [
    'Prepare a service-recovery response using the customer issue and verified facts I provide. Keep it as an unsent draft.',
    'Identify customer follow-up questions from recorded support issues. State that public reviews are not connected.',
  ],
  content: [
    'Draft product content from a catalog record I select. Preserve verified specifications and flag missing facts; do not publish.',
    'Prepare a campaign brief using verified catalog records. Ask for audience and channel when missing.',
  ],
  users: [
    'Find staff accounts and show their recorded roles and active status. Ask which account if the match is ambiguous.',
    'Prepare a new staff profile after asking for the person’s name, email, and permitted role. Show the exact saved preview before approval.',
    'Prepare a role change for an existing staff account. Ask for its exact ID, the new permitted role, and the reason, then show the saved preview.',
  ],
  development: [
    'Prepare a saved regression plan for the admin assistant and staff-command workflow. Mark every check as not run.',
    'Prepare an upgrade plan for a component I identify, including dependencies, rollback, and validation. Ask for the scope first.',
    'Prepare a development plan for the dashboard feature I describe. Report that no code, build, or deployment has been executed.',
  ],
}

const WORKSPACES = [
  { id: 'all', title: 'All operations', description: 'Recorded business insights and saved command history.', prompt: '' },
  ...ADMIN_DEPARTMENTS.map(department => ({ ...department, title: department.id === 'sales' ? 'Sales & leads' : department.title })),
]

type StaffAssistantRole = 'sales_agent' | 'support_team' | 'developer_team'
const STAFF_WORKSPACES: Record<StaffAssistantRole, { id: string; title: string; description: string; prompt: string; suggestions: readonly string[] }> = {
  sales_agent: {
    id: 'sales_agent', title: 'My sales & leads',
    description: 'Your assigned leads and orders. Each record query checks your current staff account and assignment.',
    prompt: 'Use my workspace guide and assigned-record tools only. State record timestamps and the query limit. ',
    suggestions: [
      'Summarize my assigned workload and the recorded status counts.',
      'Show my assigned leads that need follow-up. State which records were read.',
      'Look up one of my assigned orders by its exact order number. Ask me for the number.',
      'Draft a follow-up using a lead assigned to me. Ask which lead and identify missing facts.',
    ],
  },
  support_team: {
    id: 'support_team', title: 'My support work',
    description: 'Your assigned orders and leads, with factual customer-support drafts.',
    prompt: 'Use my workspace guide and assigned-record tools only. Keep customer replies as unsent drafts. ',
    suggestions: [
      'Summarize my assigned work and its recorded status.',
      'Find an order assigned to me using its exact order number and explain the recorded facts.',
      'Prepare a customer-support response for an assigned record I choose. Flag missing evidence and keep it unsent.',
    ],
  },
  developer_team: {
    id: 'developer_team', title: 'Development & regression',
    description: 'Implementation, regression, and upgrade guidance. No customer-record access or execution runner.',
    prompt: 'Use my workspace guide and development-planning tool. Mark all proposed checks as not run. ',
    suggestions: [
      'Prepare a regression checklist for the admin assistant. Separate proposed checks from executed results.',
      'Plan an upgrade for a component I identify. Ask for the version, scope, dependencies, and rollback requirements.',
      'Help plan a dashboard feature from the requirements I provide. No code execution or deployment is requested.',
    ],
  },
}

const TOOL_LABELS: Record<string, string> = {
  getWorkflowGuide: 'Business workflow guide',
  getDepartmentGuide: 'Department guide',
  getBusinessMetrics: 'Recorded business metrics',
  getRecordedWorkReport: 'Recorded team activity',
  getOperationsOverview: 'Operations overview',
  getPriorityWorkQueue: 'Priority work queue',
  getGoogleFeedHistory: 'Google feed history',
  checkWebsiteConfiguration: 'Website configuration check',
  findOrderByNumber: 'Exact order lookup',
  getFeedStats: 'Feed health',
  searchProducts: 'Catalog search',
  listRecentOrders: 'Recent orders',
  listOpenQuotes: 'Quote requests',
  listOpenChats: 'Open customer chats',
  bulkExcludeFromGoogle: 'Google-feed change',
  setProductHidden: 'Product visibility change',
  searchStaff: 'Staff account search',
  prepareStaffCreation: 'Staff creation preview',
  prepareStaffRoleChange: 'Staff role-change preview',
  planDevelopmentTask: 'Development plan',
  getAdminCommandStatus: 'Saved command status',
  listAdminCommandHistory: 'Saved command history',
  getMyWorkspaceGuide: 'My workspace guide',
  getMyWorkload: 'My assigned workload',
  listMyAssignedOrders: 'My assigned orders',
  findMyAssignedOrder: 'Exact assigned-order lookup',
  listMyAssignedLeads: 'My assigned leads',
  planMyDevelopmentTask: 'Development guidance · checks not run',
}

const FIELD_LABELS: Record<string, string> = {
  name: 'Name', email: 'Email', role: 'Role', department: 'Department', title: 'Job title',
  status: 'Status', provisioning: 'Provisioning', nextStep: 'Next step', staffId: 'Staff ID',
  currentRole: 'Current role', newRole: 'Proposed role', currentStatus: 'Current account status', repository: 'Repository', limitation: 'Limitations', reason: 'Reason', sessionImpact: 'Session impact',
  kind: 'Plan type', goal: 'Goal', scope: 'Scope', checks: 'Planned checks', executionStatus: 'Execution status',
  runnerAvailable: 'Execution runner available',
}
const PREVIEW_KEYS = Object.keys(FIELD_LABELS)
const ROLE_LABELS: Record<string, string> = {
  sales_agent: 'Sales agent', support_team: 'Support team', developer_team: 'Developer team',
}

type AssistantMessage = AdminAssistantMessage | StaffAssistantMessage
type Part = AssistantMessage['parts'][number]
type ToolPart = Extract<Part, { toolCallId: string }>
type AdminCommandData = AdminCommandView

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function isAdminCommand(value: unknown): value is AdminCommandData {
  return isRecord(value) && value.type === 'admin-command' && typeof value.commandId === 'string' &&
    value.commandId.length > 0 && value.commandId.length <= 150 && typeof value.status === 'string' &&
    typeof value.kind === 'string' && ['staff.create', 'staff.role.change', 'development.plan'].includes(value.kind) &&
    ['pending_approval', 'planned', 'completed', 'denied', 'expired', 'stale', 'failed'].includes(value.status) &&
    typeof value.summary === 'string' && isRecord(value.preview) && typeof value.createdAt === 'string' &&
    (value.expiresAt === null || typeof value.expiresAt === 'string') &&
    (value.decidedAt === null || typeof value.decidedAt === 'string') && typeof value.approvalUrl === 'string' &&
    (value.result === null || isRecord(value.result)) && typeof value.canApprove === 'boolean'
}

function displayValue(value: unknown, key?: string): string {
  if (value === null || value === undefined || value === '') return 'Not provided'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (typeof value === 'string') {
    if (key && ['role', 'currentRole', 'newRole'].includes(key)) return ROLE_LABELS[value] || value
    if (value === 'profile_only') return 'Staff profile only — credentials still require setup'
    if (value === 'not_run') return 'Not run'
    return value
  }
  return JSON.stringify(value, null, 2) ?? String(value)
}

function formatTime(value?: string | null): string {
  if (!value) return 'Not provided'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Invalid timestamp'
  return new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZoneName: 'short' }).format(date)
}

function safeError(error: unknown, fallback: string): string {
  if (!(error instanceof Error)) return fallback
  try {
    const parsed: unknown = JSON.parse(error.message)
    if (isRecord(parsed) && typeof parsed.error === 'string') return parsed.error.slice(0,350)
  } catch { /* Non-JSON errors are already plain text. */ }
  return error.message.slice(0,350) || fallback
}

function describeAction(part: ToolPart): string {
  const input = isRecord(part.input) ? part.input : undefined
  if (part.type === 'tool-bulkExcludeFromGoogle' && input) {
    const items = Array.isArray(input.items) ? input.items : []
    return `${input.exclude ? 'Exclude' : 'Re-include'} ${items.length} page${items.length === 1 ? '' : 's'} ${input.exclude ? 'from' : 'in'} the Google feed`
  }
  if (part.type === 'tool-setProductHidden' && input) {
    return `${input.hidden ? 'Hide' : 'Unhide'} ${String(input.brand)}/${String(input.slug)}`
  }
  return TOOL_LABELS[part.type.replace(/^tool-/, '')] || 'Review the proposed action'
}

export function AssistantPanel({ layout = 'compact', staffRole }: { layout?: 'compact' | 'full'; staffRole?: StaffAssistantRole }) {
  const [input, setInput] = useState('')
  const [workspace, setWorkspace] = useState<string>(staffRole || 'all')
  const [submitError, setSubmitError] = useState('')
  const inputId = useId()
  const workspaceId = useId()
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const submitting = useRef(false)
  const { messages, sendMessage, addToolApprovalResponse, status, error } = useChat<AssistantMessage>({
    transport: new DefaultChatTransport({ api: staffRole ? '/api/staff/assistant' : '/api/admin/assistant' }),
    sendAutomaticallyWhen: staffRole ? undefined : lastAssistantMessageIsCompleteWithApprovalResponses,
  })
  const busy = status === 'submitted' || status === 'streaming'
  const availableWorkspaces = staffRole ? [STAFF_WORKSPACES[staffRole]] : WORKSPACES
  const currentWorkspace = availableWorkspaces.find(item => item.id === workspace) || availableWorkspaces[0]
  const suggestions = staffRole ? STAFF_WORKSPACES[staffRole].suggestions : WORKSPACE_SUGGESTIONS[workspace] || WORKSPACE_SUGGESTIONS.all

  async function submit(text: string) {
    const trimmed = text.trim()
    if (!trimmed || busy || submitting.current) return
    submitting.current = true
    setSubmitError('')
    setInput('')
    try {
      const context = workspace === 'all' ? '' : `Workspace: ${currentWorkspace.title}. ${currentWorkspace.prompt}\n\nRequest: `
      await sendMessage({ text: context + trimmed })
    } catch (err) {
      setInput(trimmed)
      setSubmitError(safeError(err, 'The request could not be sent. Please try again.'))
    } finally {
      submitting.current = false
    }
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    void submit(input)
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      if (event.nativeEvent.isComposing || event.keyCode === 229) return
      event.preventDefault()
      void submit(input)
    }
  }

  function draftSuggestion(text: string) {
    setInput(text)
    inputRef.current?.focus()
  }

  return (
    <section aria-label="AI assistant" className="flex flex-col overflow-hidden rounded-xl border border-border bg-card">
      <header className="flex items-start gap-3 border-b border-border px-4 py-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground"><Bot className="size-4" aria-hidden="true" /></span>
        <div>
          <h2 className="text-sm font-bold text-foreground">{staffRole ? `${ROLE_LABELS[staffRole]} assistant` : 'AUAPW Operations Agent'}</h2>
          <p className="text-xs text-muted-foreground">{staffRole ? STAFF_WORKSPACES[staffRole].description : 'Recorded business insights, department guidance, and reviewable staff commands in your existing dashboard.'}</p>
        </div>
      </header>

      <div className="space-y-3 border-b border-border p-3">
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor={workspaceId} className="text-xs font-semibold">Workspace</label>
          <select id={workspaceId} value={workspace} disabled={busy || Boolean(staffRole)} onChange={event => setWorkspace(event.target.value)} className="min-w-40 flex-1 rounded-md border border-input bg-background px-3 py-2 text-xs disabled:opacity-50">
            {availableWorkspaces.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}
          </select>
        </div>
        <p className="text-xs text-muted-foreground">{currentWorkspace.description} Workspace selection does not change account permissions.</p>
        <details>
          <summary className="cursor-pointer text-xs font-semibold text-foreground">Choose a command to edit</summary>
          <div className="mt-2 flex flex-col gap-2">
            {suggestions.map(suggestion => <button key={suggestion} type="button" disabled={busy} onClick={() => draftSuggestion(suggestion)} className="rounded-lg border border-border px-3 py-2 text-left text-xs text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50">{suggestion}</button>)}
          </div>
        </details>
        {!staffRole ? <details>
          <summary className="cursor-pointer text-xs text-muted-foreground">Business workflow shortcuts</summary>
          <nav aria-label="Business workflows" className="mt-2 flex flex-wrap gap-2">
            {BUSINESS_WORKFLOWS.map(workflow => <button key={workflow.id} type="button" disabled={busy} title={workflow.description} onClick={() => draftSuggestion(workflow.prompt)} className="rounded-lg border border-border px-3 py-2 text-xs font-semibold hover:bg-muted disabled:opacity-50">{workflow.title}</button>)}
          </nav>
        </details> : null}
      </div>

      <div role="log" aria-label="Assistant conversation" className={cn('flex flex-col gap-3 overflow-y-auto p-4', layout === 'full' ? 'max-h-[65vh] min-h-[28rem]' : 'max-h-[28rem] min-h-40')} aria-live="polite" aria-relevant="additions text">
        {messages.length === 0 ? (
          <div className="space-y-3 text-xs text-muted-foreground">
            <p>Choose a workspace and ask about a real record, report, or task. The assistant reports the evidence it can read and the information still missing.</p>
            <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/40 p-3"><ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" /><p>{staffRole ? staffRole === 'developer_team' ? 'Development output is planning guidance. No code, tests, upgrades, or deployments are executed, and no customer records are available to this assistant.' : 'Only records assigned to your current staff account are available to this assistant. Replies remain unsent drafts; this assistant cannot change records or staff access.' : 'Staff creation and role changes require approval of an exact saved preview. Development, regression, and upgrade commands produce plans; no code runner or deployment is connected.'}</p></div>
            <button type="button" disabled={busy} onClick={() => draftSuggestion(suggestions[0])} className="rounded-md border border-border px-3 py-2 font-medium text-foreground hover:bg-muted disabled:opacity-50">Start with a suggested command</button>
          </div>
        ) : messages.map(message => (
          <div key={message.id} className={cn('flex flex-col gap-2', message.role === 'user' ? 'items-end' : 'items-start')}>
            {message.parts.map((part, index) => {
              if (part.type === 'text') {
                if (!part.text) return null
                return <div key={index} className={cn('max-w-[95%] whitespace-pre-wrap break-words rounded-lg px-3 py-2 text-sm', message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground')}>{part.text}</div>
              }
              if (!('toolCallId' in part)) return null
              return <ToolPartView key={part.toolCallId} part={part} onRespond={addToolApprovalResponse} allowAdminCommands={!staffRole} />
            })}
          </div>
        ))}
        {status === 'submitted' ? <p className="flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="size-3 animate-spin" aria-hidden="true" />Checking the request…</p> : null}
        {error || submitError ? <p className="text-xs text-destructive" role="alert">{submitError || safeError(error, 'The assistant request failed. No successful change is confirmed by this error.')}</p> : null}
      </div>

      <form onSubmit={onSubmit} className="flex items-end gap-2 border-t border-border p-3">
        <label htmlFor={inputId} className="sr-only">Ask the assistant</label>
        <textarea ref={inputRef} id={inputId} value={input} onChange={event => setInput(event.target.value)} onKeyDown={onKeyDown} rows={2} maxLength={6000} placeholder={`Ask about ${currentWorkspace.title.toLowerCase()}…`} className="min-h-10 flex-1 resize-y rounded-md border border-input bg-background px-3 py-2 text-sm" />
        <button type="submit" disabled={busy || !input.trim()} className="flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-50">
          {busy ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Send className="size-4" aria-hidden="true" />}<span className="sr-only sm:not-sr-only">Ask</span>
        </button>
      </form>
    </section>
  )
}

function ToolPartView({ part, onRespond, allowAdminCommands }: { part: ToolPart; onRespond: (response: { id: string; approved: boolean }) => void | PromiseLike<void>; allowAdminCommands: boolean }) {
  const [decisionPending, setDecisionPending] = useState(false)
  const [decisionError, setDecisionError] = useState('')
  const responding = useRef(false)
  const name = part.type.replace(/^tool-/, '')
  const label = TOOL_LABELS[name] || name
  const output = part.state === 'output-available' ? part.output : undefined

  async function respond(id: string, approved: boolean) {
    if (responding.current) return
    responding.current = true
    setDecisionPending(true)
    setDecisionError('')
    try { await onRespond({ id, approved }) }
    catch (err) { setDecisionError(safeError(err, 'The approval could not be submitted.')); responding.current = false; setDecisionPending(false) }
  }

  if (!allowAdminCommands && (isAdminCommand(output) || part.state === 'approval-requested' || (isRecord(output) && Array.isArray(output.commands)))) return <p role="alert" className="text-xs text-destructive">Administrative commands are not available in this staff assistant.</p>
  if (!allowAdminCommands && name === 'planMyDevelopmentTask' && isRecord(output) && output.executionStatus === 'not_run') {
    const checks = Array.isArray(output.checks) ? output.checks.filter((check): check is string => typeof check === 'string') : []
    return <section className="w-full space-y-3 rounded-lg border border-border bg-background p-3" aria-label="Development planning guidance"><p className="flex items-center gap-2 text-xs font-semibold"><FileText className="size-4" aria-hidden="true" />Development guidance · not executed</p><p className="text-sm text-foreground">{typeof output.goal === 'string' ? output.goal : 'Proposed development work'}</p>{checks.length ? <ol className="list-inside list-decimal space-y-2 text-xs text-muted-foreground">{checks.map((check,index) => <li key={index}>{check}</li>)}</ol> : null}<p className="rounded bg-muted p-2 text-xs text-muted-foreground">{typeof output.limitation === 'string' ? output.limitation : 'This is unsaved planning guidance. No code, tests, upgrades, builds, or deployments have run.'}</p></section>
  }
  if (isAdminCommand(output)) return <AdminCommandCard key={output.commandId} initialCommand={output} />
  if (isRecord(output) && Array.isArray(output.commands)) {
    const commands = output.commands.filter(isAdminCommand)
    if (commands.length) return <div className="flex w-full flex-col gap-3"><p className="text-xs font-semibold text-muted-foreground">Saved commands · {commands.length} returned</p>{commands.map(command => <AdminCommandCard key={command.commandId} initialCommand={command} />)}</div>
  }

  if (part.state === 'approval-requested' && 'approval' in part && part.approval && !part.approval.isAutomatic) {
    const approvalId = part.approval.id
    const input = isRecord(part.input) ? part.input : {}
    const products = Array.isArray(input.items) ? input.items.filter(isRecord) : []
    return (
      <div className="flex w-full max-w-full flex-col gap-3 rounded-lg border border-primary/40 bg-primary/5 p-3">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary"><ShieldCheck className="size-4" aria-hidden="true" />Approval needed · Review proposed catalog change</p>
        <p className="text-sm text-foreground">{describeAction(part)}</p>
        {products.length ? <details open><summary className="cursor-pointer text-xs font-semibold">Exact product list ({products.length})</summary><ul className="mt-2 max-h-40 space-y-1 overflow-auto rounded-md border border-border bg-background p-2 text-xs">{products.map((product, index) => <li key={`${String(product.brand)}/${String(product.slug)}/${index}`} className="break-all">{String(product.brand)}/{String(product.slug)}</li>)}</ul></details> : null}
        <p className="text-xs text-muted-foreground">Approving submits this exact change. Its result will be reported after the server responds.</p>
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={decisionPending} onClick={() => void respond(approvalId, true)} className="flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-50">{decisionPending ? <Loader2 className="size-3 animate-spin" aria-hidden="true" /> : <Check className="size-3" aria-hidden="true" />}Approve exact change</button>
          <button type="button" disabled={decisionPending} onClick={() => void respond(approvalId, false)} className="flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-50"><X className="size-3" aria-hidden="true" />Cancel</button>
        </div>
        {decisionError ? <p role="alert" className="text-xs text-destructive">{decisionError}</p> : null}
      </div>
    )
  }

  const failedOutput = isRecord(output) && (output.ok === false || output.available === false)
  const partialOutput = isRecord(output) && ((Array.isArray(output.unavailableSections) && output.unavailableSections.length > 0) || (isRecord(output.sourceAvailability) && Object.values(output.sourceAvailability).some(value => value === false)))
  const declined = part.state === 'output-denied' || (part.state === 'approval-responded' && 'approval' in part && part.approval?.approved === false)
  const failed = part.state === 'output-error' || failedOutput
  const pending = !declined && ['input-streaming', 'input-available', 'approval-responded', 'approval-requested'].includes(part.state)
  const stateLabel = declined ? 'Declined' : failed ? 'Failed or unavailable' : pending ? 'In progress' : partialOutput ? 'Partial result' : part.state === 'output-available' ? 'Result received' : 'Awaiting result'
  const message = isRecord(output) && typeof output.message === 'string' ? output.message : ''

  return <div className={cn('flex flex-col gap-1 text-xs', failed ? 'text-destructive' : 'text-muted-foreground')}>
    <p className="flex items-center gap-1.5">{pending ? <Loader2 className="size-3 shrink-0 animate-spin" aria-hidden="true" /> : declined ? <X className="size-3 shrink-0" aria-hidden="true" /> : failed || partialOutput ? <AlertCircle className="size-3 shrink-0" aria-hidden="true" /> : <Check className="size-3 shrink-0" aria-hidden="true" />}<span>{label} · {stateLabel}</span></p>
    {message ? <p className="whitespace-pre-wrap break-words pl-5">{message}</p> : null}
    {failed && !message ? <p className="pl-5">No successful change or complete result was confirmed.</p> : null}
  </div>
}

function AdminCommandCard({ initialCommand }: { initialCommand: AdminCommandData }) {
  const [confirmedCommand, setConfirmedCommand] = useState<AdminCommandData | null>(null)
  const [pending, setPending] = useState<'approve' | 'deny' | 'refresh' | null>(null)
  const [error, setError] = useState('')
  const [refreshRequired, setRefreshRequired] = useState(false)
  const inFlight = useRef(false)
  const command = confirmedCommand || initialCommand
  const isPlan = command.kind === 'development.plan'
  const completed = command.status === 'completed'
  const declined = ['denied', 'rejected', 'cancelled'].includes(command.status)
  const failed = ['failed', 'expired', 'stale'].includes(command.status)
  const awaiting = command.status === 'pending_approval'
  const expired = command.status === 'expired'
  const canDecide = awaiting && command.canApprove && !isPlan && !expired && !refreshRequired
  const endpoint = `/api/admin/commands/${encodeURIComponent(command.commandId)}`
  const fields = PREVIEW_KEYS.filter(key => Object.prototype.hasOwnProperty.call(command.preview, key))
  const statusLabel = isPlan && command.status === 'planned' ? 'Plan saved · not executed' : completed ? 'Completed' : declined ? 'Declined' : expired && awaiting ? 'Approval expired' : command.status.replace(/_/g, ' ')

  async function requestStatus(decision?: 'approve' | 'deny') {
    if (inFlight.current || (decision && !canDecide)) return
    if (decision && command.expiresAt && Date.parse(command.expiresAt) <= Date.now()) {
      setRefreshRequired(true)
      setError('This preview has expired. Refresh its saved status and prepare a new command.')
      return
    }
    inFlight.current = true
    setPending(decision || 'refresh')
    setError('')
    try {
      const response = await fetch(endpoint, {
        method: decision ? 'POST' : 'GET',
        credentials: 'same-origin',
        cache: 'no-store',
        headers: decision ? { 'Content-Type': 'application/json', Accept: 'application/json' } : { Accept: 'application/json' },
        body: decision ? JSON.stringify({ decision }) : undefined,
        signal: AbortSignal.timeout(30_000),
      })
      const data: unknown = await response.json().catch(() => null)
      const candidate = isAdminCommand(data) ? data : isRecord(data) && isAdminCommand(data.command) ? data.command : null
      const updated = candidate?.commandId === command.commandId ? candidate : null
      if (updated) {
        setConfirmedCommand(updated)
        setRefreshRequired(false)
      }
      if (!response.ok) {
        if (!updated && decision) setRefreshRequired(true)
        throw new Error(isRecord(data) && typeof data.error === 'string' ? data.error : response.status === 401 ? 'Your session has expired. Sign in again before reviewing this command.' : 'The server could not confirm the command outcome.')
      }
      if (!updated) {
        setRefreshRequired(true)
        throw new Error('No verified command status was returned. Refresh status before attempting another action.')
      }
    } catch (err) {
      if (decision) setRefreshRequired(true)
      setError(safeError(err, 'The command outcome could not be confirmed. Refresh its status before retrying.'))
    } finally {
      inFlight.current = false
      setPending(null)
    }
  }

  return (
    <section aria-label={`Saved command: ${command.summary}`} className="w-full space-y-3 rounded-lg border border-border bg-background p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-semibold">{isPlan ? <FileText className="size-4" aria-hidden="true" /> : completed ? <Check className="size-4 text-emerald-600" aria-hidden="true" /> : declined ? <X className="size-4" aria-hidden="true" /> : failed ? <AlertCircle className="size-4 text-destructive" aria-hidden="true" /> : <ShieldCheck className="size-4 text-primary" aria-hidden="true" />}<span>{isPlan ? 'Saved execution plan' : 'Saved administrative command'}</span></div>
        <span className={cn('rounded-full px-2 py-1 text-[10px] font-semibold capitalize', completed ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : failed ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground')}>{statusLabel}</span>
      </div>
      <p className="text-sm font-semibold text-foreground">{command.summary}</p>
      <dl className="divide-y divide-border rounded-md border border-border text-xs">
        {fields.map(key => <div key={key} className="grid grid-cols-[minmax(6rem,1fr)_minmax(0,2fr)] gap-3 p-2"><dt className="text-muted-foreground">{FIELD_LABELS[key]}</dt><dd className="whitespace-pre-wrap break-words text-foreground">{Array.isArray(command.preview[key]) ? <ul className="list-inside list-disc space-y-1">{(command.preview[key] as unknown[]).map((value,index) => <li key={index}>{displayValue(value)}</li>)}</ul> : displayValue(command.preview[key], key)}</dd></div>)}
      </dl>
      <div className="space-y-1 text-[10px] text-muted-foreground"><p className="break-all">Command ID: {command.commandId}</p>{command.createdAt ? <p>Saved: {formatTime(command.createdAt)}</p> : null}{command.expiresAt ? <p className="flex items-center gap-1"><Clock3 className="size-3" aria-hidden="true" />Approval expires: {formatTime(command.expiresAt)}</p> : null}</div>
      {isPlan ? <p className="rounded-md bg-muted p-2 text-xs text-muted-foreground">This is a saved plan. Its checks have not run, and no code changes, upgrades, builds, or deployments have been executed.</p> : awaiting ? <p className="text-xs text-muted-foreground">Review the exact person, email, role, and impact above. Approval executes the saved values, subject to the server’s current permission and stale-data checks.</p> : null}
      {command.kind === 'staff.create' ? <p className="text-xs text-muted-foreground">A staff profile does not supply a password or send an invitation. Complete the existing credential setup before the person can sign in.</p> : null}
      {command.result ? <ServerCommandResult result={command.result} /> : null}
      {command.events?.length ? <details><summary className="cursor-pointer text-xs font-semibold text-foreground">Recorded command activity ({command.events.length})</summary><ol className="mt-2 space-y-2 border-l border-border pl-3 text-xs text-muted-foreground">{command.events.map((event,index) => <li key={`${event.createdAt}-${index}`}><p className="text-foreground">{event.action.replace(/_/g, ' ')} · {event.outcome.replace(/_/g, ' ')}</p><time dateTime={event.createdAt}>{formatTime(event.createdAt)}</time></li>)}</ol></details> : null}
      {error ? <p role="alert" className="text-xs text-destructive">{error}</p> : null}
      {refreshRequired ? <p className="text-xs text-muted-foreground">The displayed outcome may be out of date. Refresh status before submitting another decision.</p> : null}
      <div className="flex flex-wrap gap-2">
        {canDecide ? <><button type="button" disabled={pending !== null} onClick={() => void requestStatus('approve')} className="flex items-center gap-1 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50">{pending === 'approve' ? <Loader2 className="size-3 animate-spin" aria-hidden="true" /> : <Check className="size-3" aria-hidden="true" />}Approve exact change</button><button type="button" disabled={pending !== null} onClick={() => void requestStatus('deny')} className="flex items-center gap-1 rounded-md border border-border px-3 py-2 text-xs font-semibold hover:bg-muted disabled:opacity-50"><X className="size-3" aria-hidden="true" />Decline</button></> : null}
        <button type="button" disabled={pending !== null} onClick={() => void requestStatus()} className="flex items-center gap-1 rounded-md border border-border px-3 py-2 text-xs font-medium hover:bg-muted disabled:opacity-50">{pending === 'refresh' ? <Loader2 className="size-3 animate-spin" aria-hidden="true" /> : <RefreshCw className="size-3" aria-hidden="true" />}Refresh saved status</button>
      </div>
    </section>
  )
}

function ServerCommandResult({ result }: { result: Record<string, unknown> }) {
  const keys = Object.keys(result).filter(key => !['message', 'sourceUrl'].includes(key) && !/password|secret|token|credential/i.test(key))
  return <section className="space-y-2 rounded-md border border-border bg-muted/40 p-3" aria-label="Confirmed server result">
    <h4 className="text-xs font-semibold">Confirmed server result</h4>
    {typeof result.message === 'string' ? <p className="text-xs text-foreground">{result.message}</p> : null}
    <dl className="space-y-2 text-xs">
      {keys.map(key => <div key={key} className="space-y-1"><dt className="font-medium text-muted-foreground">{key.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/_/g, ' ')}</dt><dd className="whitespace-pre-wrap break-words text-foreground">{isRecord(result[key]) ? <dl className="grid grid-cols-[minmax(5rem,1fr)_minmax(0,2fr)] gap-x-3 gap-y-1 rounded border border-border bg-background p-2">{Object.entries(result[key]).filter(([field]) => !/password|secret|token|credential/i.test(field)).map(([field,value]) => <div className="contents" key={field}><dt className="text-muted-foreground">{FIELD_LABELS[field] || field}</dt><dd className="break-words">{displayValue(value,field)}</dd></div>)}</dl> : displayValue(result[key],key)}</dd></div>)}
    </dl>
    {result.sourceUrl === '/admin/team' ? <Link href="/admin/team" className="inline-block text-xs font-medium text-primary underline">Open team directory</Link> : null}
  </section>
}
