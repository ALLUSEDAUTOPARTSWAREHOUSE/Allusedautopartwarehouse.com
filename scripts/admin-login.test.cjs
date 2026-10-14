const { test } = require('node:test')
const assert = require('node:assert/strict')
const { readFileSync } = require('node:fs')

const read = (path) => readFileSync(path, 'utf8')

test('admin login panel controls announce their state and hide inactive panels from keyboard focus', () => {
  const page = read('app/admin/login/page.tsx')
  assert.ok(page.includes('aria-pressed={!teamInfo}'))
  assert.ok(page.includes('aria-pressed={teamInfo}'))
  assert.ok(page.includes('inert={teamInfo}'))
  assert.ok(page.includes('inert={!teamInfo}'))
  assert.ok(page.includes('transition-all duration-500'))
})

test('team access panel does not imply staff sign-in is available', () => {
  const page = read('app/admin/login/page.tsx')
  assert.match(page, /Staff sign-in is not currently available/)
})

test('admin sidebar has only one entry for each route', () => {
  const sidebar = read('components/admin/admin-sidebar.tsx')
  const routes = [...sidebar.matchAll(/href: '([^']+)'/g)].map(([, href]) => href)
  assert.equal(new Set(routes).size, routes.length)
})
