// Runs a seat-map migration against the isolated `seat-map-preview` Neon branch ONLY.
//
//   node scripts/seat-map/run-migration.mjs 001_seat_map.sql                 -> dry run: prints target + SHA-256, writes nothing
//   node scripts/seat-map/run-migration.mjs 001_seat_map.sql --confirm=<sha> -> executes, only if the file hash matches
//
// The hash requirement means only the exact SQL text that was reviewed and approved can run.
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'

const ALLOWED_ENDPOINT_PREFIX = 'ep-flat-paper-'

const [file, ...flags] = process.argv.slice(2)
if (!file || !/^[\w.-]+\.sql$/.test(file)) {
  console.error('Usage: run-migration.mjs <file.sql> [--confirm=<sha256>]')
  process.exit(2)
}

const sql = readFileSync(join(dirname(fileURLToPath(import.meta.url)), file), 'utf8')
const sha = createHash('sha256').update(sql).digest('hex')

const url = process.env.DATABASE_URL_SEAT_MAP_TEST
if (!url) {
  console.error('ABORT: DATABASE_URL_SEAT_MAP_TEST is not set.')
  process.exit(1)
}
const host = new URL(url).hostname
const endpoint = host.split('.')[0].replace(/-pooler$/, '')
if (!endpoint.startsWith(ALLOWED_ENDPOINT_PREFIX)) {
  console.error(`ABORT: target endpoint "${endpoint}" is not the seat-map-preview branch.`)
  process.exit(1)
}
for (const name of ['DATABASE_URL_PRODUCTION', 'DATABASE_URL', 'POSTGRES_URL']) {
  const other = process.env[name]
  if (other && new URL(other).hostname.split('.')[0].replace(/-pooler$/, '') === endpoint) {
    console.error(`ABORT: target endpoint matches ${name}.`)
    process.exit(1)
  }
}

console.log(`File:     ${file}`)
console.log(`SHA-256:  ${sha}`)
console.log(`Endpoint: ${endpoint}`)

const confirm = flags.find((f) => f.startsWith('--confirm='))?.slice('--confirm='.length)
if (!confirm) {
  console.log('Dry run only. Nothing was executed.')
  process.exit(0)
}
if (confirm !== sha) {
  console.error('ABORT: --confirm hash does not match the file. The SQL changed after approval.')
  process.exit(1)
}

const client = new pg.Client({ connectionString: url })
await client.connect()
try {
  const { rows } = await client.query('select current_database() db, inet_server_addr() addr')
  console.log(`Connected: database=${rows[0].db}`)
  await client.query(sql)
  console.log('Migration committed.')
} catch (error) {
  await client.query('ROLLBACK').catch(() => {})
  console.error('Migration failed and was rolled back:', error.message)
  process.exitCode = 1
} finally {
  await client.end()
}
