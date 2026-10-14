const { test } = require('node:test')
const assert = require('node:assert/strict')
const { readFileSync } = require('node:fs')

const read = (path) => readFileSync(path, 'utf8')

test('admin login panels expose selection and keep inactive content out of keyboard navigation', () => {
  const login = read('app/admin/login/page.tsx')
  assert.match(login, /aria-pressed={!teamInfo} aria-controls="administrator-panel"/)
  assert.match(login, /aria-pressed={teamInfo} aria-controls="team-access-panel"/)
  assert.match(login, /aria-hidden={teamInfo} inert={teamInfo}/)
  assert.match(login, /aria-hidden={!teamInfo} inert={!teamInfo}/)
  assert.match(login, /transition-all duration-500 ease-out/)
  assert.match(login, /staff sign-in and staff session flows are not implemented/i)
  assert.match(login, /fetch\('\/api\/admin\/auth\/login'/)
  assert.match(login, /href="\/admin\/forgot-password"/)
  assert.match(login, /router\.push\('\/admin\/dashboard'\)/)
})

test('admin sidebar and unified workspace use one canonical entry per operations route', () => {
  const sidebar = read('components/admin/admin-sidebar.tsx')
  const workspace = read('app/admin/workspace/page.tsx')

  for (const [href, label] of [
    ['/admin/settings', 'System settings'],
    ['/admin/payments', 'Payments'],
    ['/admin/team', 'Team'],
  ]) {
    const route = href.replaceAll('/', '\\/')
    assert.equal((sidebar.match(new RegExp(`href: '${route}'`, 'g')) || []).length, 1)
    assert.equal((workspace.match(new RegExp(`href: '${route}'`, 'g')) || []).length, 1)
    assert.match(workspace, new RegExp(`label: '${label}', href: '${route}'`))
  }

  assert.match(workspace, /staff sign-in, staff sessions, and role-scoped staff dashboards are not implemented/i)
  assert.doesNotMatch(workspace, /Team members|Team directory & permissions|Payment methods|Email delivery settings/)
})
