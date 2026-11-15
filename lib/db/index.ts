
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema'

const vercelEnv = process.env.VERCEL_ENV
const gitRef = process.env.VERCEL_GIT_COMMIT_REF
const isPreview = vercelEnv === 'preview'
const isDevelopment = vercelEnv !== 'preview' && vercelEnv !== 'production'

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

function resolveConnection(): { url: string | undefined; missing: string } {
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
  // Unrecognised Preview branches must never fall back to the Production database.
  if (isPreview) {
    return {
      url: undefined,
      missing: `No isolated database is configured for Preview branch "${gitRef ?? 'unknown'}"`,
    }
  }
  if (isDevelopment && process.env.DATABASE_URL_SEAT_MAP_TEST) {
    return { url: process.env.DATABASE_URL_SEAT_MAP_TEST, missing: '' }
  }
  return {
    url: process.env.DATABASE_URL_PRODUCTION || process.env.DATABASE_URL,
    missing: 'Database connection is not configured',
  }
}

const { url: connectionString, missing } = resolveConnection()

if (!connectionString) {
  throw new Error(missing)
}

export const pool = new Pool({
  connectionString,
})

export const db = drizzle(pool, { schema })
