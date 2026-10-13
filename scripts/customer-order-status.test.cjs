const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const ts = require('typescript')
function route(session, rows = []) {
  const calls = []
  const dependencies = {
    '@/lib/auth': { auth: { api: { getSession: async () => session } } },
    '@/lib/db': { pool: { query: async (sql, args) => { calls.push({ sql, args }); return { rows } } } },
  }
  const module = { exports: {} }
  const { outputText } = ts.transpileModule(fs.readFileSync('app/api/customer/order-status/route.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } })
  new Function('require', 'module', 'exports', outputText)(name => dependencies[name], module, module.exports)
  return { get: module.exports.GET, calls }
}
test('unauthenticated lookup never queries orders', async () => {
  const { get, calls } = route(null)
  assert.equal((await get(new Request('https://example.com/api/customer/order-status?orderNumber=123'))).status, 401)
  assert.equal(calls.length, 0)
})
test('lookup scopes exact order to server session ID and excludes guest records', async () => {
  const { get, calls } = route({ user: { id: 'customer-1' } })
  assert.equal((await get(new Request('https://example.com/api/customer/order-status?orderNumber=123&userId=other'))).status, 404)
  assert.deepEqual(calls[0].args, ['123', 'customer-1', 'guest'])
  assert.match(calls[0].sql, /userid = \$2 AND userid <> \$3/)
})
test('response contains recorded status only and is not cached', async () => {
  const { get } = route({ user: { id: 'customer-1' } }, [{ ordernumber: '123', status: 'shipped', createdat: '2026-10-13' }])
  const response = await get(new Request('https://example.com/api/customer/order-status?orderNumber=123'))
  assert.equal(response.headers.get('cache-control'), 'private, no-store')
  assert.deepEqual(await response.json(), { orderNumber: '123', status: 'shipped', createdAt: '2026-10-13' })
})
