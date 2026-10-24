const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const ts = require('typescript')
function resolver(rows) {
 const output = ts.transpileModule(fs.readFileSync('lib/uploaded-product-link.ts','utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText
 const module={exports:{}}
 const deps={'server-only':{},'@/lib/db':{pool:{query:async(sql,args)=>{assert.match(sql,/COALESCE\(o.hidden, false\) = false/);assert.equal(args[0],'part-123');return {rows}}}},'@/lib/brand-catalog':{isValidBrand:b=>b==='acura'},'@/lib/catalog-reset-policy':{UPLOADED_ONLY_CATALOG:true,isReplacementUpload:r=>r.source==='upload'&&Date.parse(r.updatedAt)>Date.parse('2026-10-19T00:38:44Z')}}
 new Function('require','module','exports',output)(n=>deps[n],module,module.exports)
 return module.exports.resolveUploadedProductLink
}
const row={brand:'acura',slug:'part-123',source:'upload',updated_at:'2026-10-19T03:00:00Z'}
test('spreadsheet URL resolves to its uploaded brand product',async()=>assert.equal(await resolver([row])('part-123'),'/brands/acura/part-123'))
test('unknown, archived and ambiguous identities do not resolve',async()=>{
 assert.equal(await resolver([])('part-123'),null)
 assert.equal(await resolver([{...row,updated_at:'2026-10-18T00:00:00Z'}])('part-123'),null)
 assert.equal(await resolver([row,row])('part-123'),null)
 assert.equal(await resolver([row])('../part'),null)
})
test('generic product redirect no longer overrides uploaded product lookup',()=>{
 assert.doesNotMatch(fs.readFileSync('next.config.ts','utf8'),/source: "\/products\/:id"/)
})
