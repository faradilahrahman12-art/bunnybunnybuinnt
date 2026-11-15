import { sql, type SQL } from 'drizzle-orm'
import { db } from '@/lib/db'

export const HTB_CONVERSION_BLOCKED_MESSAGE =
  'This event has seat map inventory and cannot be changed to Help to Buy. Remove its seat map and listings first.'

// Seat-map tables only exist where the seat-map migration has run (Preview first).
// Production without them has no inventory to protect, so the guard is a no-op there.
export async function seatMapTablesExist(): Promise<boolean> {
  const result = await db.execute<{ maps: string | null; listings: string | null }>(
    sql`select to_regclass('public.event_seat_maps')::text as maps,
               to_regclass('public.seat_listings')::text as listings`,
  )
  const row = result.rows[0]
  return Boolean(row?.maps && row?.listings)
}

// SQL condition for an UPDATE on `events`: true only when the event has no seat map
// and no listings. Used inside the same UPDATE statement so the check and the write are atomic.
export function noSeatMapInventory(eventIdColumn: SQL): SQL {
  return sql`not exists (select 1 from event_seat_maps where event_id = ${eventIdColumn})
         and not exists (select 1 from seat_listings where event_id = ${eventIdColumn})`
}
