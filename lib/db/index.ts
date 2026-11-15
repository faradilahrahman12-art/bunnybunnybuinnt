import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema'

const vercelEnv = process.env.VERCEL_ENV
const gitRef = process.env.VERCEL_GIT_COMMIT_REF
const isProduction = vercelEnv === 'production'
const isPreview = vercelEnv === 'preview'
// Anything that is not a Vercel Production or Preview deployment (local dev, v0 workspace,
// scripts, unknown hosts) is treated as development and must use the designated dev database.
const isDevelopment = !isProduction && !isPreview

const isOrderStatusPreview =
  isPreview && gitRef === 'feature-order-status-emails'

const isEmailReleasePreview =
  isPreview &&
  (gitRef === 'production-email-release' ||
    gitRef === 'email-verification-success')

const isEmailVerificationPreview =
  isPreview && gitRef === 'v0/require-email-verification'

const isSeatMapPreview =
  isPreview && gitRef === 'feature/interactive-seat-map'

type Resolved = { url: string | undefined; missing: string }

function resolveConnection(): Resolved {
  if (isProduction) {
    return {
      url: process.env.DATABASE_URL_PRODUCTION || process.env.DATABASE_URL,
      missing: 'Database connection is not configured',
    }
  }
  if (isOrderStatusPreview) {
    return {
      url: process.env.DATABASE_URL_ORDER_STATUS_TEST,
      missing: 'DATABASE_URL_ORDER_STATUS_TEST is missing for the order status Preview',
    }
  }
  if (isEmailVerificationPreview) {
    return { url: process.env.DATABASE_URL, missing: 'DATABASE_URL is missing' }
  }
  if (isEmailReleasePreview) {
    return {
      url: process.env.DATABASE_URL_EMAIL_RELEASE_TEST,
      missing: 'DATABASE_URL_EMAIL_RELEASE_TEST is missing for the email release Preview',
    }
  }
  if (isSeatMapPreview) {
    return {
      url: process.env.DATABASE_URL_SEAT_MAP_TEST,
      missing: 'DATABASE_URL_SEAT_MAP_TEST is missing for the seat map Preview',
    }
  }
  if (isPreview) {
    return {
      url: undefined,
      missing: `No isolated database is configured for Preview branch "${gitRef ?? 'unknown'}"`,
    }
  }
  // Development: only the designated dev database, on every Git branch. No fallbacks.
  return {
    url: process.env.DATABASE_URL_DEVELOPMENT,
    missing:
      'DATABASE_URL_DEVELOPMENT is not set. Local development refuses to start without an isolated development database.',
  }
}

// Neon pooled and direct hosts share an endpoint id: "ep-x-pooler.region..." and "ep-x.region...".
function endpointId(url: string | undefined): string | null {
  if (!url) return null
  try {
    return new URL(url).hostname.split('.')[0].replace(/-pooler$/, '')
  } catch {
    return null
  }
}

function assertNotProductionDatabase(url: string) {
  const devEndpoint = endpointId(url)
  const productionEndpoints = [
    process.env.DATABASE_URL_PRODUCTION,
    process.env.DATABASE_URL,
    process.env.DATABASE_URL_UNPOOLED,
    process.env.POSTGRES_URL,
  ]
    .map(endpointId)
    .filter((id): id is string => Boolean(id))

  if (!devEndpoint || productionEndpoints.includes(devEndpoint)) {
    throw new Error(
      'DATABASE_URL_DEVELOPMENT points to the Production database endpoint. Refusing to connect.',
    )
  }
}

const { url: connectionString, missing } = resolveConnection()

if (!connectionString) {
  throw new Error(missing)
}

if (isDevelopment) {
  assertNotProductionDatabase(connectionString)
}

export const pool = new Pool({
  connectionString,
})

export const db = drizzle(pool, { schema })
