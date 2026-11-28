const { test } = require('node:test')
const assert = require('node:assert/strict')
const { readFileSync } = require('node:fs')
const { DatabaseSync } = require('node:sqlite')
const ts = require('typescript')

function load(path, dependencies = {}) {
  const output = ts.transpileModule(readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
  const module = { exports: {} }
  new Function('require', 'module', 'exports', output)(name => name in dependencies ? dependencies[name] : require(name), module, module.exports)
  return module.exports
}

function fixture() {
  const db = new DatabaseSync(':memory:')
  db.exec(`CREATE TABLE orders(id TEXT PRIMARY KEY,ordernumber TEXT,status TEXT,internal_notes TEXT,customer_status_note TEXT,status_history TEXT DEFAULT '[]',customer_email TEXT,updatedat TEXT,createdat TEXT);
    CREATE TABLE leads(id INTEGER PRIMARY KEY,status TEXT,internal_notes TEXT,quote_amount NUMERIC,email TEXT,full_name TEXT,phone TEXT,updated_at TEXT,created_at TEXT);
    CREATE TABLE record_activity(id TEXT PRIMARY KEY,actor_id TEXT,actor_name TEXT,actor_role TEXT,record_type TEXT,record_id TEXT,action TEXT,outcome TEXT,source_status TEXT,note TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP);
    INSERT INTO orders VALUES('order_1','AUA-TEST','pending','original internal note','original customer note','[]','customer@example.test','2026-11-28T10:00:00Z','2026-11-28T09:00:00Z');
    INSERT INTO leads VALUES(1,'new','original lead note',125.50,'lead@example.test','Test Lead','555-0100','2026-11-28T10:00:00Z','2026-11-28T09:00:00Z');`)
  let session = { email: ' OWNER@EXAMPLE.TEST ' }, failAudit = false, loseCommitResponse = false, lock = Promise.resolve()
  const calls = [], released = [], revalidated = [], sent = []
  async function query(sql, args = [], source = 'pool') {
    calls.push({ sql, args, source })
    if (failAudit && sql.includes('INSERT INTO public.record_activity')) throw Error('private-provider-details')
    const binds = []
    // Retain the real SQL predicates and update statements. Translate only the
    // PostgreSQL row-lock, timestamp and JSON-append syntax for SQLite fixtures.
    const sqlite = sql.replace(/public\./g, '').replace(/ FOR UPDATE/g, '')
      .replace(/coalesce\(status_history, '\[\]'::jsonb\) \|\| jsonb_build_array\(\$5::jsonb\)/g, "json_insert(coalesce(status_history, '[]'), '$[#]', json($5))")
      .replace(/now\(\)/gi, "strftime('%Y-%m-%dT%H:%M:%fZ','now')")
      .replace(/\$(\d+)/g, (_, number) => { binds.push(args[Number(number) - 1] ?? null); return '?' })
    try {
      const rows = db.prepare(sqlite).all(...binds).map(row => ({ ...row, ...(typeof row.status_history === 'string' ? { status_history: JSON.parse(row.status_history) } : {}) }))
      return { rows, rowCount: rows.length }
    } catch (error) {
      if (/no such table/.test(error.message)) error.code = '42P01'
      if (/no such column/.test(error.message)) error.code = '42703'
      throw error
    }
  }
  const pool = {
    query: (sql, args) => query(sql, args),
    async connect() {
      let unlock = null
      return {
        async query(sql, args) {
          if (sql === 'BEGIN') {
            const previous = lock
            lock = new Promise(resolve => { unlock = resolve })
            await previous
            calls.push({ sql, source: 'client' }); db.exec('BEGIN'); return { rows: [] }
          }
          if (sql === 'COMMIT' || sql === 'ROLLBACK') {
            calls.push({ sql, source: 'client' })
            try { db.exec(sql) } finally { unlock?.(); unlock = null }
            if (sql === 'COMMIT' && loseCommitResponse) throw Error('network response lost after commit')
            return { rows: [] }
          }
          return query(sql, args, 'client')
        },
        release(discard) { released.push(discard); unlock?.(); unlock = null },
      }
    },
  }
  const auth = { getAdminSession: async () => session }
  const activity = load('lib/record-activity.ts', { 'server-only': {}, '@/lib/db': { pool }, '@/lib/admin-auth': auth, '@/lib/staff-auth': { getStaffSession: async () => null } })
  const followup = load('lib/followup.ts', { 'server-only': {}, '@/lib/db': { pool }, '@/lib/order-status': load('lib/order-status.ts'), '@/lib/record-activity': activity })
  const actions = load('app/admin/followup-actions.ts', {
    'next/cache': { revalidatePath: path => revalidated.push(path) }, '@/lib/admin-auth': auth, '@/lib/followup': followup,
    '@/lib/followup-notify': {
      sendQuoteEmail: async (...args) => { sent.push({ type: 'quote', args }); return { ok: true } },
      sendOrderStatusEmail: async (...args) => { sent.push({ type: 'order', args }); return { ok: true } },
    }, '@/lib/merchant': { SITE_URL: 'https://example.test' }, '@/lib/followup-assignments': {},
  })
  const operations = load('app/api/admin/operations/route.ts', {
    'next/server': { NextResponse: Response }, 'next/cache': { revalidatePath: path => revalidated.push(path) },
    'drizzle-orm': {}, '@/lib/db': { db: {} }, '@/lib/db/schema': {}, '@/lib/admin-auth': auth,
    '@/lib/followup': followup, '@/lib/admin-customers': {},
  })
  return {
    db, calls, released, revalidated, sent, followup, actions, operations,
    get session() { return session }, setSession(value) { session = value },
    setFailAudit(value) { failAudit = value }, setLoseCommitResponse(value) { loseCommitResponse = value },
    order: () => ({ ...db.prepare('SELECT * FROM orders WHERE id=?').get('order_1') }),
    lead: () => ({ ...db.prepare('SELECT * FROM leads WHERE id=1').get() }),
    events: () => db.prepare('SELECT * FROM record_activity ORDER BY rowid').all().map(row => ({ ...row })),
  }
}
function form(values) { const data = new FormData(); for (const [key, value] of Object.entries(values)) data.set(key, value); return data }
const patchRequest = (body, origin = 'https://example.test') => new Request('https://example.test/api/admin/operations', { method: 'PATCH', headers: { origin, 'content-type': 'application/json' }, body: JSON.stringify(body) })

test('order status, customer history and audit commit together with stable server identity and no note leakage', async () => {
  const f = fixture()
  const result = await f.followup.updateOrder('order_1', { status: 'confirmed', internalNotes: 'private internal detail', customerNote: 'private customer message' }, f.session)
  assert.equal(result.statusChanged, true)
  assert.equal(result.historyRecorded, true)
  const order = f.order()
  assert.equal(order.status, 'confirmed')
  assert.equal(order.customer_status_note, 'private customer message')
  assert.equal(JSON.parse(order.status_history)[0].note, 'private customer message')
  assert.equal(f.events().length, 1)
  assert.deepEqual([f.events()[0].actor_id, f.events()[0].actor_name, f.events()[0].actor_role], ['admin:owner@example.test', 'owner@example.test', 'admin'])
  assert.equal(f.events()[0].action, 'source_status_saved')
  assert.equal(f.events()[0].source_status, 'confirmed')
  assert.doesNotMatch(JSON.stringify(f.events()), /private internal|private customer|customer@example/)
  assert.ok(f.calls.some(call => call.sql.includes('FOR UPDATE')))
  assert.ok(f.calls.filter(call => /UPDATE|INSERT/.test(call.sql)).every(call => call.source === 'client'))
  assert.doesNotMatch(f.calls.map(call => call.sql).join('\n'), /ALTER TABLE|email_verify_token|invoice_token/)
  assert.deepEqual(f.released, [false])
  f.db.close()
})

test('unchanged statuses keep existing customer note and history; changed notes still append history', async () => {
  const f = fixture()
  const unchanged = await f.followup.updateOrder('order_1', { status: 'pending', customerNote: '  ' }, f.session)
  assert.equal(unchanged.historyRecorded, false)
  assert.equal(f.order().internal_notes, 'original internal note')
  assert.equal(f.order().customer_status_note, 'original customer note')
  assert.deepEqual(JSON.parse(f.order().status_history), [])
  const changed = await f.followup.updateOrder('order_1', { status: 'pending', customerNote: 'A new customer note' }, f.session)
  assert.equal(changed.statusChanged, false)
  assert.equal(changed.historyRecorded, true)
  assert.equal(JSON.parse(f.order().status_history).length, 1)
  assert.equal(f.events().length, 2)
  f.db.close()
})

test('concurrent order saves compare the locked latest status and do not append duplicate transition history', async () => {
  const f = fixture()
  const results = await Promise.all([
    f.followup.updateOrder('order_1', { status: 'confirmed' }, f.session),
    f.followup.updateOrder('order_1', { status: 'confirmed' }, f.session),
  ])
  assert.deepEqual(results.map(result => result.statusChanged).sort(), [false, true])
  assert.equal(JSON.parse(f.order().status_history).length, 1)
  assert.equal(f.events().length, 2)
  f.db.close()
})

test('quote save preserves omitted fields under the lock and treats explicit null amount as a clear', async () => {
  const f = fixture()
  await f.followup.updateQuoteLead(1, { status: 'quoted' }, f.session)
  assert.equal(f.lead().quote_amount, 125.5)
  assert.equal(f.lead().internal_notes, 'original lead note')
  await f.followup.updateQuoteLead(1, { status: 'contacted', quoteAmount: null, internalNotes: '' }, f.session)
  assert.equal(f.lead().quote_amount, null)
  assert.equal(f.lead().internal_notes, null)
  assert.equal(f.events()[1].record_id, '1')
  assert.equal(f.events()[1].record_type, 'quote')
  f.db.close()
})

test('missing records and invalid actors never report a save or create activity', async () => {
  const f = fixture()
  await assert.rejects(f.followup.updateOrder('missing', { status: 'paid' }, f.session), error => error.status === 404)
  await assert.rejects(f.followup.updateQuoteLead(99, { status: 'won' }, f.session), error => error.status === 404)
  const calls = f.calls.length
  await assert.rejects(f.followup.updateOrder('order_1', { status: 'paid' }, null), error => error.status === 401)
  await assert.rejects(f.followup.updateQuoteLead(1.5, { status: 'won' }, f.session), error => error.status === 400)
  assert.equal(f.calls.length, calls)
  assert.equal(f.events().length, 0)
  assert.equal(f.order().status, 'pending')
  f.db.close()
})

test('audit failure rolls order status, internal/customer notes, history and quote amount back', async () => {
  const f = fixture(), beforeOrder = f.order(), beforeLead = f.lead()
  f.setFailAudit(true)
  await assert.rejects(f.followup.updateOrder('order_1', { status: 'paid', internalNotes: 'changed', customerNote: 'changed' }, f.session), error => error.status === 503 && !error.message.includes('private-provider'))
  await assert.rejects(f.followup.updateQuoteLead(1, { status: 'won', quoteAmount: 990, internalNotes: 'changed' }, f.session), error => error.status === 503)
  assert.deepEqual(f.order(), beforeOrder)
  assert.deepEqual(f.lead(), beforeLead)
  assert.equal(f.events().length, 0)
  assert.deepEqual(f.released, [true, true])
  f.db.close()
})

test('missing activity migration yields a useful schema error and rolls back source changes', async () => {
  const f = fixture(), before = f.order()
  f.db.exec('DROP TABLE record_activity')
  await assert.rejects(f.followup.updateOrder('order_1', { status: 'paid' }, f.session), error => error.code === 'FOLLOWUP_SCHEMA_UNAVAILABLE' && /record-activity migration/.test(error.message))
  assert.deepEqual(f.order(), before)
  f.db.close()
})

test('lost commit acknowledgment is reported as uncertain instead of claiming a rollback or success', async () => {
  const f = fixture()
  f.setLoseCommitResponse(true)
  await assert.rejects(f.followup.updateOrder('order_1', { status: 'confirmed' }, f.session), error => error.code === 'FOLLOWUP_SAVE_UNCERTAIN' && /Refresh the record and activity history/.test(error.message))
  assert.equal(f.order().status, 'confirmed')
  assert.equal(f.events().length, 1)
  f.db.close()
})

test('forms reject missing sessions and never email or revalidate failed audited saves', async () => {
  const f = fixture()
  const orderForm = form({ id: 'order_1', status: 'paid', emailCustomer: 'on', actorId: 'forged', actorEmail: 'forged@example.test' })
  f.setSession(null)
  assert.equal((await f.actions.saveOrderFollowup({}, orderForm)).ok, false)
  assert.equal(f.calls.length, 0)
  f.setSession({ email: ' OWNER@EXAMPLE.TEST ' })
  f.setFailAudit(true)
  assert.equal((await f.actions.saveOrderFollowup({}, orderForm)).ok, false)
  assert.equal((await f.actions.saveQuoteFollowup({}, form({ id: '1', status: 'quoted', quoteAmount: '100', emailQuote: 'on' }))).ok, false)
  assert.equal(f.sent.length, 0)
  assert.deepEqual(f.revalidated, [])
  assert.equal(f.order().status, 'pending')
  assert.equal(f.lead().status, 'new')
  f.db.close()
})

test('successful forms preserve notification conditions and refresh the actual activity report', async () => {
  const f = fixture()
  assert.equal((await f.actions.saveOrderFollowup({}, form({ id: 'order_1', status: 'pending' }))).ok, true)
  assert.equal(f.sent.length, 0)
  assert.equal((await f.actions.saveOrderFollowup({}, form({ id: 'order_1', status: 'confirmed', actorId: 'forged' }))).ok, true)
  assert.equal(f.sent.length, 1)
  assert.equal((await f.actions.saveOrderFollowup({}, form({ id: 'order_1', status: 'confirmed', emailCustomer: 'on' }))).ok, true)
  assert.equal(f.sent.length, 2)
  assert.equal((await f.actions.saveQuoteFollowup({}, form({ id: '1', status: 'quoted', quoteAmount: '199.95' }))).ok, true)
  assert.equal(f.sent.length, 2)
  assert.equal((await f.actions.saveQuoteFollowup({}, form({ id: '1', status: 'quoted', quoteAmount: '199.95', emailQuote: 'on' }))).ok, true)
  assert.equal(f.sent.length, 3)
  assert.ok(f.revalidated.includes('/admin/activity'))
  assert.ok(f.events().every(event => event.actor_id === 'admin:owner@example.test'))
  f.db.close()
})

test('operations PATCH derives identity from its session and requires origin/auth before mutating', async () => {
  const f = fixture()
  f.setSession(null)
  assert.equal((await f.operations.PATCH(patchRequest({ type: 'order', id: 'order_1', status: 'paid' }))).status, 401)
  f.setSession({ email: ' OWNER@EXAMPLE.TEST ' })
  assert.equal((await f.operations.PATCH(patchRequest({ type: 'order', id: 'order_1', status: 'paid' }, 'https://evil.test'))).status, 403)
  assert.equal(f.calls.length, 0)
  const saved = await f.operations.PATCH(patchRequest({ type: 'order', id: 'order_1', status: 'confirmed', actorId: 'forged', actor: { email: 'forged@example.test' } }))
  assert.equal(saved.status, 200)
  assert.equal(f.events()[0].actor_id, 'admin:owner@example.test')
  assert.equal(f.order().internal_notes, 'original internal note')
  const quote = await f.operations.PATCH(patchRequest({ type: 'quote', id: 1, status: 'quoted' }))
  assert.equal(quote.status, 200)
  assert.equal(f.lead().quote_amount, 125.5)
  assert.ok(f.revalidated.includes('/admin/activity'))
  assert.equal(f.sent.length, 0)
  f.db.close()
})

test('operations PATCH surfaces missing records and activity storage failure without a successful result', async () => {
  const f = fixture()
  assert.equal((await f.operations.PATCH(patchRequest({ type: 'quote', id: '1.5', status: 'won' }))).status, 400)
  assert.equal((await f.operations.PATCH(patchRequest({ type: 'order', id: 'missing', status: 'paid' }))).status, 404)
  f.db.exec('DROP TABLE record_activity')
  const failed = await f.operations.PATCH(patchRequest({ type: 'order', id: 'order_1', status: 'paid' }))
  const body = await failed.json()
  assert.equal(failed.status, 503)
  assert.equal(body.code, 'FOLLOWUP_SCHEMA_UNAVAILABLE')
  assert.equal(body.success, undefined)
  assert.equal(f.order().status, 'pending')
  assert.deepEqual(f.revalidated, [])
  f.db.close()
})
