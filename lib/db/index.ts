
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema'

const isEmailReleasePreview =
  process.env.VERCEL_ENV === 'preview' &&
  process.env.VERCEL_GIT_COMMIT_REF === 'production-email-release'

const connectionString = isEmailReleasePreview
  ? process.env.DATABASE_URL_EMAIL_RELEASE_TEST
  : process.env.DATABASE_URL_PRODUCTION ||
    process.env.DATABASE_URL

if (!connectionString) {
  throw new Error(
    isEmailReleasePreview
      ? 'DATABASE_URL_TEST is missing for the email release Preview'
      : 'Database connection is not configured'
  )
}

export const pool = new Pool({
  connectionString,
})

export const db = drizzle(pool, { schema })

if (isEmailReleasePreview) {
  pool.query(
    'SELECT current_database() AS database_name, current_user AS database_role, inet_server_addr()::text AS server_address'
  )
    .then((result) => {
      console.log('EMAIL PREVIEW DATABASE CHECK:', {
        database: result.rows[0]?.database_name,
        connected: true,
      })
    })
    .catch((error) => {
      console.error('EMAIL PREVIEW DATABASE CHECK FAILED:', error.code)
    })
}

