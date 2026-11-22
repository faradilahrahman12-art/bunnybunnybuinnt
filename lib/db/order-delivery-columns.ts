import type { Pool } from 'pg'

let ensured = false

export async function ensureOrderDeliveryColumns(pool: Pool) {
  if (ensured) return
  await pool.query(`
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_method text;
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS priority_delivery_method text;
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS actual_delivery_method text;
  `)
  ensured = true
}
