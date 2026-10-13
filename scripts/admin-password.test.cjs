const { test } = require('node:test')
const assert = require('node:assert/strict')
const { readFileSync } = require('node:fs')
const ts = require('typescript')
function load(file, deps) {
  const { outputText } = ts.transpileModule(readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } })
  const module = { exports: {} }
  new Function('require', 'module', 'exports', outputText)((name) => {
    if (Object.hasOwn(deps, name)) return deps[name]
    if (['crypto', 'util'].includes(name)) return require(name)
    throw new Error(name)
  }, module, module.exports)
  return module.exports
}
test('password hashes are salted and reject incorrect passwords', async () => {
  const api = load('lib/admin-password.ts', { '@/lib/db': { pool: {} } })
  const a = await api.hashPassword('a-long-test-password')
  const b = await api.hashPassword('a-long-test-password')
  assert.notEqual(a, b)
  assert.equal(await api.matchesPassword('a-long-test-password', a), true)
  assert.equal(await api.matchesPassword('wrong', a), false)
  assert.equal(await api.matchesPassword('wrong', 'invalid'), false)
})
test('stored password overrides bootstrap password and rotation revokes old sessions', async () => {
  const original = process.env.ADMIN_PASSWORD
  process.env.ADMIN_PASSWORD = 'bootstrap-test-password'
  let stored = null
  const api = load('lib/admin-auth.ts', {
    '@/lib/admin-password': { readAdminPassword: async () => stored, matchesPassword: async (password, hash) => password === hash },
    'next/headers': { cookies: async () => ({ get: () => null }) },
  })
  try {
    const email = process.env.ADMIN_EMAIL || 'auapworld@gmail.com'
    assert.equal((await api.validateAdminCredentials(email, 'bootstrap-test-password')).valid, true)
    const oldToken = await api.generateAdminToken(email)
    assert.equal((await api.verifyAdminToken(oldToken)).valid, true)
    stored = { hash: 'new-test-password', version: 'v1' }
    assert.equal((await api.validateAdminCredentials(email, 'bootstrap-test-password')).valid, false)
    assert.equal((await api.validateAdminCredentials(email, 'new-test-password')).valid, true)
    assert.equal((await api.verifyAdminToken(oldToken)).valid, false)
    const newToken = await api.generateAdminToken(email)
    assert.equal((await api.verifyAdminToken(newToken)).valid, true)
    stored = { hash: 'another-password', version: 'v2' }
    assert.equal((await api.verifyAdminToken(newToken)).valid, false)
  } finally {
    if (original === undefined) delete process.env.ADMIN_PASSWORD
    else process.env.ADMIN_PASSWORD = original
  }
})
