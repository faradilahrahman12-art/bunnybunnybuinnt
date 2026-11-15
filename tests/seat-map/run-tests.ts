// Seat-map integration tests. Runs ONLY against the isolated seat-map-preview Neon branch.
//   npx --yes tsx tests/seat-map/run-tests.ts
// Test data lives on hidden "[TEST]" events and is hidden/cancelled at the end
// (the audit log is append-only by design, so rows are never deleted).
import assert from 'node:assert/strict'
import pg from 'pg'
import {
  applyOrderStatusToHold,
  getActiveCheckoutHold,
  releaseCheckoutHold,
  reserveSeats,
  restockHold,
  submitHoldOrder,
  sweepExpiredHolds,
  withTransaction,
  type SeatOrderDetails,
} from '../../lib/seat-map/inventory'
import {
  assignEventMap,
  getPublicSeatMap,
  listListings,
  listVenueMaps,
  saveListing,
  saveVenueMap,
} from '../../lib/seat-map/catalog'

const REQUIRED_ENDPOINT = 'ep-flat-paper-aunlgcr1'
const REQUIRED_TIMELINE = '9d01c0e9591375ebce9a0a4408542462'

const url = process.env.DATABASE_URL_SEAT_MAP_TEST
if (!url) throw new Error('DATABASE_URL_SEAT_MAP_TEST is not set')
const hostEndpoint = new URL(url).hostname.split('.')[0].replace(/-pooler$/, '')
if (hostEndpoint !== REQUIRED_ENDPOINT) throw new Error(`Refusing: endpoint ${hostEndpoint}`)
for (const name of ['DATABASE_URL_PRODUCTION', 'DATABASE_URL', 'POSTGRES_URL']) {
  const other = process.env[name]
  if (other && new URL(other).hostname.split('.')[0].replace(/-pooler$/, '') === hostEndpoint) {
    throw new Error(`Refusing: endpoint equals ${name}`)
  }
}

const pool = new pg.Pool({ connectionString: url, max: 25 })
const RUN = Date.now().toString(36)
const ADMIN = 'admin:test-suite'

const results: { name: string; ok: boolean; error?: string }[] = []
async function test(name: string, fn: () => Promise<void>) {
  try {
    await fn()
    results.push({ name, ok: true })
    console.log(`  PASS  ${name}`)
  } catch (error) {
    results.push({ name, ok: false, error: (error as Error).message })
    console.log(`  FAIL  ${name}\n        ${(error as Error).message}`)
  }
}

async function expectError(fn: () => Promise<unknown>, pattern: RegExp) {
  try {
    await fn()
  } catch (error) {
    assert.match((error as Error).message, pattern)
    return
  }
  assert.fail(`expected error matching ${pattern}`)
}

async function ensureEvent(title: string, type: 'resale' | 'help_to_buy') {
  const found = await pool.query<{ id: number }>(`SELECT id FROM events WHERE title = $1 AND type = $2 LIMIT 1`, [title, type])
  if (found.rows[0]) {
    await pool.query(`UPDATE events SET hidden = false, coming_soon = false WHERE id = $1`, [found.rows[0].id])
    return found.rows[0].id
  }
  const created = await pool.query<{ id: number }>(
    `INSERT INTO events (type, title, country, hidden, sort_order) VALUES ($1, $2, 'Philippines', false, 9999) RETURNING id`,
    [type, title],
  )
  return created.rows[0].id
}

function square(x: number, y: number, size = 80) {
  return `M${x} ${y}L${x + size} ${y}L${x + size} ${y + size}L${x} ${y + size}Z`
}

async function listing(id: number) {
  const r = await pool.query<{ quantity_total: number; quantity_held: number; quantity_sold: number }>(
    `SELECT quantity_total, quantity_held, quantity_sold FROM seat_listings WHERE id = $1`,
    [id],
  )
  return r.rows[0]
}

async function holdState(token: string) {
  const r = await pool.query<{ state: string; counts_as: string; order_id: number | null }>(
    `SELECT state, counts_as, order_id FROM seat_holds WHERE token = $1`,
    [token],
  )
  return r.rows[0]
}

const details = (eventId: number, extra: Partial<SeatOrderDetails> = {}): SeatOrderDetails => ({
  eventId,
  accountEmail: 'seatmap-test@example.com',
  accountPassword: '',
  holderName: 'Seat Map Test',
  holderDob: '',
  contactNumber: '09170000000',
  telegram: null,
  instagram: null,
  memberships: [],
  paymentMethod: 'QRPH',
  paymentMerchant: 'Test',
  paymentReference: `T-${RUN}`,
  datePaid: null,
  timePaid: null,
  amountSent: null,
  screenshots: ['data:image/png;base64,AA=='],
  ...extra,
})

async function setStatus(orderId: number, status: string) {
  return withTransaction(pool, async (client) => {
    const outcome = await applyOrderStatusToHold(client, { orderId, status, actor: ADMIN })
    await client.query(`UPDATE orders SET status = $2 WHERE id = $1`, [orderId, status])
    return outcome
  })
}

async function main() {
  const id = await pool.query<{ endpoint_id: string; timeline_id: string }>(
    `select current_setting('neon.endpoint_id', true) as endpoint_id, current_setting('neon.timeline_id', true) as timeline_id`,
  )
  assert.equal(id.rows[0].endpoint_id, REQUIRED_ENDPOINT, 'server endpoint mismatch')
  assert.equal(id.rows[0].timeline_id, REQUIRED_TIMELINE, 'server timeline mismatch')
  console.log(`Target verified: ${id.rows[0].endpoint_id} / ${id.rows[0].timeline_id}\n`)

  const eventA = await ensureEvent('[TEST] Seat map suite A', 'resale')
  const eventB = await ensureEvent('[TEST] Seat map suite B', 'resale')
  const eventC = await ensureEvent('[TEST] Seat map suite C (shared layout)', 'resale')
  const eventHtb = await ensureEvent('[TEST] Seat map suite HTB', 'help_to_buy')
  const eventLegacy = await ensureEvent('[TEST] Seat map suite legacy checkout', 'resale')
  await pool.query(`UPDATE events SET hidden = true WHERE id = $1`, [eventHtb])

  let mapOne = 0
  let mapTwo = 0

  await test('admin map creation persists layout, image and sections', async () => {
    mapOne = await saveVenueMap(pool, {
      name: `Test Arena ${RUN}`,
      venueName: 'Test Arena',
      width: 1000,
      height: 800,
      backgroundImageUrl: null,
      backgroundImagePathname: null,
      sections: [
        { code: 'A1', kind: 'seat', path: square(100, 100), labelX: 140, labelY: 140, labelSize: 16 },
        { code: 'B2', kind: 'seat', path: square(300, 100), labelX: 340, labelY: 140, labelSize: 16 },
        { code: 'FLOOR', kind: 'floor', path: square(500, 400, 200), labelX: 600, labelY: 500, labelSize: 20 },
        { code: 'STAGE', kind: 'stage', path: square(500, 700, 100), labelX: 550, labelY: 750, labelSize: 20 },
      ],
    })
    const reloaded = (await listVenueMaps(pool)).find((m) => m.id === mapOne)
    assert.ok(reloaded)
    assert.equal(reloaded.sections.length, 4)
    assert.deepEqual(reloaded.sections.map((s) => s.code), ['A1', 'B2', 'FLOOR', 'STAGE'])

    // Edit: move B2, rename A1 -> A, delete nothing else
    await saveVenueMap(pool, {
      id: mapOne,
      name: `Test Arena ${RUN}`,
      venueName: 'Test Arena',
      width: 1000,
      height: 800,
      backgroundImageUrl: null,
      backgroundImagePathname: null,
      sections: [
        { code: 'A', kind: 'seat', path: square(100, 100), labelX: 140, labelY: 140, labelSize: 16 },
        { code: 'B2', kind: 'seat', path: square(320, 120), labelX: 360, labelY: 160, labelSize: 16 },
        { code: 'FLOOR', kind: 'floor', path: square(500, 400, 200), labelX: 600, labelY: 500, labelSize: 20 },
      ],
    })
    const edited = (await listVenueMaps(pool)).find((m) => m.id === mapOne)!
    assert.deepEqual(edited.sections.map((s) => s.code), ['A', 'B2', 'FLOOR'])
    assert.equal(edited.sections[1].path, square(320, 120))
  })

  await test('map validation rejects bad shapes, duplicate codes and foreign image URLs', async () => {
    const base = { name: 'x', venueName: 'y', width: 500, height: 500, backgroundImageUrl: null, backgroundImagePathname: null }
    await expectError(
      () => saveVenueMap(pool, { ...base, sections: [{ code: 'A', kind: 'seat', path: '<script>', labelX: 1, labelY: 1, labelSize: 10 }] }),
      /invalid shape/,
    )
    await expectError(
      () =>
        saveVenueMap(pool, {
          ...base,
          sections: [
            { code: 'A', kind: 'seat', path: square(0, 0), labelX: 1, labelY: 1, labelSize: 10 },
            { code: 'a', kind: 'seat', path: square(0, 0), labelX: 1, labelY: 1, labelSize: 10 },
          ],
        }),
      /used twice/,
    )
    await expectError(
      () => saveVenueMap(pool, { ...base, backgroundImageUrl: 'https://evil.example.com/seat-maps/x.png', sections: [] }),
      /uploaded through the seat map manager/,
    )
  })

  await test('multiple events can use different maps', async () => {
    mapTwo = await saveVenueMap(pool, {
      name: `Test Stadium ${RUN}`,
      venueName: 'Test Stadium',
      width: 600,
      height: 600,
      backgroundImageUrl: null,
      backgroundImagePathname: null,
      sections: [{ code: 'N', kind: 'seat', path: square(50, 50), labelX: 90, labelY: 90, labelSize: 14 }],
    })
    await assignEventMap(pool, { eventId: eventA, mapId: mapOne, enabled: true })
    await assignEventMap(pool, { eventId: eventB, mapId: mapTwo, enabled: true })
    await saveListing(pool, listingInput(eventA, 'A', 10, 5000), ADMIN)
    await saveListing(pool, listingInput(eventB, 'N', 4, 3000), ADMIN)
    const a = await getPublicSeatMap(pool, eventA)
    const b = await getPublicSeatMap(pool, eventB)
    assert.equal(a?.map.id, mapOne)
    assert.equal(b?.map.id, mapTwo)
    assert.ok(a?.listings.every((l) => l.eventId === eventA))
    assert.ok(b?.listings.every((l) => l.eventId === eventB))
  })

  await test('events sharing one layout keep independent inventory', async () => {
    await assignEventMap(pool, { eventId: eventC, mapId: mapOne, enabled: true })
    const cListing = await saveListing(pool, listingInput(eventC, 'A', 3, 5000), ADMIN)
    const aListing = (await listListings(pool, eventA)).find((l) => l.sectionCode === 'A')!
    const r = await reserveSeats(pool, { userId: `u-share-${RUN}`, listingId: cListing, quantity: 3 })
    assert.equal((await listing(cListing)).quantity_held, 3)
    assert.equal((await listing(aListing.id)).quantity_held, 0, 'event A inventory must be untouched')
    const cMap = await getPublicSeatMap(pool, eventC)
    assert.ok(cMap?.soldOutCodes.includes('A'), 'section A sold out for event C')
    const aMap = await getPublicSeatMap(pool, eventA)
    assert.ok(aMap?.listings.some((l) => l.sectionCode === 'A' && l.available === 10))
    await releaseCheckoutHold(pool, { token: r.token, userId: `u-share-${RUN}` })
  })

  await test('ticket inventory management: edit, hide, quantity floor, unknown section', async () => {
    const id = await saveListing(pool, listingInput(eventA, 'B2', 6, 7000, { rowLabel: 'F', seats: '1-6' }), ADMIN)
    await saveListing(pool, { ...listingInput(eventA, 'B2', 8, 6500, { rowLabel: 'G' }), id }, ADMIN)
    let row = (await listListings(pool, eventA)).find((l) => l.id === id)!
    assert.equal(row.quantityTotal, 8)
    assert.equal(row.price, 6500)
    assert.equal(row.rowLabel, 'G')

    await saveListing(pool, { ...listingInput(eventA, 'B2', 8, 6500), id, status: 'hidden' }, ADMIN)
    assert.ok(!(await getPublicSeatMap(pool, eventA))!.listings.some((l) => l.id === id), 'hidden listing not public')

    await saveListing(pool, { ...listingInput(eventA, 'B2', 8, 6500), id, status: 'available' }, ADMIN)
    const hold = await reserveSeats(pool, { userId: `u-inv-${RUN}`, listingId: id, quantity: 5 })
    await expectError(() => saveListing(pool, { ...listingInput(eventA, 'B2', 4, 6500), id }, ADMIN), /cannot be lower/)
    await releaseCheckoutHold(pool, { token: hold.token, userId: `u-inv-${RUN}` })

    await expectError(() => saveListing(pool, listingInput(eventA, 'ZZZ', 2, 100), ADMIN), /not on this event's map/)
    const logs = await pool.query(`SELECT count(*)::int AS n FROM seat_inventory_log WHERE listing_id = $1 AND action = 'admin_adjust'`, [id])
    assert.ok(logs.rows[0].n >= 3, 'admin changes are audit-logged')
    row = (await listListings(pool, eventA)).find((l) => l.id === id)!
    assert.equal(row.quantityHeld, 0)
  })

  await test('simultaneous reservations never oversell (25 buyers, 5 tickets)', async () => {
    const id = await saveListing(pool, listingInput(eventA, 'FLOOR', 5, 9000), ADMIN)
    const attempts = await Promise.allSettled(
      Array.from({ length: 25 }, (_, i) => reserveSeats(pool, { userId: `u-race-${RUN}-${i}`, listingId: id, quantity: 1 })),
    )
    const won = attempts.filter((a) => a.status === 'fulfilled')
    assert.equal(won.length, 5)
    const l = await listing(id)
    assert.equal(l.quantity_held, 5)
    assert.ok(l.quantity_held + l.quantity_sold <= l.quantity_total)
    for (const [i, a] of attempts.entries()) {
      if (a.status === 'fulfilled') await releaseCheckoutHold(pool, { token: a.value.token, userId: `u-race-${RUN}-${i}` })
    }
  })

  await test('overselling prevention: multi-ticket race and per-order max', async () => {
    const id = await saveListing(pool, listingInput(eventA, 'FLOOR', 5, 9500, { maxPerOrder: 4, rowLabel: 'X' }), ADMIN)
    const [x, y] = await Promise.allSettled([
      reserveSeats(pool, { userId: `u-ov1-${RUN}`, listingId: id, quantity: 3 }),
      reserveSeats(pool, { userId: `u-ov2-${RUN}`, listingId: id, quantity: 3 }),
    ])
    assert.equal([x, y].filter((r) => r.status === 'fulfilled').length, 1)
    await expectError(() => reserveSeats(pool, { userId: `u-ov3-${RUN}`, listingId: id, quantity: 5 }), /up to 4/)
    await expectError(() => reserveSeats(pool, { userId: `u-ov3-${RUN}`, listingId: id, quantity: 11 }), /between 1 and 10/)
    await expectError(() => reserveSeats(pool, { userId: `u-ov3-${RUN}`, listingId: id, quantity: 0 }), /between 1 and 10/)
    for (const [r, u] of [[x, `u-ov1-${RUN}`], [y, `u-ov2-${RUN}`]] as const) {
      if (r.status === 'fulfilled') await releaseCheckoutHold(pool, { token: r.value.token, userId: u })
    }
  })

  await test('reservation ownership: another customer cannot use or submit a hold', async () => {
    const id = await saveListing(pool, listingInput(eventA, 'A', 2, 4000, { rowLabel: 'OWN' }), ADMIN)
    const r = await reserveSeats(pool, { userId: `u-own-${RUN}`, listingId: id, quantity: 1 })
    assert.equal(await getActiveCheckoutHold(pool, { token: r.token, userId: `u-other-${RUN}` }), null)
    await expectError(() => submitHoldOrder(pool, { token: r.token, userId: `u-other-${RUN}`, details: details(eventA) }), /not found/)
    await expectError(() => submitHoldOrder(pool, { token: r.token, userId: `u-own-${RUN}`, details: details(eventB) }), /different event/)
    assert.equal(await releaseCheckoutHold(pool, { token: r.token, userId: `u-other-${RUN}` }), false)
    await releaseCheckoutHold(pool, { token: r.token, userId: `u-own-${RUN}` })
  })

  await test('a new reservation replaces the customer\'s previous checkout hold', async () => {
    const id = await saveListing(pool, listingInput(eventA, 'A', 4, 4100, { rowLabel: 'REP' }), ADMIN)
    const first = await reserveSeats(pool, { userId: `u-rep-${RUN}`, listingId: id, quantity: 2 })
    const second = await reserveSeats(pool, { userId: `u-rep-${RUN}`, listingId: id, quantity: 1 })
    assert.equal((await holdState(first.token)).state, 'released')
    assert.equal((await listing(id)).quantity_held, 1)
    await releaseCheckoutHold(pool, { token: second.token, userId: `u-rep-${RUN}` })
  })

  await test('checkout expiration releases held tickets after 15 minutes', async () => {
    const id = await saveListing(pool, listingInput(eventA, 'A', 3, 4200, { rowLabel: 'EXP' }), ADMIN)
    const r = await reserveSeats(pool, { userId: `u-exp-${RUN}`, listingId: id, quantity: 2 })
    const expiresIn = new Date(r.expiresAt).getTime() - Date.now()
    assert.ok(expiresIn > 14 * 60_000 && expiresIn <= 15 * 60_000 + 5000, '15-minute window')
    await pool.query(`UPDATE seat_holds SET expires_at = now() - interval '1 second' WHERE token = $1`, [r.token])
    await expectError(() => submitHoldOrder(pool, { token: r.token, userId: `u-exp-${RUN}`, details: details(eventA) }), /expired/)
    await sweepExpiredHolds(pool, { listingId: id })
    assert.equal((await holdState(r.token)).state, 'released')
    assert.equal((await listing(id)).quantity_held, 0)
  })

  let reviewOrderId = 0
  let reviewListing = 0
  await test('server-side pricing ignores client totals; submit moves to 24h payment review', async () => {
    reviewListing = await saveListing(pool, listingInput(eventA, 'A', 4, 4321.5, { rowLabel: 'PR' }), ADMIN)
    const r = await reserveSeats(pool, { userId: `u-pay-${RUN}`, listingId: reviewListing, quantity: 2 })
    // Admin raises the price after the reservation: the customer keeps the locked price.
    await saveListing(pool, { ...listingInput(eventA, 'A', 4, 9999, { rowLabel: 'PR' }), id: reviewListing }, ADMIN)
    const order = await submitHoldOrder(pool, { token: r.token, userId: `u-pay-${RUN}`, details: details(eventA, { amountSent: 1 }) })
    assert.equal(order.total, 8643)
    const saved = await pool.query(`SELECT total_amount, status, service_type FROM orders WHERE id = $1`, [order.orderId])
    assert.equal(Number(saved.rows[0].total_amount), 8643)
    assert.equal(saved.rows[0].status, 'pending')
    assert.equal(saved.rows[0].service_type, 'resale')
    const h = await pool.query(
      `SELECT state, extract(epoch FROM expires_at - submitted_at)::int AS window_seconds FROM seat_holds WHERE token = $1`,
      [r.token],
    )
    assert.equal(h.rows[0].state, 'payment_review')
    assert.equal(h.rows[0].window_seconds, 24 * 3600)
    reviewOrderId = order.orderId
  })

  await test('duplicate submissions return the same order', async () => {
    const id = await saveListing(pool, listingInput(eventA, 'A', 2, 4400, { rowLabel: 'DUP' }), ADMIN)
    const r = await reserveSeats(pool, { userId: `u-dup-${RUN}`, listingId: id, quantity: 1 })
    const attempts = await Promise.all(
      [1, 2, 3].map(() => submitHoldOrder(pool, { token: r.token, userId: `u-dup-${RUN}`, details: details(eventA) })),
    )
    assert.equal(new Set(attempts.map((a) => a.reference)).size, 1)
    assert.equal(attempts.filter((a) => !a.duplicate).length, 1)
    const n = await pool.query(`SELECT count(*)::int AS n FROM seat_holds WHERE token = $1 AND order_id IS NOT NULL`, [r.token])
    assert.equal(n.rows[0].n, 1)
    await setStatus(attempts[0].orderId, 'cancelled')
  })

  await test('order confirmation moves held -> sold', async () => {
    const before = await listing(reviewListing)
    assert.equal(await setStatus(reviewOrderId, 'verified'), 'confirmed')
    const after = await listing(reviewListing)
    assert.equal(after.quantity_held, before.quantity_held - 2)
    assert.equal(after.quantity_sold, before.quantity_sold + 2)
    assert.equal(await setStatus(reviewOrderId, 'processing'), 'already', 'later stages do not double count')
    assert.equal((await listing(reviewListing)).quantity_sold, after.quantity_sold)
  })

  await test('cancellation of a confirmed order requires explicit restock', async () => {
    assert.equal(await setStatus(reviewOrderId, 'cancelled'), 'awaiting_restock')
    const l = await listing(reviewListing)
    assert.equal(l.quantity_sold, 2, 'tickets stay sold until restocked')
    const hold = await pool.query<{ id: number }>(`SELECT id FROM seat_holds WHERE order_id = $1`, [reviewOrderId])
    await restockHold(pool, { holdId: hold.rows[0].id, actor: ADMIN, note: 'test restock' })
    assert.equal((await listing(reviewListing)).quantity_sold, 0)
    await expectError(() => restockHold(pool, { holdId: hold.rows[0].id, actor: ADMIN }), /Only cancelled confirmed/)
  })

  await test('cancelling an unconfirmed order releases its tickets immediately', async () => {
    const id = await saveListing(pool, listingInput(eventA, 'A', 3, 4500, { rowLabel: 'CAN' }), ADMIN)
    const r = await reserveSeats(pool, { userId: `u-can-${RUN}`, listingId: id, quantity: 3 })
    const order = await submitHoldOrder(pool, { token: r.token, userId: `u-can-${RUN}`, details: details(eventA) })
    assert.equal((await listing(id)).quantity_held, 3)
    assert.equal(await setStatus(order.orderId, 'cancelled'), 'released')
    assert.equal((await listing(id)).quantity_held, 0)
  })

  await test('payment-review expiry releases inventory, keeps order Pending and flagged', async () => {
    const id = await saveListing(pool, listingInput(eventA, 'A', 2, 4600, { rowLabel: 'REV' }), ADMIN)
    const r = await reserveSeats(pool, { userId: `u-rev-${RUN}`, listingId: id, quantity: 2 })
    const order = await submitHoldOrder(pool, { token: r.token, userId: `u-rev-${RUN}`, details: details(eventA) })
    await pool.query(`UPDATE seat_holds SET expires_at = now() - interval '1 second' WHERE token = $1`, [r.token])
    await sweepExpiredHolds(pool, { listingId: id })
    const h = await holdState(r.token)
    assert.equal(h.state, 'review_expired')
    assert.equal(h.counts_as, 'none')
    assert.equal((await listing(id)).quantity_held, 0)
    const o = await pool.query(`SELECT status FROM orders WHERE id = $1`, [order.orderId])
    assert.equal(o.rows[0].status, 'pending')

    // Tickets went back on sale and were bought: the stale order can't be confirmed.
    const other = await reserveSeats(pool, { userId: `u-rev2-${RUN}`, listingId: id, quantity: 2 })
    await expectError(() => setStatus(order.orderId, 'verified'), /not enough inventory/)
    await releaseCheckoutHold(pool, { token: other.token, userId: `u-rev2-${RUN}` })
    // Once available again it can be reacquired and confirmed.
    assert.equal(await setStatus(order.orderId, 'verified'), 'confirmed')
    assert.equal((await listing(id)).quantity_sold, 2)
    await setStatus(order.orderId, 'cancelled')
    const hold = await pool.query<{ id: number }>(`SELECT id FROM seat_holds WHERE order_id = $1`, [order.orderId])
    await restockHold(pool, { holdId: hold.rows[0].id, actor: ADMIN })
  })

  await test('HTB isolation: database rejects seat maps and listings on Help-to-Buy events', async () => {
    await expectError(() => assignEventMap(pool, { eventId: eventHtb, mapId: mapOne, enabled: true }), /only be used for Resale/)
    await expectError(() => saveListing(pool, listingInput(eventHtb, 'A', 1, 100), ADMIN), /only be used for Resale/)
    // Direct SQL bypassing the app is also blocked by the trigger.
    await expectError(
      () => pool.query(`INSERT INTO seat_listings (event_id, section_code, quantity_total, price) VALUES ($1, 'A', 1, 100)`, [eventHtb]),
      /only available for resale/,
    )
    // HTB-conversion guard used by the events action: blocked while inventory exists.
    const blocked = await pool.query(
      `SELECT (not exists (select 1 from event_seat_maps where event_id = $1)
               and not exists (select 1 from seat_listings where event_id = $1)) AS can_convert`,
      [eventA],
    )
    assert.equal(blocked.rows[0].can_convert, false)
    assert.equal(await getPublicSeatMap(pool, eventHtb), null)
  })

  await test('existing checkout compatibility: events without an enabled map are untouched', async () => {
    assert.equal(await getPublicSeatMap(pool, eventLegacy), null)
    await assignEventMap(pool, { eventId: eventB, mapId: mapTwo, enabled: false })
    assert.equal(await getPublicSeatMap(pool, eventB), null, 'disabled map falls back to existing checkout')
    const bListing = (await listListings(pool, eventB))[0]
    await expectError(() => reserveSeats(pool, { userId: `u-dis-${RUN}`, listingId: bListing.id, quantity: 1 }), /no longer available/)
    // A regular order with no seat hold: status changes don't touch seat inventory.
    const legacy = await pool.query<{ id: number }>(
      `INSERT INTO orders (reference, event_id, event_title, service_type, dates, account_email, holder_name, contact_number, status)
       VALUES ($1, $2, '[TEST] legacy', 'resale', '[]', 'x@example.com', 'Legacy', '0917', 'pending') RETURNING id`,
      [`NP-T${RUN.slice(-5).toUpperCase()}`, eventLegacy],
    )
    assert.equal(await setStatus(legacy.rows[0].id, 'verified'), 'none')
    assert.equal(await setStatus(legacy.rows[0].id, 'cancelled'), 'none')
  })

  await test('audit log is append-only and records every movement', async () => {
    await expectError(() => pool.query(`DELETE FROM seat_inventory_log WHERE listing_id = $1`, [reviewListing]), /append-only/)
    const actions = await pool.query<{ action: string }>(
      `SELECT DISTINCT action FROM seat_inventory_log WHERE listing_id = $1`,
      [reviewListing],
    )
    const set = new Set(actions.rows.map((r) => r.action))
    for (const a of ['reserve', 'submit', 'confirm', 'cancel_sold', 'restock', 'admin_adjust']) assert.ok(set.has(a), `missing ${a}`)
    const drift = await pool.query(
      `SELECT l.id FROM seat_listings l
       WHERE l.event_id = ANY($1::int[]) AND (
         l.quantity_held <> coalesce((SELECT sum(quantity) FROM seat_holds h WHERE h.listing_id = l.id AND h.counts_as = 'held'), 0)
         OR l.quantity_sold <> coalesce((SELECT sum(quantity) FROM seat_holds h WHERE h.listing_id = l.id AND h.counts_as = 'sold'), 0))`,
      [[eventA, eventB, eventC]],
    )
    assert.equal(drift.rowCount, 0, 'listing counters match holds exactly')
  })

  // Cleanup: hide test events and listings, release anything still held, cancel test orders.
  await sweepExpiredHolds(pool)
  await pool.query(
    `UPDATE seat_holds SET expires_at = now() - interval '1 second'
     WHERE state = 'checkout' AND listing_id IN (SELECT id FROM seat_listings WHERE event_id = ANY($1::int[]))`,
    [[eventA, eventB, eventC]],
  )
  await sweepExpiredHolds(pool)
  await pool.query(`UPDATE seat_listings SET status = 'hidden' WHERE event_id = ANY($1::int[])`, [[eventA, eventB, eventC]])
  await pool.query(`UPDATE event_seat_maps SET enabled = false WHERE event_id = ANY($1::int[])`, [[eventA, eventB, eventC]])
  await pool.query(`UPDATE events SET hidden = true WHERE id = ANY($1::int[])`, [[eventA, eventB, eventC, eventLegacy, eventHtb]])
  await pool.query(`UPDATE orders SET status = 'cancelled' WHERE event_id = ANY($1::int[]) AND status <> 'cancelled'`, [
    [eventA, eventB, eventC, eventLegacy],
  ])
}

function listingInput(
  eventId: number,
  sectionCode: string,
  quantityTotal: number,
  price: number,
  extra: Partial<Parameters<typeof saveListing>[1]> = {},
): Parameters<typeof saveListing>[1] {
  return {
    eventId,
    eventDateId: null,
    sectionCode,
    rowLabel: null,
    seats: null,
    quantityTotal,
    maxPerOrder: 10,
    price,
    originalPrice: null,
    seatedTogether: true,
    viewNote: null,
    featured: false,
    status: 'available',
    ...extra,
  }
}

main()
  .catch((error) => {
    console.error('Suite aborted:', error)
    results.push({ name: 'suite', ok: false, error: String(error) })
  })
  .finally(async () => {
    await pool.end()
    const failed = results.filter((r) => !r.ok)
    console.log(`\n${results.length - failed.length} passed, ${failed.length} failed`)
    process.exit(failed.length ? 1 : 0)
  })
