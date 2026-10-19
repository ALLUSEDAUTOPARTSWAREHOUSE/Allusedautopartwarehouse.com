const { test } = require('node:test')
const assert = require('node:assert/strict')
const { readFileSync } = require('node:fs')
const { stripTypeScriptTypes } = require('node:module')
const { runInNewContext } = require('node:vm')

// Evaluate the actual redirect configuration without initializing Eve services.
const source = stripTypeScriptTypes(readFileSync('next.config.ts', 'utf8'))
  .replace(/import \{ withEve \} from "eve\/next";/, '')
  .replace('export default withEve(nextConfig);', 'globalThis.config = nextConfig;')
const context = {}
runInNewContext(source, context)

async function redirectFor(host, path) {
  const rules = await context.config.redirects()
  return rules.find((rule) => rule.source === path &&
    (!rule.has || rule.has.every((condition) => condition.type === 'host' && condition.value === host)))
}

test('admin hostname root uses the existing session-aware entry', async () => {
  const rule = await redirectFor('admin.allusedautopartswarehouse.com', '/')
  assert.equal(rule.destination, '/admin')
  assert.equal(rule.permanent, false)
})

test('storefront and preview roots are not redirected', async () => {
  for (const host of ['allusedautopartswarehouse.com', 'www.allusedautopartswarehouse.com', 'preview.vercel.app']) {
    assert.equal(await redirectFor(host, '/'), undefined)
  }
})

test('login, admin workspace and API paths are not caught in the root redirect', async () => {
  for (const path of ['/admin', '/admin/login', '/admin/workspace', '/api/portal/auth/login']) {
    assert.equal(await redirectFor('admin.allusedautopartswarehouse.com', path), undefined)
  }
})
