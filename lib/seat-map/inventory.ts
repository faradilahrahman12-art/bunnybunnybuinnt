import { randomBytes, randomInt } from 'node:crypto'
import type { Pool, PoolClient } from 'pg'
import { resolveOrderDelivery } from '../delivery'

// Core seat-map inventory engine. Plain `pg` with relative imports only, so the same
// code runs inside server actions and in the automated test suite.

export const CHECKOUT_HOLD_MINUTES = 15
export const REVIEW_HOLD_HOURS = 24
export const MAX_TICKETS_PER_ORDER = 10

export class SeatMapError extends Error {
  constructor(message: string, readonly code: string = 'seat_map_error') {
    super(message)
  }
}

type Db = Pool | PoolClient

export async function withTransaction<T>(pool: Pool, fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await fn(client)
    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {})
    throw error
  } finally {
    client.release()
  }
}

type LogEntry = {
  listingId: number
  holdId: number | null
  action: string
  deltaHeld?: number
  deltaSold?: number
  actor: string
  note?: string | null
}

async function writeLog(client: Db, entry: LogEntry) {
  await client.query(
    `INSERT INTO seat_inventory_log (listing_id, hold_id, action, delta_held, delta_sold, actor, note)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [entry.listingId, entry.holdId, entry.action, entry.deltaHeld ?? 0, entry.deltaSold ?? 0, entry.actor, entry.note ?? null],
  )
}

function assertQuantity(quantity: number) {
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_TICKETS_PER_ORDER) {
    throw new SeatMapError(`Choose between 1 and ${MAX_TICKETS_PER_ORDER} tickets.`, 'invalid_quantity')
  }
}

// ---------------------------------------------------------------------------
// Expiry sweep: checkout holds are released; payment-review holds release their
// inventory but the order stays Pending and is flagged (state review_expired).
// ---------------------------------------------------------------------------
export async function sweepExpiredHolds(pool: Pool, filter: { listingId?: number; eventId?: number } = {}) {
  return withTransaction(pool, async (client) => {
    const params: unknown[] = []
    let scope = ''
    if (filter.listingId) {
      params.push(filter.listingId)
      scope = `AND h.listing_id = $${params.length}`
    } else if (filter.eventId) {
      params.push(filter.eventId)
      scope = `AND h.listing_id IN (SELECT id FROM seat_listings WHERE event_id = $${params.length})`
    }
    const result = await client.query<{ hold_id: number }>(
      `WITH expired AS (
         SELECT h.id, h.state AS prev FROM seat_holds h
         WHERE h.state IN ('checkout','payment_review') AND h.expires_at <= now() ${scope}
         FOR UPDATE SKIP LOCKED
       ), upd AS (
         UPDATE seat_holds h SET
           state = CASE WHEN e.prev = 'checkout' THEN 'released' ELSE 'review_expired' END,
           counts_as = 'none',
           release_reason = CASE WHEN e.prev = 'checkout' THEN 'checkout_expired' ELSE NULL END,
           released_at = CASE WHEN e.prev = 'checkout' THEN now() ELSE h.released_at END,
           review_expired_at = CASE WHEN e.prev = 'payment_review' THEN now() ELSE h.review_expired_at END,
           updated_at = now()
         FROM expired e WHERE h.id = e.id
         RETURNING h.id, h.listing_id, h.quantity, e.prev
       ), listings AS (
         UPDATE seat_listings l SET quantity_held = l.quantity_held - s.qty, updated_at = now()
         FROM (SELECT listing_id, sum(quantity)::int AS qty FROM upd GROUP BY listing_id) s
         WHERE l.id = s.listing_id
       )
       INSERT INTO seat_inventory_log (listing_id, hold_id, action, delta_held, actor)
       SELECT listing_id, id, CASE WHEN prev = 'checkout' THEN 'checkout_expired' ELSE 'review_expired' END,
              -quantity, 'system'
       FROM upd
       RETURNING hold_id`,
      params,
    )
    return result.rowCount ?? 0
  })
}

// ---------------------------------------------------------------------------
// Customer: reserve tickets for 15 minutes
// ---------------------------------------------------------------------------
export type Reservation = {
  token: string
  holdId: number
  listingId: number
  eventId: number
  quantity: number
  unitPrice: number
  total: number
  expiresAt: string
}

export async function reserveSeats(
  pool: Pool,
  input: { userId: string; listingId: number; quantity: number; allowHidden?: boolean },
): Promise<Reservation> {
  const allowHidden = Boolean(input.allowHidden)
  if (!input.userId) throw new SeatMapError('Please sign in to reserve tickets.', 'unauthenticated')
  if (!Number.isInteger(input.listingId) || input.listingId < 1) {
    throw new SeatMapError('That listing could not be found.', 'not_found')
  }
  assertQuantity(input.quantity)
  await sweepExpiredHolds(pool, { listingId: input.listingId })

  const actor = `customer:${input.userId}`
  try {
    return await withTransaction(pool, async (client) => {
      // A customer has at most one active checkout; a new reservation replaces it.
      const replaced = await client.query<{ id: number; listing_id: number; quantity: number }>(
        `UPDATE seat_holds SET state = 'released', counts_as = 'none', release_reason = 'replaced',
                released_at = now(), updated_at = now()
         WHERE user_id = $1 AND state = 'checkout'
         RETURNING id, listing_id, quantity`,
        [input.userId],
      )
      for (const old of replaced.rows) {
        await client.query(
          `UPDATE seat_listings SET quantity_held = quantity_held - $2, updated_at = now() WHERE id = $1`,
          [old.listing_id, old.quantity],
        )
        await writeLog(client, { listingId: old.listing_id, holdId: old.id, action: 'replaced', deltaHeld: -old.quantity, actor })
      }

      // Single atomic statement: availability check + increment. Row lock + CHECK constraint prevent overselling.
      const claimed = await client.query<{ price: string; event_id: number }>(
        `UPDATE seat_listings l SET quantity_held = l.quantity_held + $2, updated_at = now()
         WHERE l.id = $1
           AND l.status = 'available'
           AND $2 <= l.max_per_order
           AND l.quantity_held + l.quantity_sold + $2 <= l.quantity_total
           AND EXISTS (
             SELECT 1 FROM event_seat_maps m JOIN events e ON e.id = m.event_id
             WHERE m.event_id = l.event_id AND m.enabled AND e.type = 'resale'
               AND (e.hidden = false OR $3) AND e.coming_soon = false)
         RETURNING l.price, l.event_id`,
        [input.listingId, input.quantity, allowHidden],
      )
      if (claimed.rowCount === 0) {
        const info = await client.query<{ left: number; max_per_order: number }>(
          `SELECT greatest(l.quantity_total - l.quantity_held - l.quantity_sold, 0)::int AS left, l.max_per_order
           FROM seat_listings l
           JOIN event_seat_maps m ON m.event_id = l.event_id AND m.enabled
           JOIN events e ON e.id = l.event_id AND e.type = 'resale' AND (e.hidden = false OR $2) AND e.coming_soon = false
           WHERE l.id = $1 AND l.status = 'available'`,
          [input.listingId, allowHidden],
        )
        const row = info.rows[0]
        if (row && input.quantity > row.max_per_order) {
          throw new SeatMapError(`This listing allows up to ${row.max_per_order} tickets per order.`, 'over_max')
        }
        if (row && row.left > 0) {
          throw new SeatMapError(`Only ${row.left} ticket${row.left === 1 ? '' : 's'} left in this listing.`, 'insufficient')
        }
        throw new SeatMapError('Sorry, these tickets are no longer available.', 'unavailable')
      }

      const { price, event_id: eventId } = claimed.rows[0]
      const token = randomBytes(24).toString('hex')
      const hold = await client.query<{ id: number; expires_at: Date }>(
        `INSERT INTO seat_holds (token, listing_id, user_id, quantity, unit_price, state, counts_as, expires_at)
         VALUES ($1, $2, $3, $4, $5, 'checkout', 'held', now() + make_interval(mins => $6))
         RETURNING id, expires_at`,
        [token, input.listingId, input.userId, input.quantity, price, CHECKOUT_HOLD_MINUTES],
      )
      const { id: holdId, expires_at: expiresAt } = hold.rows[0]
      await writeLog(client, { listingId: input.listingId, holdId, action: 'reserve', deltaHeld: input.quantity, actor })

      const unitPrice = Number(price)
      return {
        token,
        holdId,
        listingId: input.listingId,
        eventId,
        quantity: input.quantity,
        unitPrice,
        total: unitPrice * input.quantity,
        expiresAt: new Date(expiresAt).toISOString(),
      }
    })
  } catch (error) {
    if ((error as { code?: string }).code === '23505') {
      throw new SeatMapError('Another reservation is already in progress. Please try again.', 'conflict')
    }
    throw error
  }
}

export type HoldSummary = {
  holdId: number
  token: string
  state: string
  eventId: number
  listingId: number
  sectionCode: string
  rowLabel: string | null
  seats: string | null
  dateLabel: string
  quantity: number
  unitPrice: number
  total: number
  expiresAt: string
  orderId: number | null
}

const HOLD_SUMMARY_SELECT = `
  SELECT h.id, h.token, h.state, h.quantity, h.unit_price, h.expires_at, h.order_id, h.user_id,
         l.id AS listing_id, l.event_id, l.section_code, l.row_label, l.seats,
         coalesce(d.label, nullif(e.dates, ''), 'Event date') AS date_label
  FROM seat_holds h
  JOIN seat_listings l ON l.id = h.listing_id
  JOIN events e ON e.id = l.event_id
  LEFT JOIN event_dates d ON d.id = l.event_date_id`

type HoldSummaryRow = {
  id: number
  token: string
  state: string
  quantity: number
  unit_price: string
  expires_at: Date
  order_id: number | null
  user_id: string
  listing_id: number
  event_id: number
  section_code: string
  row_label: string | null
  seats: string | null
  date_label: string
}

function toSummary(row: HoldSummaryRow): HoldSummary {
  const unitPrice = Number(row.unit_price)
  return {
    holdId: row.id,
    token: row.token,
    state: row.state,
    eventId: row.event_id,
    listingId: row.listing_id,
    sectionCode: row.section_code,
    rowLabel: row.row_label,
    seats: row.seats,
    dateLabel: row.date_label,
    quantity: row.quantity,
    unitPrice,
    total: unitPrice * row.quantity,
    expiresAt: new Date(row.expires_at).toISOString(),
    orderId: row.order_id,
  }
}

/** Active checkout hold owned by this customer, or null when missing, expired, or someone else's. */
export async function getActiveCheckoutHold(pool: Pool, input: { token: string; userId: string }) {
  if (!input.token || !input.userId) return null
  const result = await pool.query<HoldSummaryRow>(
    `${HOLD_SUMMARY_SELECT}
     WHERE h.token = $1 AND h.user_id = $2 AND h.state = 'checkout' AND h.expires_at > now()`,
    [input.token, input.userId],
  )
  return result.rows[0] ? toSummary(result.rows[0]) : null
}

export async function getHoldForOrder(db: Db, orderId: number) {
  const result = await db.query<HoldSummaryRow>(`${HOLD_SUMMARY_SELECT} WHERE h.order_id = $1`, [orderId])
  return result.rows[0] ? toSummary(result.rows[0]) : null
}

export async function releaseCheckoutHold(pool: Pool, input: { token: string; userId: string }) {
  return withTransaction(pool, async (client) => {
    const result = await client.query<{ id: number; listing_id: number; quantity: number }>(
      `UPDATE seat_holds SET state = 'released', counts_as = 'none', release_reason = 'cancelled',
              released_at = now(), cancelled_at = now(), updated_at = now()
       WHERE token = $1 AND user_id = $2 AND state = 'checkout'
       RETURNING id, listing_id, quantity`,
      [input.token, input.userId],
    )
    const hold = result.rows[0]
    if (!hold) return false
    await client.query(`UPDATE seat_listings SET quantity_held = quantity_held - $2, updated_at = now() WHERE id = $1`, [
      hold.listing_id,
      hold.quantity,
    ])
    await writeLog(client, {
      listingId: hold.listing_id,
      holdId: hold.id,
      action: 'cancel_release',
      deltaHeld: -hold.quantity,
      actor: `customer:${input.userId}`,
    })
    return true
  })
}

// ---------------------------------------------------------------------------
// Customer: submit payment -> order is created and the hold moves to 24h review
// ---------------------------------------------------------------------------
export type SeatOrderDetails = {
  eventId: number
  accountEmail: string
  accountPassword: string
  holderName: string
  holderDob: string
  contactNumber: string
  telegram: string | null
  instagram: string | null
  memberships: string[]
  paymentMethod: string | null
  paymentMerchant: string | null
  paymentReference: string | null
  datePaid: string | null
  timePaid: string | null
  amountSent: number | null
  screenshots: string[]
  deliveryMethod?: 'flexible' | null
  priorityDeliveryMethod?: 'change_account_details' | null
  actualDeliveryMethod?: null
  }

const REFERENCE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
function makeReference() {
  let value = ''
  for (let i = 0; i < 6; i++) value += REFERENCE_CHARS[randomInt(REFERENCE_CHARS.length)]
  return `NP-${value}`
}

export function sectionDisplayName(code: string) {
  return code.toUpperCase() === 'FLOOR' ? 'Floor' : `Section ${code}`
}

export async function submitHoldOrder(
  pool: Pool,
  input: { token: string; userId: string; details: SeatOrderDetails },
): Promise<{ reference: string; orderId: number; total: number; duplicate: boolean; createdAt: string }> {
  return withTransaction(pool, async (client) => {
    const found = await client.query<{
      id: number
      user_id: string
      state: string
      quantity: number
      unit_price: string
      expires_at: Date
      order_id: number | null
      listing_id: number
    }>(
      `SELECT id, user_id, state, quantity, unit_price, expires_at, order_id, listing_id
       FROM seat_holds WHERE token = $1 FOR UPDATE`,
      [input.token],
    )
    const hold = found.rows[0]
    if (!hold || hold.user_id !== input.userId) {
      throw new SeatMapError('Reservation not found. Please choose your tickets again.', 'not_found')
    }

    // Duplicate submission (double click, retry, second tab): return the order already created.
    if (hold.state !== 'checkout') {
      if (hold.order_id) {
        const existing = await client.query<{ reference: string; total_amount: string; created_at: Date }>(
          `SELECT reference, total_amount, created_at FROM orders WHERE id = $1`,
          [hold.order_id],
        )
        const order = existing.rows[0]
        if (order) {
          return {
            reference: order.reference,
            orderId: hold.order_id,
            total: Number(order.total_amount),
            duplicate: true,
            createdAt: new Date(order.created_at).toISOString(),
          }
        }
      }
      throw new SeatMapError('Your 15-minute reservation has expired. Please choose your tickets again.', 'expired')
    }
    if (new Date(hold.expires_at).getTime() <= Date.now()) {
      throw new SeatMapError('Your 15-minute reservation has expired. Please choose your tickets again.', 'expired')
    }

    const listingResult = await client.query<{
      event_id: number
      section_code: string
      row_label: string | null
      seats: string | null
      event_title: string
      event_type: string
      country: string | null
      date_label: string
    }>(
      `SELECT l.event_id, l.section_code, l.row_label, l.seats, e.title AS event_title, e.type AS event_type, e.country,
              coalesce(d.label, nullif(e.dates, ''), 'Event date') AS date_label
       FROM seat_listings l
       JOIN events e ON e.id = l.event_id
       LEFT JOIN event_dates d ON d.id = l.event_date_id
       WHERE l.id = $1`,
      [hold.listing_id],
    )
    const listing = listingResult.rows[0]
    if (!listing || listing.event_id !== input.details.eventId || listing.event_type !== 'resale') {
      throw new SeatMapError('This reservation belongs to a different event.', 'event_mismatch')
    }

    // Server-side all-in price: locked unit price x quantity. Client totals are ignored.
    const unitPrice = Number(hold.unit_price)
    const total = unitPrice * hold.quantity
    const ticketLabel = [
      sectionDisplayName(listing.section_code),
      listing.row_label ? `Row ${listing.row_label}` : null,
      listing.seats ? `Seats ${listing.seats}` : null,
    ]
      .filter(Boolean)
      .join(' · ')
    const sections = { [listing.date_label]: { priority: ticketLabel, quantity: hold.quantity } }
    const d = input.details
    const eventResult = await client.query<{ type: string; country: string | null; platform: string | null }>(
      'SELECT type, country, platform FROM events WHERE id = $1 LIMIT 1',
      [listing.event_id],
    )
    const delivery = resolveOrderDelivery(eventResult.rows[0] ?? null, d.deliveryMethod)

    let order: { id: number; reference: string; created_at: Date } | undefined
    for (let attempt = 0; attempt < 5 && !order; attempt++) {
      const inserted = await client.query<{ id: number; reference: string; created_at: Date }>(
        `INSERT INTO orders (reference, user_id, event_id, event_title, service_type, service_tier, country, dates,
           quantity_per_date, sections, total_amount, account_email, account_password, holder_name, holder_dob,
           contact_number, telegram, instagram, memberships, payment_method, payment_merchant, payment_reference,
           date_paid, time_paid, amount_sent, screenshots, delivery_method, priority_delivery_method, actual_delivery_method, status)
         VALUES ($1,$2,$3,$4,'resale',NULL,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,'pending')
         ON CONFLICT (reference) DO NOTHING
         RETURNING id, reference, created_at`,
        [
          makeReference(),
          input.userId,
          listing.event_id,
          listing.event_title,
          listing.country,
          JSON.stringify([listing.date_label]),
          hold.quantity,
          JSON.stringify(sections),
          total,
          d.accountEmail.trim(),
          d.accountPassword,
          d.holderName.trim(),
          d.holderDob,
          d.contactNumber.trim(),
          d.telegram?.trim() || null,
          d.instagram?.trim() || null,
          JSON.stringify(d.memberships ?? []),
          d.paymentMethod,
          d.paymentMerchant?.trim() || null,
          d.paymentReference?.trim() || null,
          d.datePaid?.trim() || null,
          d.timePaid?.trim() || null,
          d.amountSent ?? null,
          JSON.stringify(Array.isArray(d.screenshots) ? d.screenshots : []),
          delivery.deliveryMethod,
          delivery.priorityDeliveryMethod,
          delivery.actualDeliveryMethod,
        ],
      )
      order = inserted.rows[0]
    }
    if (!order) throw new SeatMapError('Could not create the order. Please try again.', 'reference_collision')

    await client.query(
      `UPDATE seat_holds SET state = 'payment_review', order_id = $2, submitted_at = now(),
              expires_at = now() + make_interval(hours => $3), updated_at = now()
       WHERE id = $1 AND state = 'checkout'`,
      [hold.id, order.id, REVIEW_HOLD_HOURS],
    )
    await writeLog(client, {
      listingId: hold.listing_id,
      holdId: hold.id,
      action: 'submit',
      actor: `customer:${input.userId}`,
      note: order.reference,
    })
    return {
      reference: order.reference,
      orderId: order.id,
      total,
      duplicate: false,
      createdAt: new Date(order.created_at).toISOString(),
    }
  })
}

// ---------------------------------------------------------------------------
// Admin: order lifecycle
// ---------------------------------------------------------------------------
type LockedHold = { id: number; listing_id: number; quantity: number; state: string }

async function lockHoldByOrder(client: PoolClient, orderId: number): Promise<LockedHold | null> {
  const result = await client.query<LockedHold>(
    `SELECT id, listing_id, quantity, state FROM seat_holds WHERE order_id = $1 FOR UPDATE`,
    [orderId],
  )
  return result.rows[0] ?? null
}

/** Confirm a seat-map order. Returns 'none' when the order has no seat hold. */
export async function confirmOrderHold(client: PoolClient, input: { orderId: number; actor: string }) {
  const hold = await lockHoldByOrder(client, input.orderId)
  if (!hold) return 'none' as const
  if (hold.state === 'confirmed') return 'already' as const

  if (hold.state === 'payment_review') {
    await client.query(
      `UPDATE seat_listings SET quantity_held = quantity_held - $2, quantity_sold = quantity_sold + $2, updated_at = now()
       WHERE id = $1`,
      [hold.listing_id, hold.quantity],
    )
    await client.query(
      `UPDATE seat_holds SET state = 'confirmed', counts_as = 'sold', confirmed_at = now(), confirmed_by = $2, updated_at = now()
       WHERE id = $1`,
      [hold.id, input.actor],
    )
    await writeLog(client, {
      listingId: hold.listing_id,
      holdId: hold.id,
      action: 'confirm',
      deltaHeld: -hold.quantity,
      deltaSold: hold.quantity,
      actor: input.actor,
    })
    return 'confirmed' as const
  }

  if (hold.state === 'review_expired') {
    // The 24h hold lapsed and its tickets went back on sale; confirm only if they can be reacquired.
    const reacquired = await client.query(
      `UPDATE seat_listings SET quantity_sold = quantity_sold + $2, updated_at = now()
       WHERE id = $1 AND quantity_held + quantity_sold + $2 <= quantity_total`,
      [hold.listing_id, hold.quantity],
    )
    if (reacquired.rowCount === 0) {
      throw new SeatMapError(
        'The payment-review hold expired and there is not enough inventory left to confirm this order. Cancel it or add inventory first.',
        'insufficient',
      )
    }
    await client.query(
      `UPDATE seat_holds SET state = 'confirmed', counts_as = 'sold', confirmed_at = now(), confirmed_by = $2, updated_at = now()
       WHERE id = $1`,
      [hold.id, input.actor],
    )
    await writeLog(client, {
      listingId: hold.listing_id,
      holdId: hold.id,
      action: 'reacquire',
      deltaSold: hold.quantity,
      actor: input.actor,
    })
    return 'confirmed' as const
  }

  throw new SeatMapError(`This seat reservation can't be confirmed (state: ${hold.state}).`, 'invalid_state')
}

/** Cancel a seat-map order. Unconfirmed holds release their tickets; confirmed sales wait for explicit restocking. */
export async function cancelOrderHold(client: PoolClient, input: { orderId: number; actor: string }) {
  const hold = await lockHoldByOrder(client, input.orderId)
  if (!hold) return 'none' as const

  if (hold.state === 'payment_review' || hold.state === 'review_expired') {
    const deltaHeld = hold.state === 'payment_review' ? -hold.quantity : 0
    if (deltaHeld) {
      await client.query(`UPDATE seat_listings SET quantity_held = quantity_held + $2, updated_at = now() WHERE id = $1`, [
        hold.listing_id,
        deltaHeld,
      ])
    }
    await client.query(
      `UPDATE seat_holds SET state = 'released', counts_as = 'none', release_reason = 'cancelled',
              released_at = now(), cancelled_at = now(), updated_at = now()
       WHERE id = $1`,
      [hold.id],
    )
    await writeLog(client, { listingId: hold.listing_id, holdId: hold.id, action: 'cancel_release', deltaHeld, actor: input.actor })
    return 'released' as const
  }

  if (hold.state === 'confirmed') {
    await client.query(
      `UPDATE seat_holds SET state = 'sold_cancelled', cancelled_at = now(), updated_at = now() WHERE id = $1`,
      [hold.id],
    )
    await writeLog(client, {
      listingId: hold.listing_id,
      holdId: hold.id,
      action: 'cancel_sold',
      actor: input.actor,
      note: 'Awaiting explicit restock',
    })
    return 'awaiting_restock' as const
  }

  return 'already' as const
}

export async function restockHold(pool: Pool, input: { holdId: number; actor: string; note?: string | null }) {
  const note = input.note?.trim().slice(0, 300) || null
  return withTransaction(pool, async (client) => {
    const result = await client.query<LockedHold>(
      `SELECT id, listing_id, quantity, state FROM seat_holds WHERE id = $1 FOR UPDATE`,
      [input.holdId],
    )
    const hold = result.rows[0]
    if (!hold) throw new SeatMapError('Reservation not found.', 'not_found')
    if (hold.state !== 'sold_cancelled') {
      throw new SeatMapError('Only cancelled confirmed orders can be restocked.', 'invalid_state')
    }
    await client.query(`UPDATE seat_listings SET quantity_sold = quantity_sold - $2, updated_at = now() WHERE id = $1`, [
      hold.listing_id,
      hold.quantity,
    ])
    await client.query(
      `UPDATE seat_holds SET state = 'restocked', counts_as = 'none', restocked_at = now(), restocked_by = $2,
              restock_note = $3, updated_at = now()
       WHERE id = $1`,
      [hold.id, input.actor, note],
    )
    await writeLog(client, {
      listingId: hold.listing_id,
      holdId: hold.id,
      action: 'restock',
      deltaSold: -hold.quantity,
      actor: input.actor,
      note,
    })
  })
}

/** Status values that mean "payment approved" in the existing order pipeline. */
export const CONFIRMED_ORDER_STATUSES = new Set(['verified', 'confirmed', 'processing', 'in_progress', 'completed', 'complete'])

/**
 * Applies the seat-inventory side of an admin order status change inside the caller's transaction.
 * Orders without a seat hold (existing checkout, HTB) are untouched.
 */
export async function applyOrderStatusToHold(
  client: PoolClient,
  input: { orderId: number; status: string; actor: string },
) {
  if (input.status === 'cancelled') return cancelOrderHold(client, input)
  if (CONFIRMED_ORDER_STATUSES.has(input.status)) return confirmOrderHold(client, input)
  return 'none' as const
}
