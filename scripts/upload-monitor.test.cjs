const {test}=require('node:test')
const assert=require('node:assert/strict')
const fs=require('node:fs'),ts=require('typescript')
function route(session,catalog,query){
 const output=ts.transpileModule(fs.readFileSync('app/api/admin/upload-monitor/route.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText
 const module={exports:{}};const deps={'@/lib/admin-auth':{getAdminSession:async()=>session},'@/lib/merchant':{getFeedStats:catalog},'@/lib/db':{pool:{query}}}
 new Function('require','module','exports',output)(n=>deps[n],module,module.exports);return module.exports.GET
}
test('monitor requires administrator before reading data',async()=>{
 const fail=()=>assert.fail('queried');assert.equal((await route(null,fail,fail)()).status,401)
})
test('monitor isolates failures, disables caching and never substitutes zero',async()=>{
 const response=await route({},async()=>{throw Error('private')},async sql=>{assert.match(sql,/image_url IS NULL/);return {rows:[{brand:'audi',missing_prices:2}]}})()
 const data=await response.json();assert.equal(data.catalog,null);assert.equal(data.uploads[0].missing_prices,2);assert.doesNotMatch(JSON.stringify(data),/private/);assert.equal(response.headers.get('cache-control'),'private, no-store')
})
test('UI separates unconnected channels, staging, image reachability and archived counts',()=>{
 const source=fs.readFileSync('components/admin/merchant/upload-monitor.tsx','utf8')
 for(const pattern of [/TV view/,/not connected/,/includes archives/,/not a row-level error report/,/30_000/])assert.match(source,pattern)
})
