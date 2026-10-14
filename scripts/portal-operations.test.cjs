const { test } = require('node:test')
const assert = require('node:assert/strict')
const { readFileSync } = require('node:fs')
const ts = require('typescript')

const read = path => readFileSync(path, 'utf8')

function loadPasswordModule(path) {
  const module = { exports: {} }
  const source = ts.transpileModule(read(path), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText
  const dependencies = {
    'server-only': {},
    'next/headers': { cookies: async () => ({}) },
    '@/lib/db': { pool: { query: async () => ({ rows: [] }) } },
  }
  new Function('require', 'module', 'exports', source)(
    name => dependencies[name] ?? require(name),
    module,
    module.exports,
  )
  return module.exports
}

test('staff password hashes remain compatible with the admin security password flow', async () => {
  const staff = loadPasswordModule('lib/staff-auth.ts')
  const admin = loadPasswordModule('lib/admin-passwords.ts')
  const password = 'correct horse battery staple'
  const staffHash = await staff.hashStaffPassword(password)
  const adminHash = await admin.hashPassword(password)
  assert.match(staffHash, /^scrypt:[\da-f]{32}:[\da-f]{128}$/)
  assert.equal(await staff.verifyStaffPassword(password, adminHash), true)
  assert.equal(await admin.verifyPassword(password, staffHash), true)
})

test('staff login throttles before lookup, equalizes missing-account KDF work, and rejects ambiguous emails', () => {
  const login = read('lib/staff-login.ts')
  const auth = read('lib/staff-auth.ts')
  assert.ok(login.indexOf('checkStaffLoginRateLimit(email, ip)') < login.indexOf('FROM public.staff_members'))
  assert.match(login, /if \(result\.rows\.length !== 1\)[\s\S]*verifyStaffPassword\(password, DUMMY_PASSWORD_HASH\)/)
  assert.match(login, /LIMIT 2/)
  assert.match(login, /too many sign-in attempts[\s\S]*429/i)
  assert.match(auth, /SELECT bucket, 1, now\(\)/)
  assert.match(auth, /interval '15 minutes'/)
  assert.match(auth, /const salt = randomBytes\(16\)\s+const derived = \(await scrypt\(password, salt, 64\)\)/)
})

test('admin and staff sign-ins use separate endpoints and invalidate the other role cookie', () => {
  const adminPage = read('app/admin/login/page.tsx')
  const adminRoute = read('app/api/admin/auth/login/route.ts')
  const staffLogin = read('lib/staff-login.ts')
  const staffRoute = read('app/api/staff/auth/login/route.ts')
  assert.match(adminPage, /\/api\/admin\/auth\/login/)
  assert.match(adminPage, /href="\/staff\/login"/)
  assert.match(adminRoute, /response\.cookies\.set\(STAFF_COOKIE,[\s\S]*maxAge: 0/)
  assert.match(staffLogin, /response\.cookies\.set\(ADMIN_COOKIE,[\s\S]*maxAge: 0/)
  assert.match(staffRoute, /handleStaffLogin\(request, 'error'\)/)
  assert.match(read('app/api/portal/auth/login/route.ts'), /handleStaffLogin\(request, 'message'\)/)
})

test('operations uses live leads, checkout orders, and catalog overrides with shared statuses', () => {
  const route = read('app/api/admin/operations/route.ts')
  const client = read('components/admin/admin-operations-client.tsx')
  const statuses = read('lib/followup-statuses.ts')
  assert.match(route, /listQuoteLeads\(undefined, undefined, 100\)/)
  assert.match(route, /listOrders\(undefined, undefined, 100\)/)
  assert.match(route, /UPDATE public\.leads SET status = \$2, updated_at = now\(\)/)
  assert.match(route, /UPDATE public\.orders SET status = \$2, updatedat = now\(\)/)
  assert.match(route, /searchProductsForAdmin/)
  assert.match(route, /upsertOverride/)
  assert.doesNotMatch(route, /vinQuotes|from\(listings\)|from\(orders\)/)
  assert.match(statuses, /'new', 'contacted', 'quoted', 'won', 'lost'/)
  assert.match(statuses, /'reserved_pending_fitment'[\s\S]*'confirmed'[\s\S]*'paid'/)
  assert.match(client, /import \{ ORDER_STATUSES, QUOTE_STATUSES \} from '@\/lib\/followup-statuses'/)
  assert.doesNotMatch(client, /'pending', 'reviewed', 'quoted', 'converted'/)
})

test('obsolete staff-access link is removed from the team page', () => {
  assert.doesNotMatch(read('app/admin/team/page.tsx'), /admin\/team-access/)
})
