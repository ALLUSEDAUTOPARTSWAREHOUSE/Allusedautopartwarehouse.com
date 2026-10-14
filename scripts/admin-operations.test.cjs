const { test } = require('node:test')
const assert = require('node:assert/strict')
const { readFileSync } = require('node:fs')
const { resolve } = require('node:path')
const { renderToStaticMarkup } = require('react-dom/server')
const ts = require('typescript')

const filename = resolve(__dirname, '..', 'components/admin/admin-operations-client.tsx')

function render(tab, products = [], search = '') {
  const states = [
    { quotes: [], orders: [], products, customers: [], quoteCounts: {}, orderCounts: {} },
    tab, search, false, null, '', '',
  ]
  const { outputText } = ts.transpileModule(readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
    fileName: filename,
  })
  const dependencies = {
    react: {
      useState: () => [states.shift(), () => {}],
      useMemo: (fn) => fn(),
      useCallback: (fn) => fn,
      useEffect: () => {},
    },
    'react/jsx-runtime': require('react/jsx-runtime'),
    'next/link': { default: () => null },
    'next/navigation': { useRouter: () => ({ push: () => {} }) },
    'lucide-react': new Proxy({}, { get: () => () => null }),
  }
  const module = { exports: {} }
  new Function('require', 'module', 'exports', outputText)((name) => {
    assert.ok(Object.hasOwn(dependencies, name), `Unexpected dependency: ${name}`)
    return dependencies[name]
  }, module, module.exports)
  return renderToStaticMarkup(module.exports.AdminOperationsClient())
}

test('every operations tab renders an empty state without missing data keys', () => {
  for (const tab of ['quotes', 'orders', 'inventory', 'customers']) {
    assert.match(render(tab), /No matching records/)
  }
})

test('inventory empty state uses the filtered products', () => {
  const products = [{ id: '1', sku: 'ENG-1', title: 'Test engine', category: 'engine', price: '1200', quantity: 2, status: 'active' }]
  assert.doesNotMatch(render('inventory', products), /No matching records/)
  assert.match(render('inventory', products), /Test engine/)
  assert.match(render('inventory', products, 'no-match'), /No matching records/)
})

test('operations tab lookups type-check against the response data', () => {
  const program = ts.createProgram([filename], {
    noEmit: true, strict: true, skipLibCheck: true,
    target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true,
  })
  const diagnostics = ts.getPreEmitDiagnostics(program)
  assert.equal(diagnostics.length, 0, ts.formatDiagnosticsWithColorAndContext(diagnostics, {
    getCanonicalFileName: (name) => name,
    getCurrentDirectory: () => process.cwd(),
    getNewLine: () => '\n',
  }))
})
