const { test } = require('node:test')
const assert = require('node:assert/strict')
const { readFileSync } = require('node:fs')
const { gunzipSync } = require('node:zlib')
const ts = require('typescript')
const React = require('react')
const { renderToStaticMarkup } = require('react-dom/server')

function load(file, dependencies) {
  const { outputText } = ts.transpileModule(readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  })
  const module = { exports: {} }
  new Function('require', 'module', 'exports', outputText)(
    name => dependencies[name] ?? require(name), module, module.exports,
  )
  return module.exports
}

test('feed compression and admin operations pass strict typechecking', () => {
  const config = ts.readConfigFile('tsconfig.json', ts.sys.readFile)
  const { options } = ts.parseJsonConfigFileContent(config.config, ts.sys, process.cwd())
  const program = ts.createProgram([
    'app/feeds/google-shopping.xml/route.ts',
    'components/admin/admin-operations-client.tsx',
  ], { ...options, incremental: false })
  const diagnostics = ts.getPreEmitDiagnostics(program)
  assert.equal(diagnostics.length, 0, ts.formatDiagnosticsWithColorAndContext(diagnostics, {
    getCanonicalFileName: name => name,
    getCurrentDirectory: () => process.cwd(),
    getNewLine: () => '\n',
  }))
})

test('gzip feed decompresses to the same XML as the uncompressed response', async () => {
  const { GET } = load('app/feeds/google-shopping.xml/route.ts', {
    'next/server': { after: () => {} },
    '@/lib/site-policy': {
      RETURNS: { window: '30 days' }, WARRANTY_SUMMARY: 'Warranty',
      SHIPPING: { label: 'Free shipping', price: 0, handlingDays: { min: 1, max: 2 }, transitDays: { min: 3, max: 5 } },
    },
    '@/lib/brand-catalog': { BRAND_DIRECTORY: [{ slug: 'test', label: 'Test' }], loadBrandCatalog: () => ({ products: [] }) },
    '@/lib/catalog-fields': {},
    '@/lib/merchant': { MERCHANT_STORE_NAME: 'Test store', SITE_URL: 'https://example.com', getAllOverrides: async () => new Map() },
    '@/lib/manual-products': { primeManualOverlay: async () => {} },
  })
  const request = encoding => new Request('https://example.com/feeds/google-shopping.xml', {
    headers: { 'accept-encoding': encoding },
  })
  const plain = await GET(request('identity'))
  const xml = await plain.text()
  assert.match(xml, /^<\?xml/)
  assert.match(xml, /<\/channel>\n<\/rss>\n$/)
  assert.equal(plain.headers.get('content-encoding'), null)
  const compressed = await GET(request('gzip'))
  assert.equal(compressed.headers.get('content-encoding'), 'gzip')
  assert.equal(compressed.headers.get('vary'), 'Accept-Encoding')
  assert.equal(gunzipSync(Buffer.from(await compressed.arrayBuffer())).toString(), xml)
  const disabled = await GET(request('gzip;q=0'))
  assert.equal(disabled.headers.get('content-encoding'), null)
  assert.equal(await disabled.text(), xml)
})

function renderOperations(tab, products = []) {
  const data = { quotes: [], orders: [], products, customers: [], quoteCounts: {}, orderCounts: {} }
  let state = 0
  const { AdminOperationsClient } = load('components/admin/admin-operations-client.tsx', {
    react: {
      ...React,
      useState: initial => [[data, tab, '', false][state++] ?? initial, () => {}],
      useCallback: callback => callback,
      useEffect: () => {},
      useMemo: callback => callback(),
    },
    'next/link': { default: ({ children }) => React.createElement('a', null, children) },
    'next/navigation': { useRouter: () => ({ push: () => {} }) },
  })
  return renderToStaticMarkup(React.createElement(AdminOperationsClient))
}

test('every empty operations tab renders its empty state, including inventory', () => {
  for (const tab of ['quotes', 'orders', 'inventory', 'customers']) {
    assert.match(renderOperations(tab), /No matching records/)
  }
})

test('inventory uses products to decide whether to show the empty state', () => {
  const html = renderOperations('inventory', [
    { id: '1', sku: 'SKU-1', title: 'Test engine', category: 'engine', price: '100', quantity: 1, status: 'active', updatedAt: '2026-10-14' },
  ])
  assert.match(html, /Test engine/)
  assert.doesNotMatch(html, /No matching records/)
})
