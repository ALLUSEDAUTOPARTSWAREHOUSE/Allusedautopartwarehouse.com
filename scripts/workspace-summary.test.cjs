const { test } = require('node:test')
const assert = require('node:assert/strict')
const { readFileSync } = require('node:fs')
const ts = require('typescript')

function route(session, metrics, chats) {
  const source = readFileSync('app/api/admin/workspace-summary/route.ts', 'utf8')
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  })
  const module = { exports: {} }
  const dependencies = {
    '@/lib/admin-auth': { getAdminSession: async () => session },
    '@/lib/admin-metrics': { getDashboardMetrics: metrics },
    '@/lib/live-chat': { countUnreadForAdmin: chats },
    '@/lib/admin-health': { checkEnvironment: () => [
      { name: 'DATABASE_URL', required: true, set: false },
      { name: 'OPTIONAL', required: false, set: false },
      { name: 'CONFIGURED_SECRET', required: true, set: true },
    ] },
  }
  new Function('require', 'module', 'exports', outputText)(name => dependencies[name], module, module.exports)
  return module.exports.GET
}

test('workspace requires authentication before querying private records', async () => {
  const fail = () => assert.fail('Private records queried')
  assert.equal((await route(null, fail, fail)()).status, 401)
})
test('workspace preserves genuine zero values and disables caching', async () => {
  const response = await route({}, async () => ({ errors: [], actions: { newQuotes: 0 } }), async () => 0)()
  assert.equal(response.headers.get('cache-control'), 'private, no-store')
  const data = await response.json()
  assert.equal(data.unreadConversations, 0)
  assert.equal(data.metrics.actions.newQuotes, 0)
  assert.deepEqual(data.missingRequiredConfiguration, ['DATABASE_URL'])
  assert.ok(data.checkedAt)
})
test('workspace isolates unavailable sources without exposing internal errors', async () => {
  const response = await route({}, async () => ({ errors: [{ section: 'Orders', message: 'sensitive database error' }] }), async () => { throw Error('private') })()
  const data = await response.json()
  assert.equal(data.unreadConversations, null)
  assert.deepEqual(data.metrics.errors, [{ section: 'Orders', message: 'Records unavailable' }])
  assert.doesNotMatch(JSON.stringify(data), /sensitive|private/)
  const failed = await route({}, async () => { throw Error('secret') }, async () => 3)()
  assert.equal((await failed.json()).metrics, null)
})

function overview(summary) {
  const React = require('react')
  const { renderToStaticMarkup } = require('react-dom/server')
  const source = readFileSync('components/admin/workspace-overview.tsx', 'utf8')
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  })
  let state = 0
  const module = { exports: {} }
  const dependencies = {
    react: { useState: () => [state++ === 0 ? summary : false, () => {}], useCallback: fn => fn, useEffect: () => {} },
    'react/jsx-runtime': require('react/jsx-runtime'),
    'next/link': { default: ({ children, ...props }) => React.createElement('a', props, children) },
  }
  new Function('require', 'module', 'exports', outputText)(name => dependencies[name], module, module.exports)
  return renderToStaticMarkup(module.exports.WorkspaceOverview())
}
const summary = {
  checkedAt: '2026-10-18T17:00:00Z', unreadConversations: 0, missingRequiredConfiguration: [],
  metrics: { errors: [], actions: { newQuotes: 0, pendingOrders: 0, staleNewQuotes: 0, stalePendingOrders: 0 }, last30: { revenue: 0 }, awaitingPayment: { orders: 0, amount: 0 } },
}
test('workspace displays genuine zero data and clearly labels revenue risks', () => {
  const html = overview(summary)
  assert.match(html, /\$0\.00/)
  assert.doesNotMatch(html, /Unavailable/)
  assert.match(html, /not confirmed losses/)
})
test('partial metric errors never render fallback zeros as genuine revenue', () => {
  const html = overview({ ...summary, metrics: { ...summary.metrics, errors: [{ section: 'Orders' }] } })
  assert.doesNotMatch(html, /\$0\.00/)
  assert.match(html, /Unavailable/)
  assert.match(html, /Some business records are unavailable/)
})
