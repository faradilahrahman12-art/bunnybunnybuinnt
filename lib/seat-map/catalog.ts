import type { Pool } from 'pg'
import { SeatMapError, sweepExpiredHolds, withTransaction } from './inventory'

// Venue maps, event assignments and listings. Plain `pg`, relative imports only (shared with tests).

export const SECTION_CODE_PATTERN = /^[A-Za-z0-9 _-]{1,20}$/
export const SECTION_PATH_PATTERN = /^[MmLlHhVvCcSsQqTtAaZz0-9 ,.eE+-]+$/
export const BLOB_URL_PATTERN = /^https:\/\/[a-z0-9]+\.public\.blob\.vercel-storage\.com\/seat-maps\//

export type SectionKind = 'seat' | 'floor' | 'stage'

export type MapSectionRecord = {
  code: string
  kind: SectionKind
  path: string
  labelX: number
  labelY: number
  labelSize: number
}

export type VenueMapRecord = {
  id: number
  name: string
  venueName: string
  width: number
  height: number
  backgroundImageUrl: string | null
  backgroundImagePathname: string | null
  sections: MapSectionRecord[]
  eventCount: number
  updatedAt: string
}

export type ListingRecord = {
  id: number
  eventId: number
  eventDateId: number | null
  sectionCode: string
  rowLabel: string | null
  seats: string | null
  quantityTotal: number
  quantityHeld: number
  quantitySold: number
  available: number
  maxPerOrder: number
  price: number
  originalPrice: number | null
  currency: string
  seatedTogether: boolean
  viewNote: string | null
  featured: boolean
  status: 'available' | 'hidden'
}

function cleanText(value: unknown, max: number): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

function optionalText(value: unknown, max: number): string | null {
  const text = cleanText(value, max)
  return text.length > 0 ? text : null
}

function intInRange(value: unknown, min: number, max: number, label: string): number {
  const n = Number(value)
  if (!Number.isInteger(n) || n < min || n > max) throw new SeatMapError(`${label} must be a whole number from ${min} to ${max}.`, 'invalid')
  return n
}

function finite(value: unknown, label: string): number {
  const n = Number(value)
  if (!Number.isFinite(n)) throw new SeatMapError(`${label} is not a valid number.`, 'invalid')
  return Math.round(n * 100) / 100
}

function translateDbError(error: unknown): never {
  const e = error as { code?: string; constraint?: string; message?: string }
  if (e instanceof SeatMapError) throw e
  if (e.code === '23505' && e.constraint?.includes('venue_map_sections')) {
    throw new SeatMapError('Each section on a map needs a unique code.', 'duplicate_code')
  }
  if (e.code === '23503') throw new SeatMapError('This item is still in use and cannot be removed.', 'in_use')
  if (e.code === '23514') {
    if (e.constraint === 'seat_listings_no_oversell') {
      throw new SeatMapError('Total quantity cannot be lower than tickets already held or sold.', 'oversell')
    }
    if (e.message?.includes('only available for resale')) {
      throw new SeatMapError('Seat maps and listings can only be used for Resale events.', 'resale_only')
    }
    if (e.message?.includes('does not belong to event')) {
      throw new SeatMapError('That date does not belong to this event.', 'date_mismatch')
    }
    throw new SeatMapError('One of the values is out of the allowed range.', 'check')
  }
  throw error
}

// ---------------------------------------------------------------------------
// Venue maps
// ---------------------------------------------------------------------------
type MapRow = {
  id: number
  name: string
  venue_name: string
  view_width: number
  view_height: number
  background_image_url: string | null
  background_image_pathname: string | null
  updated_at: Date
  event_count: number
}

type SectionRow = {
  map_id: number
  code: string
  kind: SectionKind
  path: string
  label_x: string
  label_y: string
  label_size: string
}

function toSection(row: SectionRow): MapSectionRecord {
  return {
    code: row.code,
    kind: row.kind,
    path: row.path,
    labelX: Number(row.label_x),
    labelY: Number(row.label_y),
    labelSize: Number(row.label_size),
  }
}

export async function listVenueMaps(pool: Pool): Promise<VenueMapRecord[]> {
  const maps = await pool.query<MapRow>(
    `SELECT m.*, (SELECT count(*)::int FROM event_seat_maps e WHERE e.map_id = m.id) AS event_count
     FROM venue_maps m ORDER BY m.updated_at DESC, m.id DESC`,
  )
  const sections = await pool.query<SectionRow>(
    `SELECT map_id, code, kind, path, label_x, label_y, label_size FROM venue_map_sections ORDER BY map_id, sort_order, id`,
  )
  const byMap = new Map<number, MapSectionRecord[]>()
  for (const row of sections.rows) {
    const list = byMap.get(row.map_id) ?? []
    list.push(toSection(row))
    byMap.set(row.map_id, list)
  }
  return maps.rows.map((m) => ({
    id: m.id,
    name: m.name,
    venueName: m.venue_name,
    width: m.view_width,
    height: m.view_height,
    backgroundImageUrl: m.background_image_url,
    backgroundImagePathname: m.background_image_pathname,
    sections: byMap.get(m.id) ?? [],
    eventCount: m.event_count,
    updatedAt: new Date(m.updated_at).toISOString(),
  }))
}

export type SaveVenueMapInput = {
  id?: number | null
  name: string
  venueName: string
  width: number
  height: number
  backgroundImageUrl: string | null
  backgroundImagePathname: string | null
  sections: MapSectionRecord[]
}

export function validateVenueMap(input: SaveVenueMapInput) {
  const name = cleanText(input.name, 120)
  const venueName = cleanText(input.venueName, 160)
  if (!name) throw new SeatMapError('Give the layout a name.', 'invalid')
  if (!venueName) throw new SeatMapError('Enter the venue name.', 'invalid')
  const width = intInRange(input.width, 100, 10000, 'Map width')
  const height = intInRange(input.height, 100, 10000, 'Map height')
  const backgroundImageUrl = optionalText(input.backgroundImageUrl, 2000)
  if (backgroundImageUrl && !BLOB_URL_PATTERN.test(backgroundImageUrl)) {
    throw new SeatMapError('The map image must be uploaded through the seat map manager.', 'invalid_image')
  }
  if (!Array.isArray(input.sections) || input.sections.length > 500) {
    throw new SeatMapError('A map can have up to 500 sections.', 'invalid')
  }
  const seen = new Set<string>()
  const sections = input.sections.map((s, index) => {
    const code = cleanText(s.code, 20)
    if (!SECTION_CODE_PATTERN.test(code)) {
      throw new SeatMapError(`Section ${index + 1}: use 1-20 letters, numbers, spaces, - or _.`, 'invalid_code')
    }
    const key = code.toLowerCase()
    if (seen.has(key)) throw new SeatMapError(`Section code "${code}" is used twice.`, 'duplicate_code')
    seen.add(key)
    const kind: SectionKind = s.kind === 'floor' || s.kind === 'stage' ? s.kind : 'seat'
    const path = typeof s.path === 'string' ? s.path.trim() : ''
    if (!path || path.length > 20000 || !SECTION_PATH_PATTERN.test(path)) {
      throw new SeatMapError(`Section "${code}" has an invalid shape.`, 'invalid_path')
    }
    const labelSize = finite(s.labelSize ?? 16, 'Label size')
    if (labelSize < 4 || labelSize > 200) throw new SeatMapError('Label size must be between 4 and 200.', 'invalid')
    return {
      code,
      kind,
      path,
      labelX: finite(s.labelX, 'Label X'),
      labelY: finite(s.labelY, 'Label Y'),
      labelSize,
    }
  })
  return {
    name,
    venueName,
    width,
    height,
    backgroundImageUrl,
    backgroundImagePathname: backgroundImageUrl ? optionalText(input.backgroundImagePathname, 500) : null,
    sections,
  }
}

export async function saveVenueMap(pool: Pool, input: SaveVenueMapInput): Promise<number> {
  const map = validateVenueMap(input)
  try {
    return await withTransaction(pool, async (client) => {
      let id = input.id ?? null
      if (id) {
        const updated = await client.query(
          `UPDATE venue_maps SET name = $2, venue_name = $3, view_width = $4, view_height = $5,
                  background_image_url = $6, background_image_pathname = $7, updated_at = now()
           WHERE id = $1`,
          [id, map.name, map.venueName, map.width, map.height, map.backgroundImageUrl, map.backgroundImagePathname],
        )
        if (updated.rowCount === 0) throw new SeatMapError('Layout not found.', 'not_found')
        const removed = new Set(
          (
            await client.query<{ code: string }>(`SELECT code FROM venue_map_sections WHERE map_id = $1`, [id])
          ).rows.map((r) => r.code),
        )
        for (const s of map.sections) removed.delete(s.code)
        if (removed.size > 0) {
          // Don't orphan live inventory: a section with listings on an event using this map must stay.
          const inUse = await client.query<{ section_code: string }>(
            `SELECT DISTINCT l.section_code FROM seat_listings l
             JOIN event_seat_maps e ON e.event_id = l.event_id
             WHERE e.map_id = $1 AND l.section_code = ANY($2::text[])
               AND (l.status = 'available' OR l.quantity_held > 0)`,
            [id, [...removed]],
          )
          if (inUse.rows.length > 0) {
            throw new SeatMapError(
              `Section ${inUse.rows.map((r) => r.section_code).join(', ')} still has listings. Hide or move those listings first.`,
              'in_use',
            )
          }
        }
        await client.query(`DELETE FROM venue_map_sections WHERE map_id = $1`, [id])
      } else {
        const created = await client.query<{ id: number }>(
          `INSERT INTO venue_maps (name, venue_name, view_width, view_height, background_image_url, background_image_pathname)
           VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
          [map.name, map.venueName, map.width, map.height, map.backgroundImageUrl, map.backgroundImagePathname],
        )
        id = created.rows[0].id
      }
      for (const [index, s] of map.sections.entries()) {
        await client.query(
          `INSERT INTO venue_map_sections (map_id, code, kind, path, label_x, label_y, label_size, sort_order)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [id, s.code, s.kind, s.path, s.labelX, s.labelY, s.labelSize, index],
        )
      }
      return id
    })
  } catch (error) {
    translateDbError(error)
  }
}

export async function duplicateVenueMap(pool: Pool, id: number): Promise<number> {
  const maps = await listVenueMaps(pool)
  const source = maps.find((m) => m.id === id)
  if (!source) throw new SeatMapError('Layout not found.', 'not_found')
  return saveVenueMap(pool, {
    name: `${source.name} (copy)`.slice(0, 120),
    venueName: source.venueName,
    width: source.width,
    height: source.height,
    backgroundImageUrl: source.backgroundImageUrl,
    backgroundImagePathname: source.backgroundImagePathname,
    sections: source.sections,
  })
}

/** Deletes a layout that no event uses. Returns the blob pathname so the caller can delete the image. */
export async function deleteVenueMap(pool: Pool, id: number): Promise<string | null> {
  try {
    const result = await pool.query<{ background_image_url: string | null }>(
      `DELETE FROM venue_maps WHERE id = $1 AND NOT EXISTS (SELECT 1 FROM event_seat_maps WHERE map_id = $1)
       RETURNING background_image_url`,
      [id],
    )
    if (result.rowCount === 0) throw new SeatMapError('This layout is assigned to an event. Unassign it first.', 'in_use')
    return result.rows[0].background_image_url
  } catch (error) {
    translateDbError(error)
  }
}

// ---------------------------------------------------------------------------
// Event assignment (Resale only; the DB trigger enforces this too)
// ---------------------------------------------------------------------------
export type SeatMapEventRecord = {
  id: number
  title: string
  country: string
  hidden: boolean
  comingSoon: boolean
  dates: { id: number; label: string }[]
  mapId: number | null
  enabled: boolean
}

export async function listResaleEvents(pool: Pool): Promise<SeatMapEventRecord[]> {
  const events = await pool.query<{
    id: number
    title: string
    country: string
    hidden: boolean
    coming_soon: boolean
    map_id: number | null
    enabled: boolean | null
  }>(
    `SELECT e.id, e.title, e.country, e.hidden, e.coming_soon, m.map_id, m.enabled
     FROM events e LEFT JOIN event_seat_maps m ON m.event_id = e.id
     WHERE e.type = 'resale' ORDER BY e.sort_order, e.id`,
  )
  const dates = await pool.query<{ id: number; event_id: number; label: string }>(
    `SELECT d.id, d.event_id, d.label FROM event_dates d JOIN events e ON e.id = d.event_id
     WHERE e.type = 'resale' ORDER BY d.sort_order, d.id`,
  )
  return events.rows.map((e) => ({
    id: e.id,
    title: e.title,
    country: e.country,
    hidden: e.hidden,
    comingSoon: e.coming_soon,
    dates: dates.rows.filter((d) => d.event_id === e.id).map((d) => ({ id: d.id, label: d.label })),
    mapId: e.map_id,
    enabled: Boolean(e.enabled),
  }))
}

export async function assignEventMap(pool: Pool, input: { eventId: number; mapId: number | null; enabled: boolean }) {
  try {
    if (input.mapId === null) {
      await pool.query(`DELETE FROM event_seat_maps WHERE event_id = $1`, [input.eventId])
      return
    }
    await pool.query(
      `INSERT INTO event_seat_maps (event_id, map_id, enabled) VALUES ($1, $2, $3)
       ON CONFLICT (event_id) DO UPDATE SET map_id = excluded.map_id, enabled = excluded.enabled, updated_at = now()`,
      [input.eventId, input.mapId, input.enabled],
    )
  } catch (error) {
    translateDbError(error)
  }
}

// ---------------------------------------------------------------------------
// Listings
// ---------------------------------------------------------------------------
type ListingRow = {
  id: number
  event_id: number
  event_date_id: number | null
  section_code: string
  row_label: string | null
  seats: string | null
  quantity_total: number
  quantity_held: number
  quantity_sold: number
  max_per_order: number
  price: string
  original_price: string | null
  currency: string
  seated_together: boolean
  view_note: string | null
  featured: boolean
  status: 'available' | 'hidden'
}

function toListing(row: ListingRow): ListingRecord {
  return {
    id: row.id,
    eventId: row.event_id,
    eventDateId: row.event_date_id,
    sectionCode: row.section_code,
    rowLabel: row.row_label,
    seats: row.seats,
    quantityTotal: row.quantity_total,
    quantityHeld: row.quantity_held,
    quantitySold: row.quantity_sold,
    available: Math.max(0, row.quantity_total - row.quantity_held - row.quantity_sold),
    maxPerOrder: row.max_per_order,
    price: Number(row.price),
    originalPrice: row.original_price === null ? null : Number(row.original_price),
    currency: row.currency,
    seatedTogether: row.seated_together,
    viewNote: row.view_note,
    featured: row.featured,
    status: row.status,
  }
}

export async function listListings(pool: Pool, eventId: number): Promise<ListingRecord[]> {
  await sweepExpiredHolds(pool, { eventId })
  const result = await pool.query<ListingRow>(
    `SELECT * FROM seat_listings WHERE event_id = $1 ORDER BY section_code, row_label NULLS FIRST, id`,
    [eventId],
  )
  return result.rows.map(toListing)
}

export type SaveListingInput = {
  id?: number | null
  eventId: number
  eventDateId: number | null
  sectionCode: string
  rowLabel: string | null
  seats: string | null
  quantityTotal: number
  maxPerOrder: number
  price: number
  originalPrice: number | null
  seatedTogether: boolean
  viewNote: string | null
  featured: boolean
  status: 'available' | 'hidden'
}

export async function saveListing(pool: Pool, input: SaveListingInput, actor: string): Promise<number> {
  const eventId = intInRange(input.eventId, 1, 2_147_483_647, 'Event')
  const sectionCode = cleanText(input.sectionCode, 20)
  if (!SECTION_CODE_PATTERN.test(sectionCode)) throw new SeatMapError('Choose a valid section.', 'invalid_code')
  const quantityTotal = intInRange(input.quantityTotal, 0, 100000, 'Quantity')
  const maxPerOrder = intInRange(input.maxPerOrder, 1, 10, 'Max per order')
  const price = finite(input.price, 'Price')
  if (price <= 0 || price > 99_999_999) throw new SeatMapError('Price must be greater than zero.', 'invalid')
  const originalPrice = input.originalPrice === null || input.originalPrice === undefined || String(input.originalPrice) === ''
    ? null
    : finite(input.originalPrice, 'Original price')
  if (originalPrice !== null && originalPrice <= price) {
    throw new SeatMapError('Original price must be higher than the selling price (or left empty).', 'invalid')
  }
  const eventDateId = input.eventDateId ? intInRange(input.eventDateId, 1, 2_147_483_647, 'Date') : null
  const status = input.status === 'hidden' ? 'hidden' : 'available'
  const values = [
    eventId,
    eventDateId,
    sectionCode,
    optionalText(input.rowLabel, 20),
    optionalText(input.seats, 60),
    quantityTotal,
    maxPerOrder,
    price,
    originalPrice,
    Boolean(input.seatedTogether),
    optionalText(input.viewNote, 120),
    Boolean(input.featured),
    status,
  ]

  try {
    return await withTransaction(pool, async (client) => {
      const mapCheck = await client.query<{ has_section: boolean | null }>(
        `SELECT EXISTS (
           SELECT 1 FROM event_seat_maps m JOIN venue_map_sections s ON s.map_id = m.map_id
           WHERE m.event_id = $1 AND s.code = $2) AS has_section,
         EXISTS (SELECT 1 FROM event_seat_maps WHERE event_id = $1) AS has_map`,
        [eventId, sectionCode],
      )
      const check = mapCheck.rows[0] as { has_section: boolean; has_map?: boolean }
      if (check.has_map && !check.has_section) {
        throw new SeatMapError(`Section "${sectionCode}" is not on this event's map.`, 'unknown_section')
      }

      if (input.id) {
        const before = await client.query<{ quantity_total: number; price: string; status: string; event_id: number }>(
          `SELECT quantity_total, price, status, event_id FROM seat_listings WHERE id = $1 FOR UPDATE`,
          [input.id],
        )
        const prev = before.rows[0]
        if (!prev) throw new SeatMapError('Listing not found.', 'not_found')
        if (prev.event_id !== eventId) throw new SeatMapError('Listings cannot be moved to another event.', 'invalid')
        await client.query(
          `UPDATE seat_listings SET event_date_id = $3, section_code = $4, row_label = $5, seats = $6,
                  quantity_total = $7, max_per_order = $8, price = $9, original_price = $10, seated_together = $11,
                  view_note = $12, featured = $13, status = $14, updated_at = now()
           WHERE id = $1 AND event_id = $2`,
          [input.id, ...values],
        )
        const changes: string[] = []
        if (prev.quantity_total !== quantityTotal) changes.push(`total ${prev.quantity_total}->${quantityTotal}`)
        if (Number(prev.price) !== price) changes.push(`price ${Number(prev.price)}->${price}`)
        if (prev.status !== status) changes.push(`status ${prev.status}->${status}`)
        if (changes.length > 0) {
          await client.query(
            `INSERT INTO seat_inventory_log (listing_id, action, actor, note) VALUES ($1, 'admin_adjust', $2, $3)`,
            [input.id, actor, changes.join(', ')],
          )
        }
        return input.id
      }

      const created = await client.query<{ id: number }>(
        `INSERT INTO seat_listings (event_id, event_date_id, section_code, row_label, seats, quantity_total, max_per_order,
           price, original_price, seated_together, view_note, featured, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING id`,
        values,
      )
      const id = created.rows[0].id
      await client.query(
        `INSERT INTO seat_inventory_log (listing_id, action, actor, note) VALUES ($1, 'admin_adjust', $2, $3)`,
        [id, actor, `created total ${quantityTotal} @ ${price}`],
      )
      return id
    })
  } catch (error) {
    translateDbError(error)
  }
}

// ---------------------------------------------------------------------------
// Public customer view
// ---------------------------------------------------------------------------
export type PublicSeatMap = {
  eventId: number
  map: { id: number; name: string; venueName: string; width: number; height: number; backgroundImageUrl: string | null }
  sections: MapSectionRecord[]
  listings: (Omit<ListingRecord, 'quantityTotal' | 'quantityHeld' | 'quantitySold' | 'status'> & {
    dateLabel: string | null
  })[]
  soldOutCodes: string[]
}

/** The enabled seat map for a visible Resale event, or null (caller falls back to the existing checkout). */
export async function getPublicSeatMap(pool: Pool, eventId: number): Promise<PublicSeatMap | null> {
  if (!Number.isInteger(eventId) || eventId < 1) return null
  const mapResult = await pool.query<MapRow>(
    `SELECT vm.*, 0 AS event_count FROM event_seat_maps esm
     JOIN venue_maps vm ON vm.id = esm.map_id
     JOIN events e ON e.id = esm.event_id
     WHERE esm.event_id = $1 AND esm.enabled AND e.type = 'resale' AND e.hidden = false`,
    [eventId],
  )
  const map = mapResult.rows[0]
  if (!map) return null

  await sweepExpiredHolds(pool, { eventId })
  const [sections, listings] = await Promise.all([
    pool.query<SectionRow>(
      `SELECT map_id, code, kind, path, label_x, label_y, label_size FROM venue_map_sections WHERE map_id = $1 ORDER BY sort_order, id`,
      [map.id],
    ),
    pool.query<ListingRow & { date_label: string | null }>(
      `SELECT l.*, d.label AS date_label FROM seat_listings l LEFT JOIN event_dates d ON d.id = l.event_date_id
       WHERE l.event_id = $1 AND l.status = 'available' ORDER BY l.price, l.id`,
      [eventId],
    ),
  ])

  const mapCodes = new Set(sections.rows.map((s) => s.code))
  const all = listings.rows.filter((row) => mapCodes.has(row.section_code)).map((row) => ({ ...toListing(row), dateLabel: row.date_label }))
  const availableCodes = new Set(all.filter((l) => l.available > 0).map((l) => l.sectionCode))
  const soldOutCodes = [...new Set(all.filter((l) => !availableCodes.has(l.sectionCode)).map((l) => l.sectionCode))]

  return {
    eventId,
    map: {
      id: map.id,
      name: map.name,
      venueName: map.venue_name,
      width: map.view_width,
      height: map.view_height,
      backgroundImageUrl: map.background_image_url,
    },
    sections: sections.rows.map(toSection),
    // Only what customers need: no held/sold counters or hidden listings leave the server.
    listings: all
      .filter((l) => l.available > 0)
      .map(({ quantityTotal: _t, quantityHeld: _h, quantitySold: _s, status: _st, ...rest }) => rest),
    soldOutCodes,
  }
}

// ---------------------------------------------------------------------------
// Admin: reservations and audit log
// ---------------------------------------------------------------------------
export type AdminHoldRecord = {
  id: number
  state: string
  quantity: number
  unitPrice: number
  total: number
  expiresAt: string
  createdAt: string
  reviewExpiredAt: string | null
  eventId: number
  eventTitle: string
  sectionCode: string
  rowLabel: string | null
  orderReference: string | null
  orderStatus: string | null
  holderName: string | null
  restockNote: string | null
}

export async function listHolds(pool: Pool, filter: { eventId?: number } = {}): Promise<AdminHoldRecord[]> {
  await sweepExpiredHolds(pool, filter.eventId ? { eventId: filter.eventId } : {})
  const params: unknown[] = []
  let where = `h.state <> 'released' OR h.order_id IS NOT NULL`
  if (filter.eventId) {
    params.push(filter.eventId)
    where = `(${where}) AND l.event_id = $1`
  }
  const result = await pool.query<{
    id: number
    state: string
    quantity: number
    unit_price: string
    expires_at: Date
    created_at: Date
    review_expired_at: Date | null
    event_id: number
    event_title: string
    section_code: string
    row_label: string | null
    reference: string | null
    order_status: string | null
    holder_name: string | null
    restock_note: string | null
  }>(
    `SELECT h.id, h.state, h.quantity, h.unit_price, h.expires_at, h.created_at, h.review_expired_at, h.restock_note,
            l.event_id, e.title AS event_title, l.section_code, l.row_label,
            o.reference, o.status AS order_status, o.holder_name
     FROM seat_holds h
     JOIN seat_listings l ON l.id = h.listing_id
     JOIN events e ON e.id = l.event_id
     LEFT JOIN orders o ON o.id = h.order_id
     WHERE ${where}
     ORDER BY (h.state = 'review_expired') DESC, h.created_at DESC
     LIMIT 300`,
    params,
  )
  return result.rows.map((r) => ({
    id: r.id,
    state: r.state,
    quantity: r.quantity,
    unitPrice: Number(r.unit_price),
    total: Number(r.unit_price) * r.quantity,
    expiresAt: new Date(r.expires_at).toISOString(),
    createdAt: new Date(r.created_at).toISOString(),
    reviewExpiredAt: r.review_expired_at ? new Date(r.review_expired_at).toISOString() : null,
    eventId: r.event_id,
    eventTitle: r.event_title,
    sectionCode: r.section_code,
    rowLabel: r.row_label,
    orderReference: r.reference,
    orderStatus: r.order_status,
    holderName: r.holder_name,
    restockNote: r.restock_note,
  }))
}

export type InventoryLogRecord = {
  id: number
  listingId: number
  sectionCode: string
  action: string
  deltaHeld: number
  deltaSold: number
  actor: string
  note: string | null
  createdAt: string
}

export async function listInventoryLog(pool: Pool, eventId: number): Promise<InventoryLogRecord[]> {
  const result = await pool.query<{
    id: string
    listing_id: number
    section_code: string
    action: string
    delta_held: number
    delta_sold: number
    actor: string
    note: string | null
    created_at: Date
  }>(
    `SELECT g.id, g.listing_id, l.section_code, g.action, g.delta_held, g.delta_sold, g.actor, g.note, g.created_at
     FROM seat_inventory_log g JOIN seat_listings l ON l.id = g.listing_id
     WHERE l.event_id = $1 ORDER BY g.id DESC LIMIT 200`,
    [eventId],
  )
  return result.rows.map((r) => ({
    id: Number(r.id),
    listingId: r.listing_id,
    sectionCode: r.section_code,
    action: r.action,
    deltaHeld: r.delta_held,
    deltaSold: r.delta_sold,
    actor: r.actor,
    note: r.note,
    createdAt: new Date(r.created_at).toISOString(),
  }))
}
