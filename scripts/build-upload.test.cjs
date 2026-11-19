const { test } = require('node:test')
const assert = require('node:assert/strict')
const { readFileSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } = require('node:fs')
const { tmpdir } = require('node:os')
const { resolve, join, dirname } = require('node:path')
const { execFileSync } = require('node:child_process')

const workflow = readFileSync(resolve(__dirname, '../.github/workflows/build-upload.yml'), 'utf8')
const packageStep = workflow.match(/      - name: Package build output\n        shell: bash\n        run: \|\n((?:          .*\n)+)/)
assert.ok(packageStep, 'workflow must provide the packaging command')
const packageCommand = packageStep[1].replace(/^          /gm, '')

test('build workflow is secretless, read-only, and uploads only after building', () => {
  assert.match(workflow, /pull_request:\n    branches: \["main"\]/)
  assert.match(workflow, /push:\n    branches: \["main"\]/)
  assert.match(workflow, /workflow_dispatch:/)
  assert.match(workflow, /permissions:\n  contents: read/)
  assert.match(workflow, /group: nextjs-build-\$\{\{ github\.ref \}\}\n  cancel-in-progress: true/)
  assert.match(workflow, /timeout-minutes: 25/)
  assert.match(workflow, /persist-credentials: false/)
  assert.doesNotMatch(workflow, /secrets\.|pull_request_target|continue-on-error|always\(\)/)
  assert.match(workflow, /version: 9\.15\.9/)
  assert.match(workflow, /node-version: "22"\n          cache: pnpm\n          cache-dependency-path: pnpm-lock\.yaml/)
  assert.ok(workflow.indexOf('Set up pnpm') < workflow.indexOf('Set up Node.js'))
  assert.ok(workflow.indexOf('run: pnpm install --frozen-lockfile') < workflow.indexOf('- name: Build\n'))
  assert.ok(workflow.indexOf('- name: Build\n') < workflow.indexOf('Package build output'))
  assert.ok(workflow.indexOf('Package build output') < workflow.indexOf('Upload build artifact'))
  assert.match(workflow, /name: nextjs-build-\$\{\{ github\.sha \}\}-\$\{\{ github\.run_id \}\}-\$\{\{ github\.run_attempt \}\}/)
  assert.match(workflow, /path: \$\{\{ runner\.temp \}\}\/nextjs-build\.tar\.gz/)
  assert.match(workflow, /retention-days: 7/)
  assert.match(workflow, /if-no-files-found: error/)
  assert.match(workflow, /include-hidden-files: false/)
})

test('build generates a fresh auth secret without persisting it or requiring repository secrets', () => {
  const buildStep = workflow.match(/      - name: Build\n        run: \|\n          (.*)\n/)
  assert.ok(buildStep)
  assert.match(buildStep[1], /^BETTER_AUTH_SECRET="\$\(node -e .*randomBytes\(32\).*toString\('hex'\).*\)" pnpm build$/)
  assert.doesNotMatch(workflow, /GITHUB_ENV|\.env.*>|echo.*BETTER_AUTH_SECRET/)
  const probe = buildStep[1].replace(/pnpm build$/, `node -e "process.stdout.write(process.env.BETTER_AUTH_SECRET)"`)
  const first = execFileSync('bash', ['-e', '-c', probe], { encoding: 'utf8' })
  const second = execFileSync('bash', ['-e', '-c', probe], { encoding: 'utf8' })
  assert.match(first, /^[a-f0-9]{64}$/)
  assert.match(second, /^[a-f0-9]{64}$/)
  assert.notEqual(first, second)
})

test('archive preserves hidden Next.js output but excludes cache, env, dependencies, and credential files', (t) => {
  const root = mkdtempSync(join(tmpdir(), 'nextjs-artifact-test-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  const runnerTemp = join(root, 'runner-temp')
  mkdirSync(runnerTemp)
  const included = ['.next/BUILD_ID', '.next/server/app/page.js', '.next/static/chunks/app.js', '.next/routes-manifest.json']
  const excluded = [
    '.next/cache/compiler/cache.bin', '.next/.env', '.next/server/.env.production',
    '.next/server/private.pem', '.next/server/private.key', '.next/server/private.p12',
    '.next/server/private.pfx', '.next/node_modules/package/index.js',
    '.env.local', 'node_modules/package/index.js', 'public/image.png', 'data/brands/test.json',
  ]
  for (const file of [...included, ...excluded]) {
    mkdirSync(dirname(join(root, file)), { recursive: true })
    writeFileSync(join(root, file), 'fixture')
  }
  execFileSync('bash', ['-e', '-o', 'pipefail', '-c', packageCommand], {
    cwd: root, env: { ...process.env, RUNNER_TEMP: runnerTemp },
  })
  const entries = execFileSync('tar', ['-tzf', join(runnerTemp, 'nextjs-build.tar.gz')], { encoding: 'utf8' })
    .trim().split('\n').filter(entry => !entry.endsWith('/')).sort()
  assert.deepEqual(entries, included.sort())
})

test('packaging fails without a completed Next.js build', (t) => {
  const root = mkdtempSync(join(tmpdir(), 'nextjs-artifact-test-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  mkdirSync(join(root, '.next'))
  writeFileSync(join(root, '.next/BUILD_ID'), '')
  assert.throws(() => execFileSync('bash', ['-e', '-o', 'pipefail', '-c', packageCommand], {
    cwd: root, env: { ...process.env, RUNNER_TEMP: root },
  }))
})
