const { test } = require('node:test')
const assert = require('node:assert/strict')
const { readFileSync } = require('node:fs')

test('upload workspace leads with preview before staged transfers and publishing', () => {
  const page = readFileSync('app/admin/uploads/page.tsx', 'utf8')
  assert.ok(page.indexOf('<UploadSheetForm') < page.indexOf('<LargeCatalogUpload'))
  assert.ok(page.indexOf('<LargeCatalogUpload') < page.indexOf('<SheetDashboardActions'))
  assert.match(page, /an import already submitted may still finish/)
})
test('publishing buttons distinguish cache refresh, account setup and external development', () => {
  const source = readFileSync('components/admin/merchant/sheet-dashboard-actions.tsx', 'utf8')
  for (const label of ['Website sync', 'Ads product feed', 'Google Merchant sync', 'Build sheet / develop in v0']) assert.ok(source.includes(label))
  assert.match(source, /useActionState\(syncProducts/)
  assert.match(source, /href="https:\/\/v0.app\/"/)
  assert.match(source, /No sheet or credentials are sent to v0/)
})
test('sheet monitor keeps cancellation scoped to transfers and marks preview as not imported', () => {
  const source = readFileSync('components/admin/merchant/large-catalog-upload.tsx', 'utf8')
  assert.match(source, /controller\?\.abort\(\)/)
  assert.match(source, /Cancel loading/)
  assert.match(source, /Preview ready · not imported/)
  assert.match(source, /Refresh sheet status/)
})
