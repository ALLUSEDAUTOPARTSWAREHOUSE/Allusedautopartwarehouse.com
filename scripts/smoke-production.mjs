import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { closeSync, mkdirSync, openSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { fileURLToPath } from 'node:url'

// Run after the local production build. The server and its probes intentionally
// share one process environment/network namespace and shut down together.
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const output = process.env.AUAPW_SMOKE_OUTPUT_DIR || resolve(root, '.eve', 'smoke')
const port = Number(process.env.AUAPW_SMOKE_PORT || 3100)
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('Choose a valid AUAPW_SMOKE_PORT.')
if (process.env.VERCEL || process.env.EVE_DEV === '1') throw new Error('Run this check against a local production build outside a Vercel or Eve development environment.')
mkdirSync(output, { recursive: true })
const log = openSync(resolve(output, 'runtime-smoke-server.log'), 'w')
const origin = `http://127.0.0.1:${port}`
const server = spawn(process.execPath, [resolve(root, 'node_modules/next/dist/bin/next'), 'start', '--hostname', '127.0.0.1', '--port', String(port)], {
  cwd: root, env: { ...process.env, NODE_ENV: 'production' }, stdio: ['ignore', log, log], detached: process.platform !== 'win32',
})
const stopped = once(server, 'exit')
const report = { checkedAt: new Date().toISOString(), origin, mode: 'production', modelRequests: false, requestCredentials: 'none', serverEnvironment: 'Inherited current environment with NODE_ENV=production; probes send no cookies or Authorization header.', results: [], passed: false, serverStopped: false }
async function probe({ path, method = 'GET', expected, location }) {
  try {
    const response = await fetch(origin + path, { method, redirect: 'manual', headers: { origin, ...(method === 'POST' ? { 'content-type': 'application/json' } : {}) }, ...(method === 'POST' ? { body: '{}' } : {}), signal: AbortSignal.timeout(10000) })
    const actualLocation = response.headers.get('location')
    await response.arrayBuffer()
    return { path, method, status: response.status, expected, ...(actualLocation ? { location: actualLocation } : {}), passed: response.status === expected && (!location || actualLocation === location) }
  } catch (error) { return { path, method, error: error.name, passed: false } }
}
try {
  let ready = false
  for (let attempt = 0; attempt < 60 && server.exitCode === null; attempt++) {
    try {
      const response = await fetch(`${origin}/eve/v1/health`, { signal: AbortSignal.timeout(1000) })
      await response.arrayBuffer()
      if (response.status === 200) { ready = true; break }
    } catch { /* Wait briefly for both production processes. */ }
    await delay(250)
  }
  if (!ready) throw new Error('The Next.js and Eve production servers did not become ready. Inspect the runtime smoke server log.')
  report.results = await Promise.all([
    { path: '/admin/login', expected: 200 },
    { path: '/staff/login', expected: 307, location: '/admin/login' },
    { path: '/admin/dashboard', expected: 307, location: '/admin/login' },
    { path: '/admin/activity', expected: 307, location: '/admin/login' },
    { path: '/staff/sales', expected: 307, location: '/staff/login' },
    { path: '/staff/support', expected: 307, location: '/staff/login' },
    { path: '/staff/developer', expected: 307, location: '/staff/login' },
    { path: '/api/admin/commands/12345678-1234-4234-9234-123456789012', expected: 401 },
    { path: '/api/admin/workspace-summary', expected: 401 },
    { path: '/api/admin/operations', expected: 401 },
    { path: '/api/record-activity', expected: 401 },
    { path: '/api/admin/assistant', method: 'POST', expected: 401 },
    { path: '/api/staff/assistant', method: 'POST', expected: 401 },
    { path: '/eve/v1/health', expected: 200 },
    { path: '/eve/v1/info', expected: 401 },
  ].map(probe))
  // Verify the same policy on a bodyless session request only after inspection
  // has rejected anonymous access. No message or model invocation is submitted.
  if (report.results.find(result => result.path === '/eve/v1/info')?.passed) {
    report.results.push(await probe({ path: '/eve/v1/session', method: 'POST', expected: 401 }))
  }
  report.passed = report.results.length === 16 && report.results.every(result => result.passed)
} catch (error) {
  report.error = error.message
} finally {
  if (server.exitCode === null && server.signalCode === null) {
    try { process.platform === 'win32' ? server.kill('SIGTERM') : process.kill(-server.pid, 'SIGTERM') } catch { /* Already exited. */ }
    await Promise.race([stopped, delay(3000)])
    if (server.exitCode === null && server.signalCode === null) {
      try { process.platform === 'win32' ? server.kill('SIGKILL') : process.kill(-server.pid, 'SIGKILL') } catch { /* Already exited. */ }
      await Promise.race([stopped, delay(1000)])
    }
  }
  report.serverStopped = server.exitCode !== null || server.signalCode !== null
  closeSync(log)
  writeFileSync(resolve(output, 'production-runtime-smoke.json'), JSON.stringify(report, null, 2) + '\n')
}
console.log(JSON.stringify(report, null, 2))
process.exitCode = report.passed && report.serverStopped ? 0 : 1
