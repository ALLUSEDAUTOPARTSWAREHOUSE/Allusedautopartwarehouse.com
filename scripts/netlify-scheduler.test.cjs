const { test } = require('node:test')
const assert = require('node:assert/strict')

let corePromise
const core = () => {
  corePromise ??= import('../netlify/functions/daily-cron-core.ts')
  return corePromise
}

test('Netlify schedule matches Vercel and scheduler configuration is production-pinned', async () => {
  const { DAILY_CRON_SCHEDULE, resolveSchedulerConfig } = await core()
  const vercel = require('../vercel.json')
  const dispatcher = await import('../netlify/functions/daily-cron-dispatcher.ts')

  assert.equal(DAILY_CRON_SCHEDULE, '5 13 * * *')
  assert.equal(dispatcher.config.schedule, vercel.crons[0].schedule)
  assert.deepEqual(
    resolveSchedulerConfig({
      CRON_SECRET: 'test-secret',
      CRON_TARGET_ORIGIN: 'https://parts.example.com',
      URL: 'https://parts.example.com',
    }),
    { secret: 'test-secret', targetOrigin: 'https://parts.example.com' },
  )
})

test('scheduler fails closed for missing secrets and untrusted or invalid origins', async () => {
  const { resolveSchedulerConfig } = await core()
  const base = {
    CRON_SECRET: 'test-secret',
    CRON_TARGET_ORIGIN: 'https://parts.example.com',
    URL: 'https://parts.example.com',
  }

  for (const environment of [
    { ...base, CRON_SECRET: '' },
    { ...base, URL: '' },
    { ...base, CRON_TARGET_ORIGIN: 'http://parts.example.com' },
    { ...base, CRON_TARGET_ORIGIN: 'https://parts.example.com/path' },
    { ...base, CRON_TARGET_ORIGIN: 'https://attacker.example' },
    {
      ...base,
      CRON_TARGET_ORIGIN: 'https://deploy-preview-42--parts.netlify.app',
      URL: 'https://deploy-preview-42--parts.netlify.app',
    },
  ]) {
    assert.throws(() => resolveSchedulerConfig(environment))
  }
})

test('dispatcher sends authenticated POST without following redirects and requires 202', async () => {
  const { dispatchDailyWorker } = await core()
  let request
  await dispatchDailyWorker(async (url, options) => {
    request = { url: String(url), options }
    return new Response(null, { status: 202 })
  }, 'https://parts.example.com', 'test-secret')

  assert.equal(request.url, 'https://parts.example.com/.netlify/functions/daily-cron-worker')
  assert.equal(request.options.method, 'POST')
  assert.equal(request.options.headers.authorization, ['Bearer', 'test-secret'].join(' '))
  assert.equal(request.options.redirect, 'error')
  assert.ok(request.options.signal)
  await assert.rejects(
    dispatchDailyWorker(async () => new Response(null, { status: 200 }), 'https://parts.example.com', 'test-secret'),
    /HTTP 200/,
  )
})

test('worker requires bearer authentication and POST', async () => {
  const { hasValidCronAuthorization } = await core()
  const worker = await import('../netlify/functions/daily-cron-worker.ts')
  assert.equal(worker.config.background, true)
  assert.equal(hasValidCronAuthorization(['Bearer', 'test-secret'].join(' '), 'test-secret'), true)
  assert.equal(hasValidCronAuthorization(['Bearer', 'wrong-secret'].join(' '), 'test-secret'), false)
  assert.equal(hasValidCronAuthorization(null, undefined), false)

  const originalSecret = process.env.CRON_SECRET
  process.env.CRON_SECRET = 'test-secret'
  try {
    const unauthorized = await worker.default(new Request('https://local.test/.netlify/functions/daily-cron-worker', {
      method: 'POST',
    }))
    const wrongMethod = await worker.default(new Request('https://local.test/.netlify/functions/daily-cron-worker', {
      method: 'GET',
      headers: { authorization: ['Bearer', 'test-secret'].join(' ') },
    }))
    assert.equal(unauthorized.status, 401)
    assert.equal(wrongMethod.status, 405)
  } finally {
    if (originalSecret === undefined) delete process.env.CRON_SECRET
    else process.env.CRON_SECRET = originalSecret
  }
})

test('worker waits for a successful authenticated daily route and rejects failures/timeouts', async () => {
  const { DAILY_ROUTE_TIMEOUT_MS, runDailyRoute, safeRequestError } = await core()
  let request
  await runDailyRoute(async (url, options) => {
    request = { url: String(url), options }
    return Response.json({ ok: true, skipped: 'already ran' })
  }, 'https://parts.example.com', 'test-secret')

  assert.equal(request.url, 'https://parts.example.com/api/cron/daily')
  assert.equal(request.options.method, 'GET')
  assert.equal(request.options.headers.authorization, ['Bearer', 'test-secret'].join(' '))
  assert.equal(request.options.redirect, 'error')
  assert.equal(DAILY_ROUTE_TIMEOUT_MS, 330_000)
  assert.ok(request.options.signal)
  await assert.rejects(
    runDailyRoute(async () => Response.json({ ok: false }), 'https://parts.example.com', 'test-secret'),
    /did not confirm success/,
  )
  await assert.rejects(
    runDailyRoute(async () => new Response(null, { status: 401 }), 'https://parts.example.com', 'test-secret'),
    /HTTP 401/,
  )
  await assert.rejects(
    runDailyRoute(async () => {
      throw new DOMException('request aborted', 'TimeoutError')
    }, 'https://parts.example.com', 'test-secret'),
  )
  assert.equal(safeRequestError(new DOMException('private request data', 'TimeoutError')), 'request timed out')
  assert.equal(safeRequestError(new Error('https://secret.example/token')), 'network request failed')
})
