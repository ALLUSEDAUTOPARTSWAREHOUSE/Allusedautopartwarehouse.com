const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const ts = require('typescript')
const pathname = 'catalog-staging/audi/12345678-1234-1234-1234-123456789abc.xlsx'
function route(session, head, query) {
  const output = ts.transpileModule(fs.readFileSync('app/api/admin/catalog-upload/reconcile/route.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText
  const module = { exports: {} }
  const deps = {
    '@vercel/blob': { head }, '@/lib/admin-auth': { getAdminSession: async () => session },
    '@/lib/db': { pool: { query } }, '@/lib/catalog-upload-policy': { validCatalogUploadPath: p => p === pathname },
  }
  new Function('require', 'module', 'exports', output)(n => deps[n], module, module.exports)
  return module.exports.POST
}
function request(origin = 'https://store.example') {
  return new Request('https://store.example/api/admin/catalog-upload/reconcile', { method: 'POST', headers: { origin, 'content-type': 'application/json' }, body: JSON.stringify({ pathname }) })
}
test('recovery requires admin and same-origin before any storage/database access', async () => {
  const fail = () => assert.fail('unexpected access')
  assert.equal((await route(null, fail, fail)(request())).status, 401)
  assert.equal((await route({}, fail, fail)(request('https://other.example'))).status, 403)
})
test('recovery confirms exact stored bytes without importing products', async () => {
  process.env.BLOB_READ_WRITE_TOKEN = 'test-only'
  const writes = []
  const query = async (sql, args) => {
    if (sql.startsWith('SELECT')) return { rows: [{ brand: 'audi', status: 'uploading', expected_bytes: '123' }] }
    writes.push(sql)
    assert.equal(args[0], pathname)
    assert.match(sql, /UPDATE catalog_staged_uploads/)
    assert.match(sql, /AND status = 'uploading'/)
    return { rows: [] }
  }
  for (const size of [122, 123]) {
    const response = await route({}, async p => ({ pathname: p, size, url: 'https://storage.example/file' }), query)(request())
    assert.equal(response.status, size === 123 ? 200 : 409)
  }
  assert.equal(writes.length, 1)
})
test('storage failure does not claim success or change records', async () => {
  process.env.BLOB_READ_WRITE_TOKEN = 'test-only'
  const response = await route({}, async () => { throw Error('private detail') }, async sql => {
    assert.match(sql, /^SELECT/)
    return { rows: [{ brand: 'audi', status: 'uploading', expected_bytes: '123' }] }
  })(request())
  assert.equal(response.status, 503)
  assert.doesNotMatch(await response.text(), /private detail/)
})
