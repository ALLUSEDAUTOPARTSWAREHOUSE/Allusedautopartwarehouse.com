const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const ts = require('typescript')
function load(path, dependencies) {
 const output = ts.transpileModule(fs.readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText
 const module = { exports: {} }
 new Function('require','module','exports',output)(name => dependencies[name], module, module.exports)
 return module.exports
}
const policy = load('lib/catalog-reset-policy.ts', {})
test('only post-reset spreadsheet uploads qualify, never old or manual records', () => {
 assert.equal(policy.UPLOADED_ONLY_CATALOG, true)
 assert.equal(policy.isReplacementUpload({ source:'upload', updatedAt:'2026-10-19T00:40:00Z' }), true)
 for (const record of [{source:'upload',updatedAt:'2026-10-18T00:00:00Z'}, {source:'manual',updatedAt:'2026-10-19T00:40:00Z'}, {source:'upload',updatedAt:'invalid'}]) assert.equal(policy.isReplacementUpload(record), false)
})
test('catalog loader returns no bundled records and replacement overlays only', () => {
 const original = fs.readFileSync('lib/brand-catalog.ts','utf8')
 const start = original.indexOf('export function loadBrandCatalog(')
 const end = original.indexOf('export function getBrandProductBySlug(', start)
 const source = `const UPLOADED_ONLY_CATALOG=true; const catalogCache=new Map([['mazda',{products:[{canonicalSlug:'old'}],count:1}]]); const manualOverlay=new Map(); const isValidBrand=b=>b==='mazda'; export function setOverlay(p){manualOverlay.set('mazda',p)}; ${original.slice(start,end)}`
 const output = ts.transpileModule(source, {compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText
 const module={exports:{}}
 new Function('module','exports',output)(module,module.exports)
 assert.deepEqual(module.exports.loadBrandCatalog('mazda').products, [])
 module.exports.setOverlay([{canonicalSlug:'new'}])
 assert.deepEqual(module.exports.loadBrandCatalog('mazda').products,[{canonicalSlug:'new'}])
 assert.equal(module.exports.loadBrandCatalog('mazda').count,1)
 assert.equal(module.exports.loadBrandCatalog('unknown'),null)
})
