const { test } = require('node:test')
const assert = require('node:assert/strict')
const { readFileSync } = require('node:fs')
const ts = require('typescript')

function route(storedBytes, expectedBytes = 4) {
  let reads = 0
  let imports = 0
  const stream = new ReadableStream({
    pull(controller) {
      reads++
      controller.enqueue(new Uint8Array(4))
      controller.close()
    },
  }, { highWaterMark: 0 })
  const dependencies = {
    '@vercel/blob': { get: async () => ({ statusCode: 200, blob: { size: storedBytes }, stream }) },
    'next/cache': { revalidatePath() {} },
    '@/lib/admin-auth': { getAdminSession: async () => ({}) },
    '@/lib/catalog-upload-records': { ensureCatalogUploads: async () => {} },
    '@/lib/catalog-upload-policy': { validCatalogUploadPath: () => true },
    '@/lib/manual-products': { importProductSheet: async () => { imports++; return { inserted: 1 } } },
    '@/lib/brand-catalog': { isValidBrand: () => true, BRAND_DIRECTORY: [] },
    '@/lib/db': { pool: { query: async () => ({ rows: [{ brand: 'mazda', status: 'uploaded', expected_bytes: String(expectedBytes) }] }) } },
  }
  const module = { exports: {} }
  const { outputText } = ts.transpileModule(readFileSync('app/api/admin/catalog-upload/import/route.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  })
  new Function('require', 'module', 'exports', outputText)(name => dependencies[name], module, module.exports)
  return {
    run: () => module.exports.POST(new Request('https://store.example/api/admin/catalog-upload/import', {
      method: 'POST', body: JSON.stringify({ pathname: 'catalog-staging/mazda/file.xlsx', action: 'preview' }),
    })),
    reads: () => reads,
    imports: () => imports,
  }
}

test('invalid or oversized authoritative sizes are rejected before reading the stream', async () => {
  process.env.BLOB_READ_WRITE_TOKEN = 'test-only'
  for (const size of [500_000_000, 20 * 1024 * 1024 + 1, 0, -1, NaN, 1.5, undefined]) {
    const handler = route(size)
    assert.equal((await handler.run()).status, 413, `size: ${size}`)
    assert.equal(handler.reads(), 0)
    assert.equal(handler.imports(), 0)
  }
})

test('stored and recorded size mismatch is rejected without reading the stream', async () => {
  process.env.BLOB_READ_WRITE_TOKEN = 'test-only'
  const handler = route(5)
  assert.equal((await handler.run()).status, 409)
  assert.equal(handler.reads(), 0)
  assert.equal(handler.imports(), 0)
})

test('matching stored size allows preview while retaining actual-byte consistency check', async () => {
  process.env.BLOB_READ_WRITE_TOKEN = 'test-only'
  const valid = route(4)
  assert.equal((await valid.run()).status, 200)
  assert.equal(valid.imports(), 1)
  const truncated = route(5, 5)
  assert.equal((await truncated.run()).status, 409)
  assert.equal(truncated.imports(), 0)
})
