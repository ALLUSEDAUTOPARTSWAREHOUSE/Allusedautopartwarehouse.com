const { test } = require('node:test')
const assert = require('node:assert/strict')
const { readFileSync } = require('node:fs')
const ts = require('typescript')
const read = path => readFileSync(path, 'utf8')
const moduleOutput = ts.transpileModule(read('lib/admin-workflows.ts'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText
const loaded = { exports: {} }
new Function('module', 'exports', moduleOutput)(loaded, loaded.exports)
const workflows = loaded.exports.BUSINESS_WORKFLOWS
const policyOutput = ts.transpileModule(read('lib/admin-command-policy.ts'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText
const policyModule = { exports: {} }
new Function('require', 'module', 'exports', policyOutput)(require, policyModule, policyModule.exports)
const commandPolicy = policyModule.exports

test('five distinct workflows provide actionable prompts and evidence boundaries', () => {
  assert.deepEqual(workflows.map(item => item.id), ['marketing', 'audit', 'data', 'product', 'sales'])
  for (const item of workflows) {
    assert.ok(item.prompt.length > 60)
    assert.ok(item.instructions.length > 150)
  }
  assert.match(workflows[0].instructions, /Never publish or send/)
  assert.match(workflows[1].instructions, /mark unverified/)
  assert.match(workflows[2].instructions, /Do not execute arbitrary SQL/)
  assert.match(workflows[3].instructions, /acceptance criteria/)
  assert.match(workflows[4].instructions, /Do not send, book or update customer records/)
})
test('assistant loads server-side workflow guidance without bypassing write approvals', () => {
  const source = read('lib/admin-assistant.ts')
  assert.match(source, /getWorkflowGuide: tool\(/)
  assert.match(source, /getBusinessMetrics: tool\(/)
  assert.match(source, /unavailableSections/)
  assert.match(source, /bulkExcludeFromGoogle: "user-approval"/)
  assert.match(source, /setProductHidden: "user-approval"/)
  assert.match(source, /first load getWorkflowGuide/)
})
test('workflow entry points draft editable prompts and remain disabled while streaming', () => {
  const source = read('components/admin/assistant-panel.tsx')
  assert.match(source, /aria-label="Business workflows"/)
  assert.match(source, /disabled=\{busy\}/)
  assert.match(source, /draftSuggestion\(workflow.prompt\)/)
  assert.match(source, /function draftSuggestion\(text: string\)\s*\{\s*setInput\(text\)/)
  assert.match(source, /void submit\(input\)/)
  assert.match(read('app/admin/ai-workflows/page.tsx'), /AssistantPanel layout="full"/)
})

function tools(getDashboardMetrics, overrides = {}) {
  const output = ts.transpileModule(read('lib/admin-assistant.ts'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
  const module = { exports: {} }
  const dependencies = {
    '@/lib/admin-workflows': { BUSINESS_WORKFLOWS: workflows },
    '@/lib/ai/model-config': { getAdminAssistantModel: () => 'test-model' },
    '@/lib/admin-command-policy': commandPolicy,
    '@/lib/admin-auth': { getAdminSession: async () => ({ email: 'admin@example.com' }) },
    '@/lib/admin-metrics': { getDashboardMetrics },
    ai: { tool: definition => definition, isStepCount: () => null, ToolLoopAgent: class { constructor(config) { Object.assign(this, config) } } },
    zod: { z: require('zod').z },
    ...overrides,
  }
  new Function('require', 'module', 'exports', output)(name => dependencies[name] || {}, module, module.exports)
  return module.exports.adminAssistant.tools
}
test('guide tool returns the selected workflow and rejects unknown ids', async () => {
  const guide = tools().getWorkflowGuide
  for (const workflow of workflows) assert.deepEqual(await guide.execute({ workflow: workflow.id }), workflow)
  assert.equal(guide.inputSchema.safeParse({ workflow: 'execute-shell' }).success, false)
})
test('metrics tool omits customer records and raw database errors', async () => {
  const metrics = tools(async () => ({
    generatedAt: '2026-10-18T17:00:00Z', timeZone: 'America/Chicago',
    last30: { revenue: 0 }, recentOrders: [{ customerName: 'Private' }], recentQuotes: [{ name: 'Private' }],
    errors: [{ section: 'Orders', message: 'database connection secret' }],
  }))
  const result = await metrics.getBusinessMetrics.execute({})
  assert.deepEqual(result.unavailableSections, ['Orders'])
  assert.equal(result.timeZone, 'America/Chicago')
  assert.equal(result.sourceUrl, '/admin/dashboard')
  assert.doesNotMatch(JSON.stringify(result), /Private|connection secret|recentOrders|recentQuotes/)
  assert.match(result.note, /do not report them as genuine totals/)
})
test('metrics tool reports unavailable instead of fabricated success', async () => {
  const result = await tools(async () => { throw Error('secret') }).getBusinessMetrics.execute({})
  assert.equal(result.available, false)
  assert.ok(result.checkedAt)
  assert.doesNotMatch(JSON.stringify(result), /secret/)
})

test('recorded work tool returns source evidence and omits freeform notes and internal actor identifiers', async () => {
  const report = {
    checkedAt: '2026-11-28T12:00:00Z', sourceUrl: '/admin/activity', scope: 'All recorded dashboard activity',
    summary: { events: 9, opens: 6, saved_changes: 1, measurement_started_at: '2026-11-28T10:00:00Z', private: 'hidden-summary' },
    byAgent: [{ actor_id: 'private-agent-id', actor_name: 'Agent A', actor_role: 'sales_agent', opens: 6, confirmed: 1, unable: 0, follow_up: 1, last_activity: '2026-11-28T11:00:00Z' }],
    events: [{ actor_id: 'private-agent-id', actor_name: 'Agent A', actor_role: 'sales_agent', record_type: 'quote', record_id: 'lead_123', action: 'outcome_reported', outcome: 'confirmed', source_status: 'new', created_at: '2026-11-28T11:00:00Z', note: 'private-note' }],
    limits: { events: 200, agents: 100 }, note: 'Reported outcomes are not proof of payment. Events before enablement are not reconstructed.',
  }
  const result = await tools(undefined, { '@/lib/record-activity': { getRecordActivityReport: async () => report } }).getRecordedWorkReport.execute({})
  assert.equal(result.available, true)
  assert.equal(result.sourceUrl, '/admin/activity')
  assert.equal(result.summary.measurementStartedAt, '2026-11-28T10:00:00Z')
  assert.equal(result.events[0].recordId, 'lead_123')
  assert.equal(result.events[0].sourceStatus, 'new')
  assert.equal(result.byAgent[0].confirmed, 1)
  assert.deepEqual(result.limits, { events: 200, agents: 100 })
  assert.doesNotMatch(JSON.stringify(result), /private-agent-id|private-note|hidden-summary/)
})

test('recorded work tool requires admin authorization and reports storage failure without fake totals', async () => {
  let reads = 0
  const dependencies = { '@/lib/admin-auth': { getAdminSession: async () => null }, '@/lib/record-activity': { getRecordActivityReport: async () => { reads++; throw Error('database-secret') } } }
  await assert.rejects(tools(undefined, dependencies).getRecordedWorkReport.execute({}), /Administrator sign-in/)
  assert.equal(reads, 0)
  dependencies['@/lib/admin-auth'].getAdminSession = async () => ({ email: 'admin@example.com' })
  const result = await tools(undefined, dependencies).getRecordedWorkReport.execute({})
  assert.equal(result.available, false)
  assert.ok(result.checkedAt)
  assert.equal(result.summary, undefined)
  assert.doesNotMatch(JSON.stringify(result), /database-secret/)
})
