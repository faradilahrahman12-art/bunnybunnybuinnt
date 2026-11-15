// Runs a seat-map migration against the isolated `seat-map-preview` Neon branch ONLY.
//
//   node scripts/seat-map/run-migration.mjs 001_seat_map.sql                 -> dry run: verifies target identity (read-only), prints SHA-256, writes nothing
//   node scripts/seat-map/run-migration.mjs 001_seat_map.sql --confirm=<sha> -> executes, only if the file hash matches AND identity re-verifies
//
// The hash requirement means only the exact SQL text that was reviewed and approved can run.
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'

// Exact identity of each allowed target branch. Anything else is refused.
//   --target=preview (default): the isolated seat-map-preview branch
//   --target=production:        the Production branch (br-rapid-hill-ausoo4xu)
const TARGETS = {
  preview: {
    envVar: 'DATABASE_URL_SEAT_MAP_TEST',
    endpoint: 'ep-flat-paper-aunlgcr1',
    timeline: '9d01c0e9591375ebce9a0a4408542462',
    mustDifferFromProduction: true,
  },
  production: {
    envVar: 'DATABASE_URL_UNPOOLED',
    endpoint: 'ep-snowy-sky-auewdtsi',
    timeline: '7a743a09213d5ee24db28b0a00e8489e',
    mustDifferFromProduction: false,
  },
}
const REQUIRED_DATABASE = 'neondb'

function fail(message) {
  console.error(`ABORT: ${message}`)
  process.exit(1)
}

function endpointOf(connectionString) {
  return new URL(connectionString).hostname.split('.')[0].replace(/-pooler$/, '')
}

const [file, ...flags] = process.argv.slice(2)
if (!file || !/^[\w.-]+\.sql$/.test(file)) {
  console.error('Usage: run-migration.mjs <file.sql> [--target=preview|production] [--confirm=<sha256>]')
  process.exit(2)
}

const targetName = flags.find((f) => f.startsWith('--target='))?.slice('--target='.length) ?? 'preview'
const target = TARGETS[targetName]
if (!target) fail(`unknown target "${targetName}".`)
const REQUIRED_ENDPOINT = target.endpoint
const REQUIRED_TIMELINE = target.timeline

const sql = readFileSync(join(dirname(fileURLToPath(import.meta.url)), file), 'utf8')
const sha = createHash('sha256').update(sql).digest('hex')

const url = process.env[target.envVar]
if (!url) fail(`${target.envVar} is not set.`)

const endpoint = endpointOf(url)
if (endpoint !== REQUIRED_ENDPOINT) {
  fail(`connection string endpoint "${endpoint}" is not exactly ${REQUIRED_ENDPOINT}.`)
}
if (target.mustDifferFromProduction) {
  for (const name of ['DATABASE_URL_PRODUCTION', 'DATABASE_URL', 'POSTGRES_URL', 'DATABASE_URL_UNPOOLED', 'POSTGRES_URL_NON_POOLING']) {
    const other = process.env[name]
    if (other && endpointOf(other) === endpoint) fail(`target endpoint matches ${name}.`)
  }
}
console.log(`Target:   ${targetName}`)

const confirm = flags.find((f) => f.startsWith('--confirm='))?.slice('--confirm='.length)
if (confirm && confirm !== sha) {
  fail('--confirm hash does not match the file. The SQL changed after approval.')
}

console.log(`File:     ${file}`)
console.log(`SHA-256:  ${sha}`)
console.log(`Endpoint: ${endpoint} (connection string)`)

// Server-reported identity: proves which Neon compute/branch actually answered,
// independent of the hostname in the connection string.
async function verifyServerIdentity(client) {
  const { rows } = await client.query(
    `select current_database() as db,
            current_setting('neon.endpoint_id', true) as endpoint_id,
            current_setting('neon.timeline_id', true) as timeline_id`,
  )
  const id = rows[0]
  console.log(`Server:   database=${id.db} endpoint=${id.endpoint_id} timeline=${id.timeline_id}`)
  if (id.db !== REQUIRED_DATABASE) fail(`server database "${id.db}" is not ${REQUIRED_DATABASE}.`)
  if (id.endpoint_id !== REQUIRED_ENDPOINT) fail(`server endpoint "${id.endpoint_id}" is not ${REQUIRED_ENDPOINT}.`)
  if (id.timeline_id !== REQUIRED_TIMELINE) fail(`server timeline "${id.timeline_id}" is not the pinned ${targetName} branch.`)
}

const client = new pg.Client({ connectionString: url })
await client.connect()
try {
  if (!confirm) {
    await client.query('BEGIN READ ONLY')
    await verifyServerIdentity(client)
    await client.query('ROLLBACK')
    console.log('Identity verified. Dry run only. Nothing was executed.')
  } else {
    // Re-verify immediately before executing, on the same connection that runs the SQL.
    await verifyServerIdentity(client)
    await client.query(sql)
    console.log('Migration committed.')
  }
} catch (error) {
  await client.query('ROLLBACK').catch(() => {})
  console.error('Migration failed and was rolled back:', error.message)
  process.exitCode = 1
} finally {
  await client.end()
}
