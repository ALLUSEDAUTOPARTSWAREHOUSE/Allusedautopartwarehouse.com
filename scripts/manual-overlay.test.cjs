const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const ts = require('typescript')

function load(path, dependencies) {
  const output = ts.transpileModule(fs.readFileSync(path, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  }).outputText
  const module = { exports: {} }
  new Function('require', 'module', 'exports', output)(name => dependencies[name], module, module.exports)
  return module.exports
}

function setup() {
  const policy = load('lib/catalog-reset-policy.ts', {})
  const catalog = load('lib/brand-catalog.ts', {
    'server-only': {}, 'node:fs': fs, 'node:path': require('node:path'),
    '@/lib/catalog-reset-policy': policy, '@/lib/catalog-fields': {},
  })
  const row = (slug, source = 'upload', updated = '2026-10-19T01:00:00Z') => ({
    id: 1, brand: 'mazda', slug, name: `Engine ${slug}`, price: '1200', source,
    created_at: new Date(updated), updated_at: new Date(updated),
  })
  const rows = [row('hidden'), row('visible'), row('manual', 'manual'), row('old', 'upload', '2026-10-18T00:00:00Z')]
  const state = { hidden: [], fail: false }
  const manual = load('lib/manual-products.ts', {
    'server-only': {}, xlsx: {}, '@/lib/catalog-reset-policy': policy,
    '@/lib/brand-catalog': catalog,
    '@/lib/db': { pool: { query: async (sql, args) => {
      assert.deepEqual(args, ['mazda'])
      if (sql.includes('FROM manual_products')) return { rows }
      assert.match(sql, /FROM product_overrides WHERE brand = \$1 AND hidden = true/)
      if (state.fail) throw Error('override lookup failed')
      return { rows: state.hidden.map(slug => ({ slug })) }
    } } },
  })
  return { ...manual, catalog, state, rows }
}

test('hide overrides remove preserved uploads from listings, counts, search and cached detail lookup', async () => {
  const { primeManualOverlay, catalog, state, rows } = setup()
  await primeManualOverlay('mazda')
  assert.ok(catalog.getBrandProductBySlug('mazda', 'hidden'))
  state.hidden = ['hidden']
  await primeManualOverlay('mazda')
  assert.deepEqual(catalog.loadBrandCatalog('mazda').products.map(p => p.slug), ['visible'])
  assert.equal(catalog.loadBrandCatalog('mazda').count, 1)
  assert.equal(catalog.searchBrandProducts('mazda', { q: 'hidden' }).total, 0)
  assert.equal(catalog.getBrandProductBySlug('mazda', 'hidden'), undefined)
  assert.equal(rows.length, 4, 'source records are preserved')
  state.hidden = ['hidden', 'visible', 'manual', 'old']
  await primeManualOverlay('mazda')
  assert.equal(catalog.loadBrandCatalog('mazda').count, 0, 'hide all empties the public catalog')
  assert.equal(catalog.searchBrandProducts('mazda').total, 0)
  state.hidden = []
  await primeManualOverlay('mazda')
  assert.ok(catalog.getBrandProductBySlug('mazda', 'hidden'), 'explicit unhide restores visibility')
})

test('override lookup failure clears a previously populated overlay', async () => {
  const { primeManualOverlay, catalog, state } = setup()
  await primeManualOverlay('mazda')
  assert.equal(catalog.loadBrandCatalog('mazda').count, 2)
  state.fail = true
  await primeManualOverlay('mazda')
  assert.equal(catalog.loadBrandCatalog('mazda').count, 0)
  assert.equal(catalog.searchBrandProducts('mazda').total, 0)
})
