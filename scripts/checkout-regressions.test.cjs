const assert = require('node:assert/strict')
const { test, beforeEach } = require('node:test')
const { readFileSync } = require('node:fs')
const { resolve } = require('node:path')
const ts = require('typescript')

// Load the real server modules without Next's server-only guard; replace only
// catalog/network boundaries so these tests never create orders or payments.
function load(relativePath, dependencies) {
  const filename = resolve(__dirname, '..', relativePath)
  const { outputText } = ts.transpileModule(readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    fileName: filename,
  })
  const module = { exports: {} }
  new Function('require', 'module', 'exports', `${outputText}\n//# sourceURL=${filename}`)((name) => {
    if (name === 'server-only') return {}
    if (Object.hasOwn(dependencies, name)) return dependencies[name]
    if (name.startsWith('node:')) return require(name)
    throw new Error(`Unexpected dependency: ${name}`)
  }, module, module.exports)
  return module.exports
}

const product = {
  id: 'engine-1', canonicalSlug: 'test-engine', name: 'Test engine',
  price: 1200, salesMode: 'buy_now', tiers: { low: 1000, medium: 1200, high: 1400 },
  description: 'A used engine with documented vehicle compatibility and mileage.',
  imageUrl: '/images/test-engine.png', category: 'engine',
}
const catalog = {
  BRAND_DIRECTORY: [{ slug: 'acura', label: 'Acura' }],
  getBrandProductBySlug: (brand, slug) => brand === 'acura' && slug === product.canonicalSlug ? product : undefined,
  getBrandProductUrl: (brand, p) => `/brands/${brand}/${p.canonicalSlug}`,
  getBrandLabel: () => 'Acura',
  getProductDisplayImage: () => ({ src: product.imageUrl, illustrative: false }),
  loadBrandCatalog: () => ({ products: [product] }),
}
const manualProducts = { primed: 0, primeManualOverlay: async () => { manualProducts.primed++ } }
let rows = []
let databaseUnavailable = false
const merchant = load('lib/merchant.ts', {
  react: { cache: (fn) => fn },
  '@/lib/db': { pool: { query: async () => {
    if (databaseUnavailable) throw new Error('Database unavailable')
    return { rows }
  } } },
  '@/lib/catalog-fields': load('lib/catalog-fields.ts', {}),
  '@/lib/brand-catalog': catalog,
  '@/lib/manual-products': manualProducts,
})
const { priceCart } = load('lib/order-pricing.ts', {
  '@/lib/brand-catalog': catalog,
  '@/lib/catalog-fields': load('lib/catalog-fields.ts', {}),
  '@/lib/merchant': merchant,
  '@/lib/site-policy': load('lib/site-policy.ts', {}),
  '@/lib/manual-products': manualProducts,
})
const checkoutItem = load('app/api/checkout-item/[id]/route.ts', {
  'next/server': { NextResponse: { json: (data, init) => Response.json(data, init) } },
  '@/lib/merchant': merchant,
  '@/lib/brand-catalog': catalog,
  '@/lib/site-policy': load('lib/site-policy.ts', {}),
  '@/lib/manual-products': manualProducts,
})
const item = (changes = {}) => ({ id: 'test-engine', make: 'Acura', price: 1200, quantity: 1, ...changes })
function override(changes) {
  rows = [{ brand: 'acura', slug: 'test-engine', title: null, description: null,
    price: null, image_url: null, availability: null, hidden: false,
    exclude_from_feed: false, notes: null, updated_at: new Date(), ...changes }]
}
function getCheckoutItem() {
  return checkoutItem.GET(new Request('https://example.com'), {
    params: Promise.resolve({ id: merchant.feedItemId('acura', product.canonicalSlug) }),
  })
}
beforeEach(() => { rows = []; databaseUnavailable = false })

test('accepts catalog prices and preserves mileage tiers', async () => {
  for (const price of [1000, 1200, 1400]) {
    const result = await priceCart([item({ price })])
    assert.equal(result.ok, true)
    assert.equal(result.lines[0].unitPrice, price)
  }
})
test('charges $240 for every unit, ignoring stale or tampered client shipping', async () => {
  for (const shippingCost of [undefined, 0, 1, 999]) {
    const result = await priceCart([item({ quantity: 2, shippingCost })])
    assert.equal(result.ok, true)
    assert.equal(result.shippingCost, 480)
    assert.equal(result.totalAmount, 3072)
  }
  const split = await priceCart([item(), item({ price: 1000, quantity: 2 })])
  assert.equal(split.ok, true)
  assert.equal(split.shippingCost, 720)
  assert.equal(split.totalAmount, 4176)
})
test('Google feed advertises the same $240 shipping rate as checkout', async () => {
  const feed = load('app/feeds/google-shopping.xml/route.ts', {
    'next/server': { after: () => {} },
    '@/lib/brand-catalog': catalog,
    '@/lib/catalog-fields': load('lib/catalog-fields.ts', {}),
    '@/lib/merchant': merchant,
    '@/lib/site-policy': load('lib/site-policy.ts', {}),
    '@/lib/manual-products': manualProducts,
  })
  const url = 'https://example.com/feeds/google-shopping.xml?brand=acura'
  const response = await feed.GET(new Request(url))
  assert.equal(response.headers.get('Content-Encoding'), null)
  const xml = await response.text()
  assert.match(xml, /<g:shipping><g:country>US<\/g:country><g:price>240\.00 USD<\/g:price>/)
  assert.match(xml, /<g:max_transit_time>7<\/g:max_transit_time><\/g:shipping>/)
  assert.doesNotMatch(xml, /free insured freight/i)

  for (const encoding of ['gzip', 'gzip;q=0', 'br']) {
    const compressed = await feed.GET(new Request(url, { headers: { 'Accept-Encoding': encoding } }))
    assert.equal(compressed.headers.get('Vary'), 'Accept-Encoding')
    assert.equal(compressed.headers.get('Content-Type'), 'application/xml; charset=utf-8')
    assert.equal(compressed.headers.get('Content-Encoding'), encoding === 'gzip' ? 'gzip' : null)
    const body = encoding === 'gzip'
      ? new Response(compressed.body.pipeThrough(new DecompressionStream('gzip')))
      : compressed
    assert.equal(await body.text(), xml)
  }
})
test('feed titles drop the cut-off fragment the sheets end with', () => {
  assert.equal(
    merchant.cleanFeedTitle('2013 Toyota Camry Engine - 2.5L, VIN D (5th digit, 2ARFXE engine, 4 cylinder,...'),
    '2013 Toyota Camry Engine - 2.5L, VIN D (5th digit, 2ARFXE engine, 4 cylinder)',
  )
  assert.equal(
    merchant.cleanFeedTitle('2015 Acura ILX Engine - 1.5L (VIN 3, 6th digit, Hybrid, SOHC, Canada marke... '),
    '2015 Acura ILX Engine - 1.5L (VIN 3, 6th digit, Hybrid, SOHC, Canada)',
  )
  assert.equal(merchant.cleanFeedTitle('1970 Audi 100 Engine - (1.8L)'), '1970 Audi 100 Engine - (1.8L)')
  assert.equal(merchant.cleanFeedTitle('Chevy Van Transmission - TH350, 6"""" extension'), 'Chevy Van Transmission - TH350, 6" extension')
  assert.ok(merchant.cleanFeedTitle(`${'word '.repeat(40)}(and more`).length <= 150)
})
test('uses admin price and title overrides, rejecting stale tier prices', async () => {
  override({ price: '1550.00', title: 'Updated engine' })
  const result = await priceCart([item({ price: 1550 })])
  assert.equal(result.ok, true)
  assert.equal(result.lines[0].name, 'Updated engine')
  assert.equal((await priceCart([item()])).ok, false)
  assert.equal((await priceCart([item({ price: 1000 })])).ok, false)
})
test('an admin price of exactly $799 is buyable, not mistaken for the sheet placeholder', async () => {
  override({ price: '799.00' })
  const result = await priceCart([item({ price: 799 })])
  assert.equal(result.ok, true)
  assert.equal(result.lines[0].unitPrice, 799)
})
test('blocks hidden, sold-out, and backordered products', async () => {
  for (const change of [{ hidden: true }, { availability: 'out_of_stock' }, { availability: 'backorder' }]) {
    override(change)
    assert.equal((await priceCart([item()])).ok, false)
  }
})
test('feed exclusion alone does not block direct storefront purchases', async () => {
  override({ exclude_from_feed: true })
  assert.equal((await priceCart([item()])).ok, true)
})
test('supports legacy Google cart IDs without bypassing aggregate quantity caps', async () => {
  assert.equal((await priceCart([item({ id: 'acura/test-engine' })])).ok, true)
  assert.equal((await priceCart([item({ quantity: 3 }), item({ id: 'acura/test-engine', price: 1000, quantity: 3 })])).ok, false)
})
test('rejects invalid quantities, unknown products, and tampered prices', async () => {
  for (const quantity of [0, -1, 1.5, 6, Infinity, NaN]) {
    assert.equal((await priceCart([item({ quantity })])).ok, false)
  }
  assert.equal((await priceCart([item({ id: 'unknown' })])).ok, false)
  assert.equal((await priceCart([item({ price: 1 })])).ok, false)
})
test('fails closed when current overrides cannot be verified', async () => {
  databaseUnavailable = true
  assert.equal((await priceCart([item()])).ok, false)
  assert.equal((await getCheckoutItem()).status, 503)
})
test('Google checkout returns a canonical purchasable ID and current price', async () => {
  override({ price: '1550.00' })
  const response = await getCheckoutItem()
  assert.equal(response.status, 200)
  const { item: returnedItem } = await response.json()
  assert.equal(returnedItem.id, 'test-engine')
  assert.equal(returnedItem.price, 1550)
  assert.equal(returnedItem.shippingCost, 240)
  assert.equal((await priceCart([{ ...returnedItem, quantity: 1 }])).ok, true)
})
test('Google checkout rejects malformed item ids before loading any products', async () => {
  manualProducts.primed = 0
  for (const id of ['acura', 'acuraX', 'acura-XYZ', `acura-${'0'.repeat(15)}`]) {
    const response = await checkoutItem.GET(new Request('https://example.com'), { params: Promise.resolve({ id }) })
    assert.equal(response.status, 404)
  }
  assert.equal(manualProducts.primed, 0)
})
test('Google checkout rejects excluded, hidden, and unavailable items', async () => {
  for (const change of [{ hidden: true }, { exclude_from_feed: true }, { availability: 'out_of_stock' }, { availability: 'backorder' }]) {
    override(change)
    assert.equal((await getCheckoutItem()).status, 404)
  }
})
