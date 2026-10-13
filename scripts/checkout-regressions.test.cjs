const assert = require('node:assert/strict')
const { test, beforeEach } = require('node:test')
const { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } = require('node:fs')
const { spawnSync } = require('node:child_process')
const { tmpdir } = require('node:os')
const { join, resolve } = require('node:path')
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
  new Function('require', 'module', 'exports', outputText)((name) => {
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

let marketplaceListings = []
let stripeSessionInput
const marketplaceCheckout = load('app/api/checkout/route.ts', {
  'next/server': { NextResponse: { json: (data, init) => Response.json(data, init) } },
  'next/headers': { headers: async () => new Headers({ cookie: 'session=test' }) },
  'drizzle-orm': {
    and: (...conditions) => conditions,
    eq: (column, value) => [column, value],
    inArray: (column, values) => [column, values],
  },
  '@/lib/auth': { auth: { api: { getSession: async () => ({ user: { id: 'buyer-1' } }) } } },
  '@/lib/stripe': {
    stripe: {
      checkout: {
        sessions: {
          create: async (input) => {
            stripeSessionInput = input
            return { id: 'session-1', url: 'https://stripe.test/session-1' }
          },
        },
      },
    },
  },
  '@/lib/db': {
    db: { select: () => ({ from: () => ({ where: async () => marketplaceListings }) }) },
  },
  '@/lib/db/schema': { listings: { id: 'id', status: 'status' } },
  zod: require('zod'),
})

const dailyCalls = []
let dailyEmailResult = false
const dailyRoute = load('app/api/cron/daily/route.ts', {
  'next/server': { NextResponse: { json: (data, init) => Response.json(data, init) } },
  '@/lib/admin-metrics': { getDashboardMetrics: async () => { dailyCalls.push('metrics'); return {} } },
  '@/lib/followup-notify': {
    sendDailyReport: async () => { dailyCalls.push('email'); return dailyEmailResult },
  },
  '@/lib/merchant': {
    SITE_URL: 'https://example.com',
    getFeedStats: async () => [],
    listFeedFetches: async () => ({ lastGoogle: null }),
  },
  '@/lib/merchant-health': {
    prepareDailySnapshot: async () => {
      dailyCalls.push('prepare')
      return { snapshot: { day: '2026-01-01', eligible: 0, alerts: [] }, previous: null }
    },
    pruneFeedFetchLog: async () => { dailyCalls.push('prune'); return 0 },
    recordDailySnapshot: async () => { dailyCalls.push('record'); return true },
  },
  '@/lib/stripe-checkout': {
    reconcilePendingStripeOrders: async () => { dailyCalls.push('reconcile'); return { checked: 0, paid: 0 } },
  },
})
const vinDecoder = load('app/api/vin-decode/route.ts', {})

test('marketplace checkout uses the active listing price and seller, not client data', async () => {
  marketplaceListings = [{
    id: 'listing-1', title: 'Actual engine', price: '250.59', sellerId: 'seller-actual',
    quantity: 3, status: 'active',
  }]
  stripeSessionInput = undefined

  const response = await marketplaceCheckout.POST(new Request('https://example.com/api/checkout', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      items: [
        { listingId: 'listing-1', quantity: 2, price: 0.01, sellerId: 'attacker' },
        { listingId: 'listing-1', quantity: 1 },
      ],
    }),
  }))

  assert.equal(response.status, 200)
  assert.equal(stripeSessionInput.line_items[0].price_data.unit_amount, 25059)
  assert.equal(stripeSessionInput.line_items[0].price_data.product_data.name, 'Actual engine')
  assert.equal(stripeSessionInput.line_items[0].price_data.product_data.metadata.sellerId, 'seller-actual')
})

test('marketplace checkout rejects inventory quantities above database stock', async () => {
  marketplaceListings = [{
    id: 'listing-1', title: 'Actual engine', price: '250.59', sellerId: 'seller-actual',
    quantity: 2, status: 'active',
  }]
  stripeSessionInput = undefined

  const response = await marketplaceCheckout.POST(new Request('https://example.com/api/checkout', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ items: [{ listingId: 'listing-1', quantity: 3 }] }),
  }))

  assert.equal(response.status, 422)
  assert.equal(stripeSessionInput, undefined)
})

test('daily cron fails closed and does not complete a report when email fails', async () => {
  const previousSecret = process.env.CRON_SECRET
  try {
    delete process.env.CRON_SECRET
    dailyCalls.length = 0
    const spoofed = await dailyRoute.GET(new Request('https://example.com/api/cron/daily', {
      headers: { 'user-agent': 'vercel-cron/1.0' },
    }))
    assert.equal(spoofed.status, 401)
    assert.deepEqual(dailyCalls, [])

    process.env.CRON_SECRET = 'cron-test-secret'
    dailyEmailResult = false
    const failed = await dailyRoute.GET(new Request('https://example.com/api/cron/daily', {
      headers: { authorization: ['Bearer', 'cron-test-secret'].join(' ') },
    }))
    assert.equal(failed.status, 500)
    assert.deepEqual(dailyCalls, ['prepare', 'reconcile', 'metrics', 'prune', 'email'])
  } finally {
    if (previousSecret === undefined) delete process.env.CRON_SECRET
    else process.env.CRON_SECRET = previousSecret
  }
})

test('VIN decoding returns the upstream vehicle data and never fabricates results', async () => {
  const originalFetch = global.fetch
  let fetchCalls = 0
  try {
    global.fetch = async () => {
      fetchCalls++
      return {
        ok: true,
        json: async () => ({
          Results: [{
            ModelYear: '2022',
            Make: 'Honda',
            Model: 'Civic',
            Trim: 'LX',
            DisplacementL: '2.0',
            TransmissionStyle: 'Automatic',
            BodyClass: 'Sedan',
            DriveType: 'FWD',
          }],
        }),
      }
    }
    const decoded = await vinDecoder.POST(new Request('https://example.com/api/vin-decode', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ vin: '1HGCV1F30NA000000' }),
    }))
    assert.equal(decoded.status, 200)
    assert.equal((await decoded.json()).vehicle.model, 'Civic')

    const invalid = await vinDecoder.POST(new Request('https://example.com/api/vin-decode', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ vin: 'INVALIDVIN0000000' }),
    }))
    assert.equal(invalid.status, 400)
    assert.equal(fetchCalls, 1)
  } finally {
    global.fetch = originalFetch
  }
})

test('Acura catalog repair handles relative and missing product URLs', () => {
  const directory = mkdtempSync(join(tmpdir(), 'auapw-catalog-'))
  try {
    mkdirSync(join(directory, 'lib'))
    mkdirSync(join(directory, 'data', 'brands'), { recursive: true })
    writeFileSync(join(directory, 'lib', 'acura-products.json'), JSON.stringify({
      products: [
        { id: '1', name: 'Part', slug: 'fallback', productUrl: '/brands/acura/canonical-part' },
        { id: '2', name: 'Part', slug: 'missing-url' },
      ],
    }))
    const script = resolve(__dirname, 'repair-acura-catalog.mjs')
    const result = spawnSync(process.execPath, [script], { cwd: directory, encoding: 'utf8' })
    assert.equal(result.status, 0, result.stderr)
    const repaired = JSON.parse(readFileSync(join(directory, 'data', 'brands', 'acura.json'), 'utf8'))
    assert.deepEqual(repaired.products.map((product) => product.canonicalSlug), ['canonical-part', 'missing-url'])
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
})

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
  const response = await feed.GET(new Request('https://example.com/feeds/google-shopping.xml?brand=acura'))
  const xml = await response.text()
  assert.match(xml, /<g:shipping><g:country>US<\/g:country><g:price>240\.00 USD<\/g:price>/)
  assert.match(xml, /<g:max_transit_time>7<\/g:max_transit_time><\/g:shipping>/)
  assert.doesNotMatch(xml, /free insured freight/i)
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
