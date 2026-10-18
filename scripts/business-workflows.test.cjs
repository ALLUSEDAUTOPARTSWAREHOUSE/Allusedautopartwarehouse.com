const { test } = require('node:test')
const assert = require('node:assert/strict')
const { readFileSync } = require('node:fs')
const ts = require('typescript')
const read = path => readFileSync(path, 'utf8')
const moduleOutput = ts.transpileModule(read('lib/admin-workflows.ts'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText
const loaded = { exports: {} }
new Function('module', 'exports', moduleOutput)(loaded, loaded.exports)
const workflows = loaded.exports.BUSINESS_WORKFLOWS

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
test('workflow entry points send defined prompts and remain disabled while streaming', () => {
  const source = read('components/admin/assistant-panel.tsx')
  assert.match(source, /aria-label="Business workflows"/)
  assert.match(source, /disabled=\{busy\}/)
  assert.match(source, /submit\(workflow.prompt\)/)
  assert.match(read('app/admin/ai-workflows/page.tsx'), /AssistantPanel layout="full"/)
})

function tools(getDashboardMetrics) {
  const output = ts.transpileModule(read('lib/admin-assistant.ts'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
  const module = { exports: {} }
  const dependencies = {
    '@/lib/admin-workflows': { BUSINESS_WORKFLOWS: workflows },
    '@/lib/admin-metrics': { getDashboardMetrics },
    ai: { tool: definition => definition, isStepCount: () => null, ToolLoopAgent: class { constructor(config) { Object.assign(this, config) } } },
    zod: { z: require('zod').z },
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
