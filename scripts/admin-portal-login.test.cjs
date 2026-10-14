const { test } = require('node:test')
const assert = require('node:assert/strict')
const { readFileSync } = require('node:fs')

const read = (path) => readFileSync(path, 'utf8')

test('authenticated administrators are sent directly to their workspace', () => {
  const page = read('app/admin/login/page.tsx')
  assert.match(page, /getAdminSession/)
  assert.match(page, /if \(await getAdminSession\(\)\) redirect\(['"]\/admin\/workspace['"]\)/)
  assert.match(page, /<AdminLoginForm \/>/)
})

test('portal login uses the endpoint response and only navigates to the assigned role workspace', () => {
  const form = read('components/admin/admin-login-form.tsx')
  const route = read('app/api/portal/auth/login/route.ts')
  assert.match(form, /fetch\(['"]\/api\/portal\/auth\/login['"]/)
  assert.match(form, /ROLE_DESTINATIONS/)
  assert.match(form, /admin: ['"]\/admin\/workspace['"]/)
  assert.match(form, /sales_agent: ['"]\/staff\/sales['"]/)
  assert.match(form, /support_team: ['"]\/staff\/support['"]/)
  assert.match(form, /developer_team: ['"]\/staff\/developer['"]/)
  assert.match(form, /data\.redirectTo !== destination/)
  assert.match(route, /role: 'admin', redirectTo: '\/admin\/workspace'/)
  assert.match(route, /role: staff\.role, redirectTo/)
})
