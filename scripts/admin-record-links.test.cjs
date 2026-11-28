const { test } = require('node:test')
const assert = require('node:assert/strict')
const { readFileSync } = require('node:fs')
const ts = require('typescript')

// Run the actual async page logic with database/navigation boundaries replaced.
// JSX stays structural so these tests exercise scope, authentication and errors.
function loadPage(kind, options = {}) {
  const calls = []
  const exactOrder = { id: 'order-exact', orderNumber: 'AUA-EXACT', status: 'pending' }
  const exactQuote = { id: 73, status: 'new' }
  const jsx = (type, props) => ({ type, props })
  const dependencies = {
    'react/jsx-runtime': { jsx, jsxs: jsx, Fragment: 'fragment' },
    'next/link': { __esModule: true, default: 'Link' },
    'next/navigation': {
      notFound() { const error = new Error('Not found'); error.status = 404; throw error },
      redirect(url) { const error = new Error('Redirect'); error.redirect = url; throw error },
    },
    '@/lib/admin-auth': { getAdminSession: async () => options.authenticated === false ? null : { email: 'admin@example.invalid' } },
    '@/lib/followup': {
      ORDER_STATUSES: ['pending', 'confirmed'], QUOTE_STATUSES: ['new', 'quoted'],
      async getOrderById(id) { calls.push(['exact-order', id]); if (options.failure) throw options.failure; return options.missing ? null : exactOrder },
      async getQuoteLeadById(id) { calls.push(['exact-quote', id]); if (options.failure) throw options.failure; return options.missing ? null : exactQuote },
      async listOrders(status, query) { calls.push(['list-orders', status, query]); return [exactOrder] },
      async listQuoteLeads(status, query) { calls.push(['list-quotes', status, query]); return [exactQuote] },
      async countByStatus(table) { calls.push(['global-counts', table]); return {} },
    },
    '@/lib/followup-assignments': {
      async getActiveSalesSupportStaff() { return [] },
      async getFollowupAssignments(type, ids) { calls.push(['assignments', type, ids]); return new Map() },
    },
    '@/lib/quote-product-info': { getQuoteProductInfo: async () => null },
    '@/components/admin/followup-filters': { FollowupFilters: 'FollowupFilters' },
    '@/components/admin/export-link': { ExportLink: 'ExportLink' },
    '@/components/admin/order-card': { OrderCard: 'OrderCard' },
    '@/components/admin/quote-lead-card': { QuoteLeadCard: 'QuoteLeadCard' },
  }
  const source = readFileSync(`app/admin/${kind}/page.tsx`, 'utf8')
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } })
  const module = { exports: {} }
  new Function('require', 'module', 'exports', outputText)((id) => {
    assert.ok(Object.hasOwn(dependencies, id), `Unexpected dependency: ${id}`)
    return dependencies[id]
  }, module, module.exports)
  return { calls, render: params => module.exports.default({ searchParams: Promise.resolve(params) }) }
}

function elements(tree, type) {
  if (Array.isArray(tree)) return tree.flatMap(child => elements(child, type))
  if (!tree || typeof tree !== 'object') return []
  return [...(tree.type === type ? [tree] : []), ...elements(tree.props?.children, type)]
}

for (const [kind, recordId, lookup, card] of [['orders', 'order-exact', 'exact-order', 'OrderCard'], ['quotes', '73', 'exact-quote', 'QuoteLeadCard']]) {
  test(`${kind} activity link loads exactly its record and hides collection export/filter controls`, async () => {
    const page = loadPage(kind)
    const view = await page.render({ recordId, q: 'unrelated', status: 'unrelated' })
    assert.deepEqual(page.calls.filter(call => call[0] === lookup), [[lookup, kind === 'quotes' ? 73 : recordId]])
    assert.equal(page.calls.some(call => call[0].startsWith('list-') || call[0] === 'global-counts'), false)
    assert.equal(elements(view, card).length, 1)
    assert.equal(elements(view, 'ExportLink').length, 0)
    assert.equal(elements(view, 'FollowupFilters').length, 0)
  })

  test(`${kind} missing exact record returns not found without falling back to all records`, async () => {
    const page = loadPage(kind, { missing: true })
    await assert.rejects(page.render({ recordId }), error => error.status === 404)
    assert.equal(page.calls.some(call => call[0].startsWith('list-') || call[0] === 'global-counts'), false)
  })

  test(`${kind} authentication happens before any record lookup`, async () => {
    const page = loadPage(kind, { authenticated: false })
    await assert.rejects(page.render({ recordId }), error => error.redirect === '/admin/login')
    assert.equal(page.calls.length, 0)
  })

  test(`${kind} database failure remains an error, never an empty/global record list`, async () => {
    const failure = new Error('Database unavailable')
    const page = loadPage(kind, { failure })
    await assert.rejects(page.render({ recordId }), error => error === failure)
    assert.equal(page.calls.some(call => call[0].startsWith('list-')), false)
  })

  test(`${kind} normal collection still applies existing query and status filters`, async () => {
    const page = loadPage(kind)
    const status = kind === 'orders' ? 'pending' : 'new'
    const view = await page.render({ status, q: '  exact query  ' })
    assert.ok(page.calls.some(call => call[0].startsWith('list-') && call[1] === status && call[2] === 'exact query'))
    assert.equal(elements(view, 'FollowupFilters').length, 1)
    assert.equal(elements(view, 'ExportLink').length, 1)
  })
}

test('malformed and repeated exact-record parameters never cause broad lookups', async () => {
  for (const kind of ['orders', 'quotes']) {
    const invalid = kind === 'quotes' ? ['', '0', '-1', '73junk', '1.5', '9007199254740992', ['73','74']] : ['', '   ', 'a'.repeat(65), 'bad\nvalue', ['a','b']]
    for (const recordId of invalid) {
      const page = loadPage(kind)
      await assert.rejects(page.render({ recordId }), error => error.status === 404)
      assert.equal(page.calls.length, 0)
    }
  }
})
