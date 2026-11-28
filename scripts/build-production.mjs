import { spawnSync } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')

/** eve/next starts .output/server/index.mjs on non-Vercel hosts. Vercel
 * builds the Eve service separately through withEve's generated service graph. */
export function runProductionBuild({ environment = process.env, execute = spawnSync, nextArguments = process.argv.slice(2) } = {}) {
  const steps = [
    ...(!environment.VERCEL ? [{ label: 'Eve runtime', binary: 'eve/bin/eve.js', args: ['build'] }] : []),
    { label: 'Next.js application', binary: 'next/dist/bin/next', args: ['build', ...nextArguments] },
  ]
  for (const step of steps) {
    console.log(`[build] Building ${step.label}`)
    const result = execute(process.execPath, [resolve(projectRoot, 'node_modules', step.binary), ...step.args], {
      cwd: projectRoot,
      env: { ...environment, NODE_ENV: 'production' },
      stdio: 'inherit',
    })
    if (result.error) {
      console.error(`[build] Could not start the ${step.label} build.`)
      return 1
    }
    if (result.status !== 0) return result.status || 1
  }
  return 0
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) process.exitCode = runProductionBuild()
