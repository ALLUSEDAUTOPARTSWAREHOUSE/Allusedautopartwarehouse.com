const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const ts = require('typescript')
const { DatabaseSync } = require('node:sqlite')

function fixture() {
  const db = new DatabaseSync(':memory:')
  db.function('regexp_replace', (value, pattern, replacement, flags) => String(value).replace(new RegExp(pattern, flags), replacement))
  db.exec(`CREATE TABLE staff_members(id TEXT,email TEXT,role TEXT,status TEXT);
    CREATE TABLE followup_assignments(record_type TEXT,record_id TEXT,staff_id TEXT);
    CREATE TABLE orders(id TEXT PRIMARY KEY,ordernumber TEXT,status TEXT,customer_name TEXT,customer_email TEXT,customer_phone TEXT,shippingaddress TEXT,items TEXT,totalamount REAL,email_verified_at TEXT,createdat TEXT,updatedat TEXT,invoice_token TEXT,email_verify_token TEXT);
    CREATE TABLE leads(id INTEGER PRIMARY KEY,full_name TEXT,phone TEXT,email TEXT,part_type TEXT,make TEXT,model TEXT,year TEXT,product_name TEXT,product_url TEXT,status TEXT,quote_amount REAL,notes TEXT,created_at TEXT,updated_at TEXT);
    INSERT INTO staff_members VALUES('alice','alice@example.test','sales_agent','active'),('bob','bob@example.test','support_team','active');
    INSERT INTO leads VALUES(1,'Assigned Lead','1234567890','customer@example.test','Engine','Ford','F150','2018','Engine assembly','/brands/ford/engine','new',NULL,'Follow up','2026-11-20','2026-11-28'),(2,'Other Lead','1234567890','customer@example.test','Transmission','BMW','X5','2020','Transmission assembly','/brands/bmw/gearbox','won',100000,'Other owner only','2026-11-20','2026-11-28');
    INSERT INTO followup_assignments VALUES('quote','1','alice'),('quote','2','bob');`)
  const line = { productId: 'engine', name: 'Engine', make: 'Ford', quantity: 1, unitPrice: 10, lineTotal: 10, url: '/brands/ford/engine', invoiceToken: 'hidden-item-token', metadata: { secret: 'hidden-extra' } }
  const insert = db.prepare('INSERT INTO orders VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)')
  const assignment = db.prepare('INSERT INTO followup_assignments VALUES(?,?,?)')
  for (let index = 1; index <= 55; index++) {
    const id = `o${String(index).padStart(3,'0')}`
    insert.run(id, `AU-${index}`, 'paid', 'Assigned Customer', 'customer@example.test', '1234567890', 'Assigned address', JSON.stringify([line]), 10, null, '2026-11-20', '2026-11-28', 'invoice-secret', 'verify-secret')
    assignment.run('order', id, 'alice')
  }
  insert.run('other', 'AU-OTHER', 'paid', 'Other Owner Customer', 'customer@example.test', '1234567890', 'Other address', '[]', 999999, null, '2026-11-20', '2026-11-29', 'other-secret', 'other-secret')
  assignment.run('order', 'other', 'bob')
  insert.run('unassigned', 'AU-UNASSIGNED', 'paid', 'Unassigned Customer', 'customer@example.test', '1234567890', 'Hidden address', '[]', 999999, null, '2026-11-20', '2026-11-29', 'hidden-secret', 'hidden-secret')
  let staff = { id: 'alice', email: 'alice@example.test', name: 'Alice', role: 'sales_agent' }
  const calls = []
  const pool = { query: async (sql, args) => {
    calls.push({sql,args})
    assert.match(sql.trim(), /^(SELECT|WITH)\b/)
    assert.doesNotMatch(sql, /\b(?:INSERT|UPDATE|DELETE|CREATE|ALTER|DROP)\b/i)
    const binds = []
    const sqlite = sql.replace(/public\./g, '').replace(/r\.id::text/g, 'CAST(r.id AS TEXT)').replace(/::(?:text|int|timestamptz)/g, '').replace(/ILIKE \$(\d+)/g, "LIKE $$$1 ESCAPE '\\'").replace(/\$(\d+)/g, (_, n) => { binds.push(args[Number(n) - 1]); return '?' })
    return { rows: db.prepare(sqlite).all(...binds).map(row => ({ ...row, ...(row.items ? { items: JSON.parse(row.items) } : {}) })) }
  } }
  const module = { exports: {} }
  const dependencies = { 'server-only': {}, '@/lib/db': { pool }, '@/lib/staff-auth': { getStaffSession: async () => staff } }
  const { outputText } = ts.transpileModule(fs.readFileSync('lib/staff-workspace.ts','utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } })
  new Function('require','module','exports',outputText)(name => dependencies[name],module,module.exports)
  return { db, calls, ...module.exports, setStaff: value => { staff = value } }
}

test('staff workspace filters all tabs and customer aggregates to assignment before LIMIT', async () => {
  const f = fixture(), page = await f.getAssignedWorkspace()
  assert.equal(page.orders.length, 50)
  assert.equal(page.hasMore.orders, true)
  assert.deepEqual(page.quotes.map(row => row.id), [1])
  assert.equal(page.customers.length, 1)
  assert.equal(page.customers[0].orders, 55)
  assert.equal(page.customers[0].paidTotal, 550)
  assert.equal(page.customers[0].quotes, 1)
  assert.equal(page.customers[0].quotesWon, 0)
  assert.doesNotMatch(JSON.stringify(page), /Other Owner|Other address|Hidden address|Other owner only|AU-OTHER|AU-UNASSIGNED|invoice-secret|verify-secret|hidden-item-token|hidden-extra/)
  assert.deepEqual(f.calls[0].args, ['alice','sales_agent','alice@example.test',null,51,0])
  f.db.close()
})

test('staff workspace page boundaries are deterministic and invalid fractional pages normalize safely', async () => {
  const f = fixture(), first = await f.getAssignedWorkspace(), second = await f.getAssignedWorkspace(undefined,2)
  assert.equal(second.orders.length, 5)
  assert.equal(second.hasMore.orders, false)
  assert.equal(first.orders.some(row => second.orders.some(other => other.id === row.id)), false)
  assert.equal((await f.getAssignedWorkspace(undefined,1.5)).page, 1)
  assert.equal((await f.getAssignedWorkspace(undefined,Number.POSITIVE_INFINITY)).page, 1)
  f.db.close()
})

test('staff workspace binds and escapes search without broadening the staff assignment', async () => {
  const f = fixture()
  const wildcard = await f.getAssignedWorkspace('%')
  assert.equal(wildcard.orders.length, 0)
  assert.equal(wildcard.quotes.length, 0)
  assert.equal(wildcard.customers.length, 0)
  assert.equal(f.calls[0].args[3], '%\\%%')
  assert.equal((await f.getAssignedWorkspace("' OR 1=1--")).orders.length, 0)
  assert.doesNotMatch(f.calls[3].sql, /OR 1=1/)
  f.db.close()
})

test('staff workspace revalidates role and current assignments and never falls back to global records', async () => {
  const f = fixture()
  f.setStaff(null)
  await assert.rejects(f.getAssignedWorkspace(), /active sales or support session/)
  f.setStaff({ id:'alice',email:'alice@example.test',role:'developer_team' })
  await assert.rejects(f.getAssignedWorkspace(), /active sales or support session/)
  assert.equal(f.calls.length, 0)
  f.setStaff({ id:'alice',email:'alice@example.test',role:'sales_agent' })
  f.db.prepare('UPDATE staff_members SET status=? WHERE id=?').run('inactive','alice')
  const disabled = await f.getAssignedWorkspace()
  assert.deepEqual(disabled.orders, [])
  assert.deepEqual(disabled.quotes, [])
  assert.deepEqual(disabled.customers, [])
  f.db.exec('DROP TABLE followup_assignments')
  await assert.rejects(f.getAssignedWorkspace())
  f.db.close()
})

test('staff order items expose exact fields, preserve finite values and restrict product routing', async () => {
  const f = fixture()
  f.db.prepare('UPDATE orders SET items=? WHERE id=?').run(JSON.stringify([
    { productId:'engine',name:'Engine',make:'Ford',quantity:'2',unitPrice:'12.50',lineTotal:25,url:'/brands/ford/engine?secret=not-returned',password:'private' },
    { productId:'part2',name:'Part',make:'Ford',quantity:1,unitPrice:0,lineTotal:0,url:'//evil.example/path' },
    { productId:'part3',name:'Unknown price',make:'Ford',quantity:1,unitPrice:'Infinity',lineTotal:5,url:'/parts' },
  ]),'o001')
  f.db.prepare('UPDATE leads SET product_url=? WHERE id=1').run('/%2fexternal.example')
  const page = await f.getAssignedWorkspace(), order = page.orders.find(row => row.id === 'o001')
  assert.deepEqual(order.items[0], { productId:'engine',name:'Engine',make:'Ford',quantity:2,unitPrice:12.5,lineTotal:25,url:'/brands/ford/engine' })
  assert.equal(order.items[1].url, '/parts')
  assert.equal(order.items[1].unitPrice, 0)
  assert.equal(order.items.length, 2)
  assert.equal(order.itemsOmitted, 1)
  assert.equal(page.quotes[0].productUrl, null)
  assert.doesNotMatch(JSON.stringify(order), /password|private|not-returned/)
  f.db.close()
})
