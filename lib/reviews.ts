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

/**
 * Places a review at a 1-based position and renumbers every review 1..N so
 * positions are always unique and gap-free. Pass position <= 0 to append.
 */
export async function placeReviewAt(id: number, position: number) {
  const rows = await db
    .select({ id: reviews.id })
    .from(reviews)
    .orderBy(asc(reviews.sortOrder), asc(reviews.id))
  const ids = rows.map((r) => r.id).filter((rid) => rid !== id)
  const index = position > 0 ? Math.min(position - 1, ids.length) : ids.length
  ids.splice(index, 0, id)
  await pool.query(
    `UPDATE reviews AS r SET sort_order = v.pos
     FROM unnest($1::int[]) WITH ORDINALITY AS v(id, pos)
     WHERE r.id = v.id AND r.sort_order IS DISTINCT FROM v.pos`,
    [ids],
  )
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
