
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema'


const isEmailReleasePreview =
  process.env.VERCEL_ENV === 'preview' &&
  (
    process.env.VERCEL_GIT_COMMIT_REF === 'production-email-release' ||
    process.env.VERCEL_GIT_COMMIT_REF === 'email-verification-success'
  )


const connectionString = isEmailReleasePreview
  ? process.env.DATABASE_URL_EMAIL_RELEASE_TEST
  : process.env.DATABASE_URL_PRODUCTION ||
    process.env.DATABASE_URL

if (!connectionString) {
  throw new Error(
    isEmailReleasePreview
      'DATABASE_URL_EMAIL_RELEASE_TEST is missing for the email release Preview'
      : 'Database connection is not configured'
  )
}

export const pool = new Pool({
  connectionString,
})

export const db = drizzle(pool, { schema })




