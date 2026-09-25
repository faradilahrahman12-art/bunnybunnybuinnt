import 'server-only'
import { asc } from 'drizzle-orm'
import { db, pool } from '@/lib/db'
import { qrphMerchants, type QrphMerchant } from '@/lib/db/schema'

let ensured = false
export async function ensureQrphTable() {
  if (ensured) return
  await pool.query(`
    CREATE TABLE IF NOT EXISTS qrph_merchants (
      id serial PRIMARY KEY,
      name text NOT NULL,
      qr_image_url text,
      active boolean NOT NULL DEFAULT true,
      sort_order integer NOT NULL DEFAULT 0,
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `)
  ensured = true
}

export async function getQrphMerchants(opts?: { includeInactive?: boolean }): Promise<QrphMerchant[]> {
  try {
    await ensureQrphTable()
    const rows = await db
      .select()
      .from(qrphMerchants)
      .orderBy(asc(qrphMerchants.sortOrder), asc(qrphMerchants.id))
    return opts?.includeInactive ? rows : rows.filter((r) => r.active)
  } catch {
    // Table not ready yet — render an empty list rather than crashing the page.
    return []
  }
}
