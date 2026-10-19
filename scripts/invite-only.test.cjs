const { test } = require('node:test')
const assert = require('node:assert/strict')
const { readFileSync } = require('node:fs')
const ts = require('typescript')
function load(path, deps) {
  const output = ts.transpileModule(readFileSync(path, 'utf8'), { compilerOptions: { jsx: ts.JsxEmit.React, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
  const module = { exports: {} }
  new Function('require', 'module', 'exports', output)(name => name in deps ? deps[name] : require(name), module, module.exports)
  return module.exports
}
function invitations() {
  const records = new Map()
  const pool = { query: async (sql, args) => {
    if (sql.includes('CREATE TABLE')) return { rows: [] }
    if (sql.includes('INSERT INTO')) { records.set(args[0], { email: args[1], expires: Date.now() + 1000, consumed: false }); return { rows: [] } }
    if (sql.includes('UPDATE')) {
      assert.match(sql, /token_hash = \$1 AND email = \$2 AND consumed_at IS NULL AND expires_at > NOW\(\)/)
      const row = records.get(args[0])
      if (!row || row.email !== args[1] || row.consumed || row.expires <= Date.now()) return { rows: [] }
      row.consumed = true
      return { rows: [{ token_hash: args[0] }] }
    }
    if (sql.includes('DELETE')) records.delete(args[0])
    return { rows: [] }
  } }
  return { ...load('lib/customer-invites.ts', { 'server-only': {}, '@/lib/db': { pool } }), records }
}
test('customer invitations bind email, expire, and can be consumed only once', async () => {
  const invites = invitations()
  assert.equal(await invites.consumeCustomerInvite('user@example.com', null), false)
  const token = await invites.createCustomerInvite('User@Example.com')
  assert.equal(token.length, 43)
  assert.equal(await invites.consumeCustomerInvite('wrong@example.com', token), false)
  assert.equal(await invites.consumeCustomerInvite('user@example.com', 'x'.repeat(43)), false)
  const outcomes = await Promise.all([invites.consumeCustomerInvite('user@example.com', token), invites.consumeCustomerInvite('user@example.com', token)])
  assert.deepEqual(outcomes, [true, false])
  const expired = await invites.createCustomerInvite('user@example.com')
  invites.records.get(invites.inviteDigest(expired)).expires = 0
  assert.equal(await invites.consumeCustomerInvite('user@example.com', expired), false)
  const revoked = await invites.createCustomerInvite('user@example.com')
  await invites.revokeCustomerInvite(revoked)
  assert.equal(await invites.consumeCustomerInvite('user@example.com', revoked), false)
})
test('all new Better Auth users require an invitation, existing sessions are unchanged', async () => {
  class APIError extends Error {}
  const config = load('lib/auth.ts', {
    'better-auth': { betterAuth: options => options }, 'better-auth/api': { APIError }, '@/lib/db': { pool: {} },
    '@/lib/customer-invites': { consumeCustomerInvite: async (email, token) => email === 'user@example.com' && token === 'valid' },
  }).auth
  const before = config.databaseHooks.user.create.before
  await assert.rejects(() => before({ email: 'user@example.com' }, null))
  await assert.rejects(() => before({ email: 'other@example.com' }, { headers: new Headers({ 'x-auapw-invite': 'valid' }) }))
  assert.deepEqual(await before({ email: 'user@example.com' }, { headers: new Headers({ 'x-auapw-invite': 'valid' }) }), { data: { email: 'user@example.com' } })
  assert.equal(config.databaseHooks.session, undefined)
})
test('customer invitation sending is admin-only and rejects cross-origin requests', async () => {
  const make = session => load('app/api/admin/customer-invites/route.ts', {
    '@/lib/admin-auth': { getAdminSession: async () => session },
    '@/lib/customer-invites': { createCustomerInvite: () => assert.fail('created invite'), revokeCustomerInvite: () => {} },
  }).POST
  const req = origin => new Request('https://store.example/api/admin/customer-invites', { method: 'POST', headers: { origin, 'content-type': 'application/json' }, body: JSON.stringify({ email: 'user@example.com' }) })
  assert.equal((await make(null)(req('https://store.example'))).status, 401)
  assert.equal((await make({})(req('https://evil.example'))).status, 403)
})
test('invalid staff tokens do not consume the valid invitation', async () => {
  process.env.ADMIN_SESSION_SECRET ||= 'test-only-secret'
  let used = false
  const invite = load('lib/staff-invites.ts', { 'server-only': {}, '@/lib/db': { pool: { query: async (sql, args) => {
    if (!sql.includes('RETURNING id')) return { rows: [] }
    assert.match(sql, /staff_id = \$1 AND token_hash = \$2/)
    const expected = require('node:crypto').createHash('sha256').update(`valid:${process.env.BETTER_AUTH_SECRET || process.env.ADMIN_SESSION_SECRET}`).digest('hex')
    if (used || args[1] !== expected) return { rows: [] }
    used = true
    return { rows: [{ id: 1 }] }
  } } } })
  assert.equal(await invite.consumeStaffInvite('wrong', 'staff1'), false)
  assert.equal(await invite.consumeStaffInvite('valid', 'staff1'), true)
  assert.equal(await invite.consumeStaffInvite('valid', 'staff1'), false)
})

test('customer invite sender uses configured origin, never returns token, and revokes rejected email', async () => {
  const old = { key: process.env.RESEND_API_KEY, from: process.env.ADMIN_RESET_FROM, url: process.env.AUAPW_PUBLIC_URL, fetch: global.fetch }
  process.env.RESEND_API_KEY = 'test-provider-key'
  process.env.ADMIN_RESET_FROM = 'sender@example.com'
  process.env.AUAPW_PUBLIC_URL = 'https://store.example'
  let revoked = false
  let accepted = true
  global.fetch = async (_url, options) => {
    const payload = JSON.parse(options.body)
    assert.deepEqual(payload.to, ['user@example.com'])
    assert.match(payload.text, /https:\/\/store.example\/sign-up\?invite=test-invite/)
    return { ok: accepted }
  }
  try {
    const post = load('app/api/admin/customer-invites/route.ts', {
      '@/lib/admin-auth': { getAdminSession: async () => ({}) },
      '@/lib/customer-invites': { createCustomerInvite: async () => 'test-invite', revokeCustomerInvite: async () => { revoked = true } },
    }).POST
    const req = () => new Request('https://admin.example/api/admin/customer-invites', { method: 'POST', headers: { origin: 'https://admin.example', 'content-type': 'application/json' }, body: JSON.stringify({ email: 'user@example.com', role: 'admin' }) })
    const response = await post(req())
    assert.equal(response.status, 200)
    assert.doesNotMatch(await response.text(), /test-invite/)
    accepted = false
    assert.equal((await post(req())).status, 503)
    assert.equal(revoked, true)
  } finally {
    global.fetch = old.fetch
    for (const [name, value] of [['RESEND_API_KEY', old.key], ['ADMIN_RESET_FROM', old.from], ['AUAPW_PUBLIC_URL', old.url]]) {
      if (value === undefined) delete process.env[name]
      else process.env[name] = value
    }
  }
})

test('account signup forwards its invitation without changing sign-in', async () => {
  let value
  const calls = []
  const react = {
    createContext: () => ({ Provider: ({ value: provided }) => { value = provided } }),
    useContext: () => value,
    useEffect: () => {},
    createElement: (type, props) => type(props),
  }
  const { AuthProvider } = load('lib/auth-context.tsx', {
    react: { ...react, default: react },
    '@/lib/auth-client': { authClient: {
      useSession: () => ({ data: null, isPending: false, refetch: async () => {} }),
      signUp: { email: async (...args) => { calls.push(args); return {} } },
      signIn: { email: async (...args) => { calls.push(args); return {} } },
    } },
  })
  AuthProvider({ children: null })
  await value.signup('user@example.com', 'password123', 'Customer', 'a'.repeat(43))
  assert.deepEqual(calls.pop(), [
    { email: 'user@example.com', password: 'password123', name: 'Customer' },
    { headers: { 'x-auapw-invite': 'a'.repeat(43) } },
  ])
  await value.login('user@example.com', 'password123')
  assert.deepEqual(calls.pop(), [{ email: 'user@example.com', password: 'password123' }])
})
