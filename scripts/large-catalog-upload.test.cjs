const { test } = require('node:test')
const assert = require('node:assert/strict')
const { readFileSync } = require('node:fs')
const ts = require('typescript')
function load(path, deps = {}) {
  const { outputText } = ts.transpileModule(readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } })
  const module = { exports: {} }
  new Function('require', 'module', 'exports', outputText)(name => deps[name], module, module.exports)
  return module.exports
}
const policy = load('lib/catalog-upload-policy.ts')
test('500 MB boundary is exact and supported extensions are restricted', () => {
  assert.equal(policy.validCatalogUpload('catalog.xlsx', 500_000_000), true)
  for (const size of [0, -1, 500_000_001, NaN, 1.5]) assert.equal(policy.validCatalogUpload('catalog.xlsx', size), false)
  assert.equal(policy.validCatalogUpload('catalog.exe', 10), false)
  assert.equal(policy.validCatalogUpload('catalog.csv', 10), true)
  assert.equal(policy.validCatalogUploadPath('catalog-staging/mazda/12345678-1234-1234-1234-123456789abc.xlsx'), true)
  assert.equal(policy.validCatalogUploadPath('../catalog.xlsx'), false)
})
function route(session, handleUpload, query = async () => ({ rows: [] })) {
  return load('app/api/admin/catalog-upload/route.ts', {
    '@vercel/blob/client': { handleUpload }, '@/lib/admin-auth': { getAdminSession: async () => session },
    '@/lib/brand-catalog': { isValidBrand: brand => brand === 'mazda' },
    '@/lib/db': { pool: { query } }, '@/lib/catalog-upload-records': { ensureCatalogUploads: async () => {} },
    '@/lib/catalog-upload-policy': policy,
  })
}
const request = (type = 'blob.generate-client-token', origin = 'https://store.example') => new Request('https://store.example/api/admin/catalog-upload', { method: 'POST', headers: { origin, 'content-type': 'application/json' }, body: JSON.stringify({ type }) })
test('token authorization requires an admin and same-origin browser', async () => {
  const fail = () => assert.fail('SDK called')
  assert.equal((await route(null, fail).POST(request())).status, 401)
  assert.equal((await route({}, fail).POST(request(undefined, 'https://evil.example'))).status, 403)
  assert.equal((await route({}, fail).POST(request('unknown'))).status, 400)
  assert.equal((await route(null, fail).GET()).status, 401)
})
test('server caps token size and validates brand/path, type and size', async () => {
  process.env.BLOB_READ_WRITE_TOKEN = 'test-only'
  const path = 'catalog-staging/mazda/12345678-1234-1234-1234-123456789abc.xlsx'
  const handler = route({}, async options => {
    const authorize = options.onBeforeGenerateToken
    const result = await authorize(path, JSON.stringify({ name: 'catalog.xlsx', size: 500_000_000 }))
    assert.equal(result.maximumSizeInBytes, 500_000_000)
    assert.equal(result.addRandomSuffix, false)
    for (const [p, payload] of [[path, { name: 'catalog.xlsx', size: 500_000_001 }], [path, { name: 'catalog.exe', size: 20 }], [path.replace('mazda', 'unknown'), { name: 'catalog.xlsx', size: 20 }]]) {
      await assert.rejects(() => authorize(p, JSON.stringify(payload)))
    }
    return { ok: true }
  })
  assert.equal((await handler.POST(request())).status, 200)
})
test('callbacks require SDK verification and only mark matching upload staged', async () => {
  process.env.BLOB_READ_WRITE_TOKEN = 'test-only'
  const path = 'catalog-staging/mazda/12345678-1234-1234-1234-123456789abc.xlsx'
  let updated = false
  const handler = route(null, async options => {
    await assert.rejects(() => options.onUploadCompleted({ blob: { pathname: path }, tokenPayload: '{}' }))
    await options.onUploadCompleted({ blob: { pathname: path, url: 'https://private.example/file' }, tokenPayload: JSON.stringify({ pathname: path }) })
    return { ok: true }
  }, async (sql, args) => { assert.match(sql, /status = 'uploaded'/); assert.equal(args[0], path); updated = true; return { rows: [] } })
  assert.equal((await handler.POST(request('blob.upload-completed'))).status, 200)
  assert.equal(updated, true)
  assert.equal((await route(null, async () => { throw Error('bad signature secret') }).POST(request('blob.upload-completed'))).status, 400)
})
