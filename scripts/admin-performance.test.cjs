const {test}=require('node:test')
const assert=require('node:assert/strict')
const fs=require('node:fs'),ts=require('typescript')
test('uploaded admin listing is bounded and reports next page without loading the full catalog',async()=>{
 const source=fs.readFileSync('lib/manual-products.ts','utf8')
 const start=source.indexOf('export async function listManualProductsPage('),end=source.indexOf('export interface ManualProductInput',start)
 const output=ts.transpileModule('const mapRow = x => x;'+source.slice(start,end),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText
 const module={exports:{}};let values
 new Function('pool','module','exports',output)({query:async(sql,args)=>{assert.match(sql,/LIMIT \$2 OFFSET \$3/);values=args;return{rows:Array.from({length:51},(_,id)=>({id}))}}},module,module.exports)
 const result=await module.exports.listManualProductsPage('acura',2)
 assert.equal(result.products.length,50);assert.equal(result.hasMore,true);assert.deepEqual(values,['acura',51,50])
})
test('admin navigation avoids prefetch and polling pauses in hidden tabs',()=>{
 for(const p of ['admin-sidebar','admin-nav'])assert.match(fs.readFileSync(`components/admin/${p}.tsx`,'utf8'),/prefetch=\{false\}/)
 for(const p of ['upload-monitor','large-catalog-upload'])assert.match(fs.readFileSync(`components/admin/merchant/${p}.tsx`,'utf8'),/document.visibilityState === 'visible'/)
})
