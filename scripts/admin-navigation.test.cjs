const { test } = require('node:test')
const assert = require('node:assert/strict')
const { readFileSync } = require('node:fs')
const { runInNewContext } = require('node:vm')
const { join } = require('node:path')

const read = (path) => readFileSync(join(__dirname, '..', path), 'utf8')

test('login toggles expose selected state and keep both inactive panels inert without removing animation', () => {
  const login = read('app/admin/login/page.tsx')
  assert.match(login, /aria-pressed={!teamInfo}/)
  assert.match(login, /aria-pressed={teamInfo}/)
  assert.match(login, /aria-hidden={teamInfo} inert={teamInfo}/)
  assert.match(login, /aria-hidden={!teamInfo} inert={!teamInfo}/)
  assert.equal((login.match(/transition-all duration-500 ease-out/g) || []).length, 2)
})

test('administrator authentication and password recovery remain intact', () => {
  const login = read('app/admin/login/page.tsx')
  assert.match(login, /fetch\('\/api\/admin\/auth\/login'/)
  assert.match(login, /method: 'POST'/)
  assert.match(login, /credentials: 'include'/)
  assert.match(login, /JSON\.stringify\({ email: email\.trim\(\), password }\)/)
  assert.match(login, /router\.push\('\/admin\/dashboard'\)/)
  assert.match(login, /<form onSubmit={handleLogin}/)
  assert.match(login, /href="\/admin\/forgot-password"[^>]*>Forgot password\?/)
})

test('sidebar routes are unique and only the most specific route is active', () => {
  const sidebar = read('components/admin/admin-sidebar.tsx')
  const hrefs = [...sidebar.matchAll(/href: '([^']+)'/g)].map(match => match[1])
  assert.equal(hrefs.length, new Set(hrefs).size)
  assert.match(sidebar, /title: 'Store operations'/)
  for (const href of ['/admin/settings', '/admin/payments', '/admin/team']) {
    assert.ok(hrefs.includes(href))
  }
  const selection = sidebar.match(/const activeHref = ([\s\S]*?)\n  return/)
  assert.ok(selection)
  assert.match(sidebar, /const active = activeHref === href/)
  const select = pathname => runInNewContext(selection[1], {
    GROUPS: [{ links: hrefs.map(href => ({ href })) }],
    pathname,
  })
  for (const href of hrefs) {
    assert.equal(select(href), href)
    assert.equal(select(`${href}/details`), href)
  }
  assert.equal(select('/admin/marketing/reviews/details'), '/admin/marketing/reviews')
  assert.equal(select('/admin/marketing/social/details'), '/admin/marketing/social')
  assert.equal(select('/admin/marketing-other'), undefined)
  assert.equal(select('/admin/login'), undefined)
  assert.equal(select(null), undefined)
})

test('team access is informational and store configuration has one settings destination', () => {
  const login = read('app/admin/login/page.tsx')
  const workspace = read('app/admin/workspace/page.tsx')
  assert.match(login, /This panel is informational only/)
  assert.match(login, /Team\/staff sign-in, staff sessions and role-scoped staff dashboards are not currently implemented/)
  assert.doesNotMatch(login, /must issue secure access/)
  assert.match(workspace, /Staff sign-in and role-scoped staff dashboards are not currently implemented/)
  assert.doesNotMatch(workspace, /team access|directory & permissions/i)
  const store = workspace.slice(workspace.indexOf("title: 'Store configuration & operations'"), workspace.indexOf("title: 'AI development"))
  assert.equal((store.match(/href: '\/admin\/settings'/g) || []).length, 1)
  assert.match(store, /Store policies, email & system health/)
  assert.match(store, /href: '\/admin\/payments'/)
  assert.match(store, /href: '\/admin\/team'/)
  assert.match(store, /href: '\/admin\/development'/)
  assert.match(workspace, /if \(!session\) redirect\('\/admin\/login'\)/)
})
