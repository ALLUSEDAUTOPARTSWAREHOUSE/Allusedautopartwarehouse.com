const { test } = require('node:test')
const assert = require('node:assert/strict')
const { readFileSync } = require('node:fs')
const ts = require('typescript')
function load(path, deps = {}) {
 const output = ts.transpileModule(readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 } }).outputText
 const module = { exports: {} }
 new Function('require','module','exports',output)(name => deps[name],module,module.exports)
 return module.exports
}
const health = load('lib/catalog-health-summary.ts')
const stats = [
 { slug: 'mazda', label: 'Mazda', total: 10, eligible: 6, issues: { hidden: 2, no_price: 3, illustrative_image: 10 } },
 { slug: 'acura', label: 'Acura', total: 5, eligible: 5, issues: { hidden: 0, no_price: 0, illustrative_image: 0 } },
]
test('totals separate visibility, eligibility and overlapping issue counts', () => {
 assert.deepEqual(health.summarizeCatalog(stats), { total: 15, visible: 13, eligible: 11, missingPrices: 3, imageReviews: 10, hidden: 2 })
 assert.equal(health.summarizeCatalog([]).total, 0)
})
test('brand filtering is case insensitive and review status uses recorded issues', () => {
 assert.deepEqual(health.filterCatalogBrands(stats, ' MAZ ', false).map(x=>x.slug), ['mazda'])
 assert.deepEqual(health.filterCatalogBrands(stats, '', true).map(x=>x.slug), ['mazda'])
 assert.deepEqual(health.filterCatalogBrands(stats, 'absent', false), [])
})
test('dashboard renders brand editing links and honest external status', () => {
 const React = require('react')
 const { CatalogHealthDashboard } = load('components/admin/merchant/catalog-health-dashboard.tsx', {
  react: { useState: initial => [initial, () => {}] },
  'react/jsx-runtime': require('react/jsx-runtime'),
  'next/link': { default: ({children,...props}) => React.createElement('a',props,children) },
  'next/navigation': { useRouter: () => ({refresh:()=>{}}) },
  '@/lib/catalog-health-summary': health,
 })
 const html = require('react-dom/server').renderToStaticMarkup(CatalogHealthDashboard({stats,checkedAt:'2026-10-18T21:00:00Z'}))
 assert.match(html, /Not confirmed Google acceptance/)
 assert.match(html, /Display size/)
 assert.match(html, /Compact/)
 assert.match(html, /Large/)
 assert.match(html, /brand=mazda/)
 assert.match(html, /issue=no_price/)
 assert.match(html, /motion-reduce:transition-none/)
})
test('legacy feed labels no longer claim successful Google delivery', () => {
 assert.doesNotMatch(readFileSync('components/admin/merchant/merchant-overview.tsx','utf8'), /label: "Sent to Google"/)
 assert.doesNotMatch(readFileSync('components/admin/merchant/feed-health-panel.tsx','utf8'), /Products sent to Google, by day/)
})
