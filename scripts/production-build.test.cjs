const { test } = require('node:test')
const assert = require('node:assert/strict')

test('local production builds the Eve runtime before Next using the same pinned Node executable', async () => {
  const { runProductionBuild } = await import('./build-production.mjs')
  const calls = []
  const code = runProductionBuild({ environment: {}, nextArguments: [], execute: (...args) => { calls.push(args); return { status: 0 } } })
  assert.equal(code, 0)
  assert.equal(calls.length, 2)
  assert.equal(calls[0][0], process.execPath)
  assert.match(calls[0][1][0], /node_modules\/eve\/bin\/eve\.js$/)
  assert.deepEqual(calls[0][1].slice(1), ['build'])
  assert.match(calls[1][1][0], /node_modules\/next\/dist\/bin\/next$/)
  assert.equal(calls[0][2].env.NODE_ENV, 'production')
  assert.equal(calls[0][2].cwd, calls[1][2].cwd)
})

test('Vercel leaves Eve packaging to the generated service build and forwards Next build arguments', async () => {
  const { runProductionBuild } = await import('./build-production.mjs')
  const calls = []
  assert.equal(runProductionBuild({ environment: { VERCEL: '1' }, nextArguments: ['--webpack'], execute: (...args) => { calls.push(args); return { status: 0 } } }), 0)
  assert.equal(calls.length, 1)
  assert.match(calls[0][1][0], /node_modules\/next\/dist\/bin\/next$/)
  assert.deepEqual(calls[0][1].slice(1), ['build', '--webpack'])
})

test('a missing or failed Eve runtime build stops before a misleading successful web-only build', async () => {
  const { runProductionBuild } = await import('./build-production.mjs')
  for (const failure of [{ status: 2 }, { status: null, signal: 'SIGTERM' }, { error: new Error('spawn failed') }]) {
    let calls = 0
    const result = runProductionBuild({ environment: {}, nextArguments: [], execute: () => { calls++; return failure } })
    assert.notEqual(result, 0)
    assert.equal(calls, 1)
  }
})
