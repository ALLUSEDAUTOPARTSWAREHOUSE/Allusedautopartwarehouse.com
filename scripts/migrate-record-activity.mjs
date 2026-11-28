import { readFile } from 'node:fs/promises'
import pg from 'pg'

let client
let connected = false
let committing = false
try {
  if (!process.env.DATABASE_URL) throw Object.assign(new Error(), { code: 'DATABASE_URL_REQUIRED' })
  client = new pg.Client({ connectionString: process.env.DATABASE_URL })
  await client.connect()
  connected = true
  await client.query('BEGIN')
  await client.query(await readFile(new URL('./record-activity.sql', import.meta.url), 'utf8'))
  committing = true
  await client.query('COMMIT')
  console.log('Record activity and assignment indexes are ready.')
} catch (error) {
  if (connected) await client.query('ROLLBACK').catch(() => undefined)
  const code = typeof error?.code === 'string' && /^[A-Z0-9_]{2,64}$/.test(error.code) ? error.code : 'MIGRATION_FAILED'
  console.error(`Record activity migration not confirmed (${code}). ${committing ? 'The commit result may be uncertain; inspect the target schema before retrying.' : 'Check the reviewed target database and schema configuration before retrying.'}`)
  process.exitCode = 1
} finally {
  await client?.end().catch(() => undefined)
}
