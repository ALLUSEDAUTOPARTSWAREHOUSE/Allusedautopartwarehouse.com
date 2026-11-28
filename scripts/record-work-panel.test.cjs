const assert = require('node:assert/strict')
const { readFileSync } = require('node:fs')
const { resolve } = require('node:path')
const test = require('node:test')
const ts = require('typescript')

const root = resolve(__dirname, '..')
const jsx = (type, props) => ({ type, props: props || {} })
function elements(node, type) {
  if (Array.isArray(node)) return node.flatMap(child => elements(child, type))
  if (!node || typeof node !== 'object') return []
  return [...(node.type === type ? [node] : []), ...elements(node.props?.children, type)]
}
function evaluate(path, modules, globals = {}) {
  const output = ts.transpileModule(readFileSync(resolve(root, path), 'utf8'), {
    fileName: path,
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText
  const module = { exports: {} }
  const scopedRequire = name => {
    if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx, Fragment: 'Fragment' }
    if (Object.hasOwn(modules, name)) return modules[name]
    throw new Error(`Unexpected dependency: ${name}`)
  }
  new Function('require', 'module', 'exports', ...Object.keys(globals), output)(scopedRequire, module, module.exports, ...Object.values(globals))
  return module.exports
}
function panelHarness(responses = []) {
  const hooks = []
  let cursor = 0
  let uuid = 0
  const requests = []
  const react = {
    useId: () => 'panel-description',
    useState(initial) {
      const index = cursor++
      if (!(index in hooks)) hooks[index] = typeof initial === 'function' ? initial() : initial
      return [hooks[index], next => { hooks[index] = typeof next === 'function' ? next(hooks[index]) : next }]
    },
    useRef(initial) {
      const index = cursor++
      if (!(index in hooks)) hooks[index] = { current: initial }
      return hooks[index]
    },
  }
  const acknowledge = payload => ({
    ok: true,
    json: async () => ({ ok: true, eventId: payload.eventId, sourceChanged: false, recordedAt: '2026-11-28T12:00:00.000Z' }),
  })
  const module = evaluate('components/admin/record-work-panel.tsx', { react }, {
    crypto: { randomUUID: () => `00000000-0000-4000-8000-${String(++uuid).padStart(12, '0')}` },
    fetch: async (url, options) => {
      const payload = JSON.parse(options.body)
      requests.push({ url, body: options.body, payload })
      return responses.length ? responses.shift()(payload) : acknowledge(payload)
    },
  })
  function render() {
    cursor = 0
    return module.RecordWorkPanel({ recordType: 'order', recordId: 'order-42' })
  }
  const flush = () => new Promise(resolve => setImmediate(resolve))
  return {
    requests, render, acknowledge, flush,
    async submit() { elements(render(), 'form')[0].props.onSubmit({ preventDefault() {} }); await flush() },
    async toggle(open) { render().props.onToggle({ currentTarget: { open } }); await flush() },
    change(type, value) { elements(render(), type)[0].props.onChange({ target: { value } }) },
    feedback() {
      const nodes = elements(render(), 'details')[0].props.children
      return nodes.filter(node => typeof node?.type === 'function').map(node => node.type(node.props)).filter(Boolean)
    },
  }
}

test('uncertain outcome retries send identical payload and event ID until acknowledged, then a new action uses a new ID', async () => {
  const panel = panelHarness([() => { throw new TypeError('connection closed after write') }])
  panel.change('input', 'Customer confirmed the required part')
  await panel.submit()
  assert.equal(panel.feedback()[0].props.role, 'alert')
  assert.match(panel.feedback()[0].props.children[0], /server may have saved it/i)
  await panel.submit()
  assert.equal(panel.requests[1].body, panel.requests[0].body)
  assert.equal(panel.feedback()[0].props.role, 'status')
  assert.match(panel.feedback()[0].props.children[0], /Source status unchanged/)
  await panel.submit()
  assert.notEqual(panel.requests[2].payload.eventId, panel.requests[1].payload.eventId)
})

test('an HTTP failure or malformed acknowledgement keeps the same retry identity', async () => {
  const panel = panelHarness([
    () => ({ ok: false, json: async () => ({ error: 'Storage unavailable' }) }),
    () => ({ ok: true, json: async () => ({ ok: true, eventId: 'different-event', sourceChanged: false }) }),
  ])
  await panel.submit()
  await panel.submit()
  await panel.submit()
  assert.equal(panel.requests.length, 3)
  assert.equal(new Set(panel.requests.map(request => request.body)).size, 1)
  assert.equal(panel.feedback()[0].props.role, 'status')
})

test('changing outcome or evidence creates a distinct action after an uncertain attempt', async () => {
  const fail = () => { throw new TypeError('offline') }
  const panel = panelHarness([fail, fail, fail])
  await panel.submit()
  panel.change('select', 'follow_up')
  await panel.submit()
  panel.change('input', 'Call tomorrow')
  await panel.submit()
  assert.equal(new Set(panel.requests.map(request => request.payload.eventId)).size, 3)
  assert.equal(panel.requests[1].payload.outcome, 'follow_up')
  assert.equal(panel.requests[2].payload.note, 'Call tomorrow')
})

test('record-open and outcome attempts retain independent retry identities and feedback', async () => {
  const panel = panelHarness([() => { throw new TypeError('open response lost') }])
  await panel.toggle(true)
  await panel.submit()
  const retry = elements(panel.render(), 'button').find(node => node.props.children === 'Retry open event')
  retry.props.onClick()
  await panel.flush()
  assert.equal(panel.requests[0].payload.action, 'record_opened')
  assert.equal(panel.requests[1].payload.action, 'outcome_reported')
  assert.notEqual(panel.requests[0].payload.eventId, panel.requests[1].payload.eventId)
  assert.equal(panel.requests[2].body, panel.requests[0].body)
  assert.equal(panel.feedback().length, 2)
  assert.ok(panel.feedback().every(node => node.props.role === 'status'))
  await panel.toggle(false)
  await panel.toggle(true)
  assert.notEqual(panel.requests[3].payload.eventId, panel.requests[0].payload.eventId)
})

test('rapid duplicate submits are held while one request is pending and inputs are disabled', async () => {
  let complete
  const panel = panelHarness([payload => new Promise(resolve => { complete = () => resolve(panel.acknowledge(payload)) })])
  const form = elements(panel.render(), 'form')[0]
  form.props.onSubmit({ preventDefault() {} })
  form.props.onSubmit({ preventDefault() {} })
  assert.equal(panel.requests.length, 1)
  assert.equal(elements(panel.render(), 'form')[0].props['aria-busy'], true)
  assert.equal(elements(panel.render(), 'input')[0].props.disabled, true)
  assert.equal(elements(panel.render(), 'select')[0].props.disabled, true)
  complete()
  await panel.flush()
  assert.equal(elements(panel.render(), 'form')[0].props['aria-busy'], false)
})

function textContent(node) {
  if (Array.isArray(node)) return node.map(textContent).join(' ')
  if (node === null || node === undefined || typeof node === 'boolean') return ''
  if (typeof node !== 'object') return String(node)
  return textContent(node.props?.children)
}
function activityHarness(report, signedIn = true) {
  let reads = 0
  const module = evaluate('app/admin/activity/page.tsx', {
    'next/link': { __esModule: true, default: 'Link' },
    'next/navigation': { redirect() { throw new Error('login redirect') } },
    '@/lib/admin-auth': { getAdminSession: async () => signedIn ? { email: 'admin@example.test' } : null },
    '@/lib/record-activity': { getRecordActivityReport: async () => { reads++; if (report instanceof Error) throw report; return report } },
  })
  return { render: module.default, reads: () => reads }
}
const emptyReport = {
  checkedAt: '2026-11-28T12:00:00.000Z',
  summary: { events: 0, opens: 0, saved_changes: 0, measurement_started_at: null },
  events: [], byAgent: [], limits: { agents: 100, events: 200 }, note: 'Measured activity only.',
}

test('empty activity report shows check time and both empty states without inventing measurement start', async () => {
  const tree = await activityHarness(emptyReport).render()
  const content = textContent(tree)
  assert.match(content, /Report checked at/)
  assert.match(content, /28\/11\/2026/)
  assert.match(content, /No events recorded yet/)
  assert.match(content, /No account activity has been recorded yet/)
  assert.equal(elements(tree, 'table').length, 0)
})

test('unavailable activity data is an accessible error without fabricated zero totals', async () => {
  const tree = await activityHarness(new Error('storage unavailable')).render()
  assert.equal(elements(tree, 'p').filter(node => node.props.role === 'alert').length, 1)
  assert.doesNotMatch(textContent(tree), /Received events/)
  assert.doesNotMatch(textContent(tree), /No events recorded yet/)
})

test('activity authentication precedes any report query', async () => {
  const page = activityHarness(emptyReport, false)
  await assert.rejects(page.render(), /login redirect/)
  assert.equal(page.reads(), 0)
})

test('source-status saves remain distinct from reported outcomes and link to the exact record', async () => {
  const event = { id: 'event-one', actor_name: 'Alice', actor_role: 'sales_agent', record_type: 'order', record_id: 'order-42', action: 'source_status_saved', outcome: 'paid', source_status: 'paid', created_at: '2026-11-28T12:00:00Z', note: 'Source save committed.' }
  const tree = await activityHarness({ ...emptyReport, summary: { ...emptyReport.summary, events: 1, saved_changes: 1, measurement_started_at: event.created_at }, events: [event] }).render()
  const row = elements(tree, 'tbody')[0].props.children[0]
  const cells = elements(row, 'td')
  assert.equal(textContent(cells[3]), 'Source status saved')
  assert.equal(textContent(cells[4]), '—')
  assert.equal(textContent(cells[5]), 'paid')
  assert.equal(elements(row, 'Link')[0].props.href, '/admin/orders?recordId=order-42')
})
