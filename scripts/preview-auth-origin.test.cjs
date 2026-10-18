const { test } = require('node:test')
const assert = require('node:assert/strict')
const { readFileSync } = require('node:fs')
const ts = require('typescript')
function configuration(env) {
  const source = readFileSync('lib/auth.ts', 'utf8')
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText
  const module = { exports: {} }
  const dependencies = {
    '@/lib/customer-invites': { consumeCustomerInvite: async () => false },
    'better-auth/api': { APIError: Error },
    'better-auth': { betterAuth: options => options },
    '@/lib/db': { pool: {} },
  }
  new Function('require', 'module', 'exports', 'process', output)(name => dependencies[name], module, module.exports, { env })
  return module.exports.auth
}
test('exact branch alias is trusted alongside immutable deployment and production origins', () => {
  const config = configuration({
    VERCEL_URL: 'store-immutable-team.vercel.app',
    VERCEL_BRANCH_URL: 'store-git-feature-team.vercel.app',
    AUAPW_PUBLIC_URL: 'https://store.example',
  })
  assert.ok(config.trustedOrigins.includes('https://store-git-feature-team.vercel.app'))
  assert.ok(config.trustedOrigins.includes('https://store-immutable-team.vercel.app'))
  assert.ok(config.trustedOrigins.includes('https://store.example'))
  assert.ok(!config.trustedOrigins.includes('https://attacker.vercel.app'))
  assert.ok(config.trustedOrigins.every(origin => !origin.includes('*')))
  assert.equal(config.advanced, undefined)
  assert.equal(config.baseURL, 'https://store.example')
})
test('missing branch URL adds no undefined origin and preserves invite gate and sessions', async () => {
  const config = configuration({ AUAPW_PUBLIC_URL: 'https://store.example' })
  assert.deepEqual(config.trustedOrigins, ['https://store.example'])
  assert.equal(config.session.expiresIn, 604800)
  await assert.rejects(() => config.databaseHooks.user.create.before({ email: 'user@example.com' }, null))
})
