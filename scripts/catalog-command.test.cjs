const { test } = require('node:test')
const assert = require('node:assert/strict')
const { readFileSync } = require('node:fs')
const ts = require('typescript')
function handler(session, query) {
 const output = ts.transpileModule(readFileSync('app/api/admin/catalog-hide/route.ts','utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText
 const module={exports:{}}
 const deps={'@/lib/admin-auth':{getAdminSession:async()=>session},'@/lib/db':{pool:{query}},'next/cache':{revalidatePath:()=>{}}}
 new Function('require','module','exports',output)(n=>deps[n],module,module.exports)
 return module.exports.POST
}
function request(confirmation,origin='https://store.example') { return new Request('https://store.example/api/admin/catalog-hide',{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify({confirmation})}) }
test('hide requires admin, same origin and exact destructive confirmation',async()=>{
 const fail=()=>assert.fail('database mutated')
 assert.equal((await handler(null,fail)(request('HIDE ALL PRODUCTS'))).status,401)
 assert.equal((await handler({},fail)(request('HIDE ALL PRODUCTS','https://evil.example'))).status,403)
 assert.equal((await handler({},fail)(request('yes'))).status,400)
})
test('hide uses one atomic upsert without deleting records or overwriting price',async()=>{
 let calls=0
 const response=await handler({},async sql=>{
  calls++
  assert.match(sql,/INSERT INTO product_overrides/)
  assert.match(sql,/FROM manual_products/)
  assert.match(sql,/hidden = true, exclude_from_feed = true/)
  assert.doesNotMatch(sql,/DELETE|price\s*=/)
  return {rowCount:12}
 })(request('HIDE ALL PRODUCTS'))
 assert.equal(calls,1)
 assert.equal(response.status,200)
 assert.equal((await response.json()).affected,12)
})
test('database failures report uncertain result without leaking secrets',async()=>{
 const response=await handler({},async()=>{throw Error('database-secret')})(request('HIDE ALL PRODUCTS'))
 assert.equal(response.status,503)
 assert.doesNotMatch(await response.text(),/database-secret/)
})
