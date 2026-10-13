
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema'

const connectionString =
  process.env.VERCEL_ENV === 'preview' &&
  process.env.VERCEL_GIT_COMMIT_REF === 'feature/email-preview-v2'
    ? process.env.DATABASE_URL_TEST
    : process.env.DATABASE_URL_PRODUCTION ||
      process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('Database connection is not configured')
}

export const pool = new Pool({
  connectionString,
})

export const db = drizzle(pool, { schema })
