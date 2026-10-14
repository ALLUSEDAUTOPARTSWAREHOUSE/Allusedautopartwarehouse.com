const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const ts = require('typescript')
function importer(sheets, failSave = false) {
  const calls = []
  const client = { query: async (sql, args) => { calls.push({ sql, args }); if (failSave && sql.startsWith('INSERT')) throw new Error('database failure'); return { rows: [] } }, release() {} }
  const dependencies = {
    'server-only': {},
    xlsx: { read: () => ({ SheetNames: Object.keys(sheets), Sheets: sheets }), utils: { sheet_to_json: s => s } },
    '@/lib/db': { pool: { connect: async () => client } },
    '@/lib/brand-catalog': { setManualOverlay() {} },
  }
  const module = { exports: {} }
  const { outputText } = ts.transpileModule(fs.readFileSync('lib/manual-products.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } })
  new Function('require', 'module', 'exports', outputText)(name => dependencies[name], module, module.exports)
  return { run: module.exports.importProductSheet, calls }
}
test('migration workbook skips Controls and uses brand sheet, preserving URL identities and reporting missing prices', async () => {
  const { run, calls } = importer({ Controls: [{ control: 'not products' }], Acura: [
    { name: 'Acura engine', price: 1297, product_url: 'https://example.com/products/acura-engine-p-1', image_url: 'https://example.com/image.jpg' },
    { name: 'Acura transmission', category_id: 'used transmission', price: '' },
  ] })
  assert.deepEqual(await run('acura', Buffer.alloc(0)), { inserted: 2, skipped: 0, missingPrices: 1 })
  const inserts = calls.filter(c => c.sql.startsWith('INSERT'))
  assert.equal(inserts[0].args[1], 'acura-engine-p-1')
  assert.equal(inserts[0].args[4], 1297)
  assert.match(inserts[0].sql, /ON CONFLICT/)
  assert.equal(inserts[1].args[4], null)
  assert.equal(inserts[1].args[6], 'transmission')
})
test('Products sheet accepts Price ($) column', async () => {
  const { run, calls } = importer({ Products: [{ Name: 'Engine', 'Price ($)': 1200 }] })
  await run('acura', Buffer.alloc(0))
  assert.equal(calls.find(c => c.sql.startsWith('INSERT')).args[4], 1200)
})
test('database failure rolls back rather than reporting a workbook parsing failure', async () => {
  const { run, calls } = importer({ Products: [{ Name: 'Engine', Price: 1200 }] }, true)
  await assert.rejects(run('acura', Buffer.alloc(0)), /database failure/)
  assert.ok(calls.some(c => c.sql === 'ROLLBACK'))
})
test('field-only updates do not create unknown products', async () => {
  const { run, calls } = importer({ Products: [{ Name: 'Engine', Price: 1200 }] })
  const result = await run('acura', Buffer.alloc(0), 'prices')
  assert.equal(result.inserted, 0)
  assert.equal(result.skipped, 1)
  assert.ok(!calls.some(c => c.sql.startsWith('INSERT')))
})

test('preview reports rows and missing prices without writing products', async () => {
  const { run, calls } = importer({ Products: [{ Name: 'Engine', 'Price ($)': 1200 }, { Name: 'Transmission' }] })
  assert.deepEqual(await run('acura', Buffer.alloc(0), 'all', true), { inserted: 2, skipped: 0, missingPrices: 1 })
  assert.ok(!calls.some(c => c.sql.startsWith('INSERT')))
})

test('removal creates hidden source markers atomically and preserves other override fields', async () => {
  const calls = []
  const client = { query: async (sql, args) => { calls.push({ sql, args }); return { rows: sql.startsWith('DELETE') ? [{ slug: 'engine-p-1' }] : [] } }, release() {} }
  const module = { exports: {} }
  const { outputText } = ts.transpileModule(fs.readFileSync('lib/manual-products.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } })
  const dependencies = { 'server-only': {}, xlsx: {}, '@/lib/db': { pool: { connect: async () => client } }, '@/lib/brand-catalog': {} }
  new Function('require', 'module', 'exports', outputText)(name => dependencies[name], module, module.exports)
  assert.equal(await module.exports.removeManualProducts('acura', ['engine-p-1']), 1)
  assert.equal(calls[0].sql, 'BEGIN')
  assert.deepEqual(calls[1].args, ['acura', ['engine-p-1']])
  assert.match(calls[2].sql, /hidden = true, exclude_from_feed = true/)
  assert.doesNotMatch(calls[2].sql, /price =|image_url =/)
  assert.equal(calls.at(-1).sql, 'COMMIT')
})

test('wrong brand and duplicate product identities reject before database writes', async () => {
  for (const [rows, error] of [
    [[{ name: 'Mazda engine', brand: 'Mazda', price: 1200 }], 'BRAND_MISMATCH'],
    [[{ Name: 'Engine', 'Product URL': 'https://example.com/products/engine-1' }, { Name: 'Another engine', 'Product URL': 'https://example.com/products/engine-1' }], 'DUPLICATE_PRODUCTS'],
  ]) {
    const { run, calls } = importer({ Products: rows })
    await assert.rejects(run('acura', Buffer.alloc(0)), new RegExp(error))
    assert.equal(calls.length, 0)
  }
})
test('Mazda migration headers import into Mazda only', async () => {
  const { run, calls } = importer({ Controls: [{ title: 'Controls' }], Mazda: [{ name: 'Mazda engine', brand: 'Mazda', price: 1300, product_url: 'https://example.com/products/mazda-engine-p-1' }] })
  assert.equal((await run('mazda', Buffer.alloc(0), 'all', true)).inserted, 1)
  assert.ok(!calls.some(c => c.sql.startsWith('INSERT')))
})
