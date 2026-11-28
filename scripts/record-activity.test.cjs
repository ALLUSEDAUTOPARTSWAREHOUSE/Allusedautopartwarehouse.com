const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const ts = require('typescript')
const { DatabaseSync } = require('node:sqlite')
const { randomUUID } = require('node:crypto')

function load(file, dependencies) {
  const module = { exports: {} }
  const { outputText } = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } })
  new Function('require', 'module', 'exports', outputText)(name => name in dependencies ? dependencies[name] : require(name), module, module.exports)
  return module.exports
}
const alice = { id: 'alice', name: 'Alice Sales', role: 'sales_agent' }
const bob = { id: 'bob', name: 'Bob Support', role: 'support_team' }
const event = (overrides = {}) => ({ eventId: randomUUID(), recordType: 'order', recordId: 'o1', action: 'record_opened', ...overrides })

function fixture() {
  const db = new DatabaseSync(':memory:')
  db.exec(`CREATE TABLE orders(id TEXT PRIMARY KEY,status TEXT); CREATE TABLE leads(id INTEGER PRIMARY KEY,status TEXT);
    CREATE TABLE followup_assignments(record_type TEXT,record_id TEXT,staff_id TEXT);
    CREATE TABLE record_activity(id TEXT PRIMARY KEY,actor_id TEXT,actor_name TEXT,actor_role TEXT,record_type TEXT,record_id TEXT,action TEXT,outcome TEXT,source_status TEXT,note TEXT,created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')));
    INSERT INTO orders VALUES('o1','pending'),('o2','paid'),('o3','confirmed'); INSERT INTO leads VALUES(1,'new');
    INSERT INTO followup_assignments VALUES('order','o1','alice'),('order','o2','bob'),('quote','1','alice');`)
  const calls = []
  let admin = null, staff = alice
  const pool = { query: async (sql, args = []) => {
    calls.push({ sql, args })
    // Keep the application's real SQL predicates, joins and aggregates. Translate
    // PostgreSQL casts and DISTINCT record tuples for the SQLite test engine.
    const binds = []
    const sqlite = sql.replace(/public\./g, '').replace(/r\.id::text/g, 'CAST(r.id AS TEXT)').replace(/::int/g, '').replace(/count\(DISTINCT \((e\.)?record_type,\1record_id\)\)/gi, (_, p = '') => `count(DISTINCT json_array(${p}record_type,${p}record_id))`).replace(/\$(\d+)/g, (_, n) => { binds.push(args[Number(n) - 1]); return '?' })
    const rows = db.prepare(sqlite).all(...binds).map(row => ({ ...row }))
    return { rows, rowCount: rows.length }
  } }
  const module = load('lib/record-activity.ts', { 'server-only': {}, '@/lib/db': { pool }, '@/lib/admin-auth': { getAdminSession: async () => admin }, '@/lib/staff-auth': { getStaffSession: async () => staff } })
  return { ...module, db, calls, pool, setAdmin: value => { admin = value }, setStaff: value => { staff = value } }
}

test('activity derives stable signed-in actors and rejects forged client identity', async () => {
  const f = fixture()
  assert.deepEqual(await f.getActivityActor(), alice)
  f.setAdmin({ email: ' OWNER@EXAMPLE.TEST ' })
  assert.deepEqual(await f.getActivityActor(), { id: 'admin:owner@example.test', name: 'owner@example.test', role: 'admin' })
  await assert.rejects(f.recordActivity(alice, event({ actorId: 'bob' })))
  assert.equal(f.db.prepare('SELECT count(*) AS n FROM record_activity').get().n, 0)
  f.db.close()
})

test('record access follows current assignment and developer roles cannot log customer events', async () => {
  const f = fixture()
  assert.equal((await f.recordActivity(alice, event())).ok, true)
  await assert.rejects(f.recordActivity(bob, event()), error => error.status === 404)
  await assert.rejects(f.recordActivity(alice, event({ recordId: 'o3' })), error => error.status === 404)
  await assert.rejects(f.recordActivity({ ...alice, role: 'developer_team' }, event()), error => error.status === 403)
  assert.equal(f.db.prepare('SELECT count(*) AS n FROM record_activity').get().n, 1)
  f.db.close()
})

test('identical retries insert once and return the original server timestamp and observed source status', async () => {
  const f = fixture(), input = event()
  const [first, second] = await Promise.all([f.recordActivity(alice, input), f.recordActivity(alice, input)])
  assert.deepEqual([first.duplicate, second.duplicate].sort(), [false, true])
  assert.equal(first.recordedAt, second.recordedAt)
  assert.equal(f.db.prepare('SELECT count(*) AS n FROM record_activity').get().n, 1)
  f.db.prepare('UPDATE orders SET status=? WHERE id=?').run('paid', 'o1')
  const again = await f.recordActivity(alice, input)
  assert.equal(again.duplicate, true)
  assert.equal(again.sourceStatus, 'pending')
  assert.equal(again.recordedAt, first.recordedAt)
  assert.equal(again.sourceChanged, false)
  f.db.close()
})

test('event ID reuse with different action, record, actor or note fails with conflict and never overwrites evidence', async () => {
  const f = fixture(), input = event()
  await f.recordActivity(alice, input)
  for (const changed of [event({ ...input, action: 'outcome_reported', outcome: 'confirmed' }), event({ ...input, note: 'Different note' }), event({ ...input, recordType: 'quote', recordId: '1' })]) await assert.rejects(f.recordActivity(alice, changed), error => error.status === 409)
  await assert.rejects(f.recordActivity(bob, event({ ...input, recordId: 'o2' })), error => error.status === 409)
  const saved = f.db.prepare('SELECT * FROM record_activity').all()
  assert.equal(saved.length, 1)
  assert.equal(saved[0].action, 'record_opened')
  assert.equal(saved[0].note, '')
  f.db.close()
})

test('opens, reported outcomes and saved source status changes remain distinct; client events never change source rows', async () => {
  const f = fixture()
  const before = JSON.stringify(f.db.prepare('SELECT * FROM orders').all())
  await f.recordActivity(alice, event())
  await f.recordActivity(alice, event({ action: 'outcome_reported', outcome: 'confirmed', note: 'Customer stated interest; payment unverified.' }))
  await f.recordActivity(alice, event({ action: 'outcome_reported', outcome: 'confirmed' }))
  assert.equal(JSON.stringify(f.db.prepare('SELECT * FROM orders').all()), before)
  await f.writeSavedAction(f.pool, { id: 'admin:owner@example.test', name: 'owner@example.test', role: 'admin' }, 'order', 'o1', 'paid')
  f.setAdmin({ email: 'owner@example.test' })
  const report = await f.getRecordActivityReport()
  assert.equal(report.summary.events, 4)
  assert.equal(report.summary.opens, 1)
  assert.equal(report.summary.saved_changes, 1)
  assert.equal(report.byAgent.find(person => person.actor_id === 'alice').confirmed, 1)
  assert.match(report.note, /not current status totals or proof of payment/)
  f.db.close()
})

test('transaction audit helper uses the caller client and propagates failure so source changes can roll back', async () => {
  const f = fixture()
  const failure = new Error('Audit migration missing')
  f.db.exec('BEGIN')
  f.db.prepare('UPDATE orders SET status=? WHERE id=?').run('paid', 'o1')
  await assert.rejects(f.writeSavedAction({ query: async () => { throw failure } }, alice, 'order', 'o1', 'paid'), error => error === failure)
  f.db.exec('ROLLBACK')
  assert.equal(f.db.prepare('SELECT status FROM orders WHERE id=?').get('o1').status, 'pending')
  assert.equal(f.db.prepare('SELECT count(*) AS n FROM record_activity').get().n, 0)
  f.db.close()
})

test('per-person totals remain one stable row across name and role changes while event identities remain historical', async () => {
  const f = fixture()
  const first = event(); await f.recordActivity(alice, first)
  f.db.prepare('UPDATE record_activity SET created_at=? WHERE id=?').run('2026-11-27T12:00:00Z', first.eventId)
  const next = { ...alice, name: 'Alice Support', role: 'support_team' }
  await f.recordActivity(next, event())
  f.setAdmin({ email: 'owner@example.test' })
  const report = await f.getRecordActivityReport()
  assert.equal(report.byAgent.length, 1)
  assert.equal(report.byAgent[0].opens, 2)
  assert.equal(report.byAgent[0].actor_name, 'Alice Support')
  assert.equal(report.byAgent[0].actor_role, 'support_team')
  assert.deepEqual(new Set(report.events.map(row => row.actor_role)), new Set(['sales_agent', 'support_team']))
  f.db.close()
})

test('staff reports exclude other people and developer reassignment removes customer history access', async () => {
  const f = fixture()
  await f.recordActivity(alice, event())
  await f.recordActivity(bob, event({ recordId: 'o2', action: 'outcome_reported', outcome: 'unable', note: 'Private Bob note' }))
  const report = await f.getRecordActivityReport()
  assert.equal(report.events.length, 1)
  assert.equal(report.summary.events, 1)
  assert.equal(report.byAgent.length, 1)
  assert.equal(report.byAgent[0].actor_id, 'alice')
  assert.doesNotMatch(JSON.stringify(report), /Private Bob note/)
  f.setStaff({ ...alice, role: 'developer_team' })
  const queryCount = f.calls.length
  await assert.rejects(f.getRecordActivityReport(), error => error.status === 403)
  assert.equal(f.calls.length, queryCount)
  f.setStaff(null)
  await assert.rejects(f.getRecordActivityReport(), error => error.status === 401)
  f.db.close()
})

function route(actor = alice, handler) {
  const calls = []
  const module = load('app/api/record-activity/route.ts', {
    '@/lib/record-activity': {
      getActivityActor: async () => actor,
      getRecordActivityReport: async () => ({ available: true }),
      recordActivity: handler || (async (actor, input) => { calls.push({ actor, input }); return { ok: true, sourceChanged: false } }),
    },
  })
  return { ...module, calls }
}
const request = (body, headers = {}) => new Request('https://store.example/api/record-activity', { method: 'POST', headers: { origin: 'https://store.example', 'content-type': 'application/json', ...headers }, body: JSON.stringify(body) })

test('activity route checks session, origin, JSON and streamed bytes before recording', async () => {
  const anonymous = route(null)
  assert.equal((await anonymous.POST(request(event()))).status, 401)
  assert.equal(anonymous.calls.length, 0)
  const f = route()
  assert.equal((await f.POST(request(event(), { origin: 'https://attacker.test' }))).status, 403)
  assert.equal((await f.POST(request(event(), { 'content-type': 'text/plain' }))).status, 415)
  assert.equal((await f.POST(request({ note: '€'.repeat(3000) }))).status, 413)
  let pulls = 0, cancelled = false
  const stream = new ReadableStream({ pull(controller) { pulls++; controller.enqueue(new Uint8Array(4000)); if (pulls === 100) controller.close() }, cancel() { cancelled = true } })
  const chunked = new Request('https://store.example/api/record-activity', { method: 'POST', headers: { origin: 'https://store.example', 'content-type': 'application/json' }, body: stream, duplex: 'half' })
  assert.equal((await f.POST(chunked)).status, 413)
  assert.equal(cancelled, true)
  assert.ok(pulls < 100, 'the handler must stop reading oversized bodies early')
  assert.equal(f.calls.length, 0)
})

test('activity route preserves conflict status, hides provider failures and never caches reports', async () => {
  const conflict = route(alice, async () => { throw Object.assign(new Error('Event payload differs.'), { status: 409 }) })
  assert.equal((await conflict.POST(request(event()))).status, 409)
  const unavailable = route(alice, async () => { throw new Error('postgres://user:secret@private-host/db') })
  const failed = await unavailable.POST(request(event()))
  assert.equal(failed.status, 503)
  assert.doesNotMatch(await failed.text(), /secret|private-host/)
  assert.equal((await route().GET()).headers.get('cache-control'), 'no-store')
})
