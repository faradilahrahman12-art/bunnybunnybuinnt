
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
    'SELECT marker FROM public.email_preview_identity_check WHERE marker = $1',
    ['BUNNY_EMAIL_PREVIEW_TEST_2026']
  )
    .then((result) => {
      console.log(
        'EMAIL PREVIEW IDENTITY CHECK:',
        result.rows.length === 1
          ? 'MARKER FOUND'
          : 'MARKER NOT FOUND'
      )
    })
    .catch((error) => {
      console.error(
        'EMAIL PREVIEW IDENTITY CHECK FAILED:',
        error.code
      )
    })
}


