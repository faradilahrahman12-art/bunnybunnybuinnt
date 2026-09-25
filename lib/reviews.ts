import 'server-only'
import { asc } from 'drizzle-orm'
import { db, pool } from '@/lib/db'
import { reviews, type Review } from '@/lib/db/schema'

let ensured = false
export async function ensureReviewsTable() {
  if (ensured) return
  await pool.query(`
    CREATE TABLE IF NOT EXISTS reviews (
      id serial PRIMARY KEY,
      name text NOT NULL,
      event text,
      text text NOT NULL,
      images jsonb NOT NULL DEFAULT '[]'::jsonb,
      hidden boolean NOT NULL DEFAULT false,
      sort_order integer NOT NULL DEFAULT 0,
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `)
  ensured = true
}

function normalizeRow(row: typeof reviews.$inferSelect): Review {
  const images = Array.isArray(row.images) ? (row.images as unknown[]).filter((i): i is string => typeof i === 'string') : []
  return { ...row, images }
}

export async function getReviews(opts?: { includeHidden?: boolean }): Promise<Review[]> {
  try {
    await ensureReviewsTable()
    const rows = await db.select().from(reviews).orderBy(asc(reviews.sortOrder), asc(reviews.id))
    const normalized = rows.map(normalizeRow)
    return opts?.includeHidden ? normalized : normalized.filter((r) => !r.hidden)
  } catch {
    // Table not ready yet — render an empty list rather than crashing the page.
    return []
  }
}
