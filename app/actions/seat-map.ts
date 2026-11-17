'use server'

import { randomUUID } from 'node:crypto'
import { revalidatePath } from 'next/cache'
import { del, put } from '@vercel/blob'
import { generateText } from 'ai'
import { pool } from '@/lib/db'
import { getSeatMapEditorAccount } from '@/lib/admin-auth'
import { getCustomerSession } from '@/lib/customer-session'
import { isUserBlocked } from '@/lib/user-block'
import { getActiveCheckoutHold, type HoldSummary } from '@/lib/seat-map/inventory'
import { canAccessEvent, isTestEvent, TEST_EVENT_DENIED } from '@/lib/seat-map/test-mode'
import {
  assignEventMap,
  deleteVenueMap,
  duplicateVenueMap,
  listHolds,
  listInventoryLog,
  listListings,
  listResaleEvents,
  listVenueMaps,
  saveListing,
  saveVenueMap,
  type SaveListingInput,
  type SaveVenueMapInput,
} from '@/lib/seat-map/catalog'
import {
  releaseCheckoutHold,
  reserveSeats,
  restockHold,
  SeatMapError,
  submitHoldOrder,
  sweepExpiredHolds,
  type SeatOrderDetails,
} from '@/lib/seat-map/inventory'

type Result<T> = { ok: true; data: T } | { ok: false; error: string }

// Matches the customer edit window used for every other order (app/actions/orders.ts).
const SEAT_ORDER_EDIT_WINDOW_MS = 5 * 60 * 60 * 1000

function fail(error: unknown): { ok: false; error: string } {
  if (error instanceof SeatMapError) return { ok: false, error: error.message }
  console.error('Seat map action failed', error)
  return { ok: false, error: 'Something went wrong. Please try again.' }
}

async function requireAdminActor() {
  const account = await getSeatMapEditorAccount()
  if (!account) throw new SeatMapError('Your admin session has expired. Please sign in again.', 'unauthorized')
  return `admin:${account.username}`
}

async function requireCustomer() {
  const session = await getCustomerSession()
  const user = session?.user
  if (!user?.id) throw new SeatMapError('Please sign in to reserve tickets.', 'unauthenticated')
  if (await isUserBlocked(user.id)) throw new SeatMapError('Your account cannot place orders.', 'blocked')
  return user
}

async function requireCustomerId() {
  return (await requireCustomer()).id
}

async function assertEventAccess(eventId: number | null | undefined, user: Awaited<ReturnType<typeof requireCustomer>>) {
  if (!canAccessEvent(eventId, user)) throw new SeatMapError(TEST_EVENT_DENIED, 'not_found')
}

function refreshSeatMapPaths(eventId?: number) {
  revalidatePath('/4dminstotor/seat-maps')
  if (eventId) revalidatePath(`/resale/${eventId}/seats`)
}

/* ----------------------------- Admin ----------------------------- */

export async function getSeatMapAdminData() {
  try {
    await requireAdminActor()
    await sweepExpiredHolds(pool)
    const [maps, events] = await Promise.all([listVenueMaps(pool), listResaleEvents(pool)])
    return { ok: true as const, data: { maps, events } }
  } catch (error) {
    return fail(error)
  }
}

export async function saveVenueMapAction(input: SaveVenueMapInput): Promise<Result<{ id: number }>> {
  try {
    await requireAdminActor()
    const id = await saveVenueMap(pool, input)
    refreshSeatMapPaths()
    return { ok: true, data: { id } }
  } catch (error) {
    return fail(error)
  }
}

export async function duplicateVenueMapAction(id: number): Promise<Result<{ id: number }>> {
  try {
    await requireAdminActor()
    const newId = await duplicateVenueMap(pool, id)
    refreshSeatMapPaths()
    return { ok: true, data: { id: newId } }
  } catch (error) {
    return fail(error)
  }
}

export async function deleteVenueMapAction(id: number): Promise<Result<null>> {
  try {
    await requireAdminActor()
    const pathname = await deleteVenueMap(pool, id)
    if (pathname) await del(pathname).catch((error) => console.error('Blob delete failed', error))
    refreshSeatMapPaths()
    return { ok: true, data: null }
  } catch (error) {
    return fail(error)
  }
}

const IMAGE_TYPES: Record<string, string> = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' }
const MAX_IMAGE_BYTES = 5 * 1024 * 1024

export async function uploadVenueImageAction(
  formData: FormData,
): Promise<Result<{ url: string; pathname: string }>> {
  try {
    await requireAdminActor()
    const file = formData.get('file')
    if (!(file instanceof File)) throw new SeatMapError('Choose an image to upload.', 'invalid')
    const ext = IMAGE_TYPES[file.type]
    if (!ext) throw new SeatMapError('Upload a PNG, JPG or WebP image.', 'invalid')
    if (file.size > MAX_IMAGE_BYTES) throw new SeatMapError('Images must be 5 MB or smaller.', 'invalid')
    const blob = await put(`seat-maps/${randomUUID()}.${ext}`, file, { access: 'public', contentType: file.type })
    return { ok: true, data: { url: blob.url, pathname: blob.pathname } }
  } catch (error) {
    return fail(error)
  }
}

const MAX_DETECT_DATA_URL = 3_000_000
const LABEL_KINDS = new Set(['seat', 'floor', 'stage'])

export type DetectedLabelRaw = { code: string; kind: 'seat' | 'floor' | 'stage'; x: number; y: number }

/** Reads section numbers and their positions (0–1000 normalized) from a venue map image. */
export async function detectSectionLabelsAction(dataUrl: string): Promise<Result<DetectedLabelRaw[]>> {
  try {
    await requireAdminActor()
    if (typeof dataUrl !== 'string' || !/^data:image\/(png|jpeg|webp);base64,/.test(dataUrl) || dataUrl.length > MAX_DETECT_DATA_URL) {
      throw new SeatMapError('Venue image is missing or too large to analyse.', 'invalid')
    }
    const { text } = await generateText({
      model: 'google/gemini-3-flash',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text:
                'This is a venue seat map. List EVERY labelled area: each numbered seating section (e.g. 216, 403A, 520B), ' +
                'standing/floor areas (e.g. SVIP STANDING, GA), and non-sellable areas (STAGE, CONTROL BOOTH, FOH). ' +
                'For each, give the point at the centre of its label text, normalised so x and y run 0–1000 across the image ' +
                'width and height (0,0 is the top-left corner). ' +
                'kind is "seat" for numbered seating, "floor" for standing/floor areas, "stage" for stage, booths and anything not sold. ' +
                'Use the exact label text for code, uppercase, spaces replaced by dashes. ' +
                'Respond with ONLY a JSON array like [{"code":"216","kind":"seat","x":412,"y":233}] and nothing else.',
            },
            { type: 'file', mediaType: 'image', data: dataUrl },
          ],
        },
      ],
    })
    const json = text.slice(text.indexOf('['), text.lastIndexOf(']') + 1)
    const parsed: unknown = JSON.parse(json || '[]')
    if (!Array.isArray(parsed)) throw new Error('Unexpected label response')
    const labels: DetectedLabelRaw[] = []
    for (const item of parsed.slice(0, 500)) {
      const code = String(item?.code ?? '').toUpperCase().replace(/\s+/g, '-').replace(/[^A-Z0-9_-]/g, '').slice(0, 20)
      const x = Number(item?.x)
      const y = Number(item?.y)
      if (!code || !Number.isFinite(x) || !Number.isFinite(y)) continue
      const kind = LABEL_KINDS.has(item?.kind) ? item.kind : 'seat'
      labels.push({ code, kind, x: Math.min(1000, Math.max(0, x)), y: Math.min(1000, Math.max(0, y)) })
    }
    return { ok: true, data: labels }
  } catch (error) {
    if (error instanceof SeatMapError) return fail(error)
    console.error('Section label detection failed', error)
    return { ok: false, error: 'Could not read section numbers. Shapes will be detected with placeholder names.' }
  }
}

export async function assignEventMapAction(input: {
  eventId: number
  mapId: number | null
  enabled: boolean
}): Promise<Result<null>> {
  try {
    await requireAdminActor()
    await assignEventMap(pool, input)
    refreshSeatMapPaths(input.eventId)
    return { ok: true, data: null }
  } catch (error) {
    return fail(error)
  }
}

export async function getEventInventoryAction(eventId: number) {
  try {
    await requireAdminActor()
    await sweepExpiredHolds(pool, { eventId })
    const [listings, holds, log] = await Promise.all([
      listListings(pool, eventId),
      listHolds(pool, { eventId }),
      listInventoryLog(pool, eventId),
    ])
    return { ok: true as const, data: { listings, holds, log } }
  } catch (error) {
    return fail(error)
  }
}

export async function saveListingAction(input: SaveListingInput): Promise<Result<{ id: number }>> {
  try {
    const actor = await requireAdminActor()
    const id = await saveListing(pool, input, actor)
    refreshSeatMapPaths(input.eventId)
    return { ok: true, data: { id } }
  } catch (error) {
    return fail(error)
  }
}

export async function restockHoldAction(input: { holdId: number; note?: string | null }): Promise<Result<null>> {
  try {
    const actor = await requireAdminActor()
    await restockHold(pool, { holdId: input.holdId, actor, note: input.note ?? null })
    refreshSeatMapPaths()
    return { ok: true, data: null }
  } catch (error) {
    return fail(error)
  }
}

/* ---------------------------- Customer ---------------------------- */

export async function reserveSeatsAction(input: {
  listingId: number
  quantity: number
}): Promise<Result<{ token: string; eventId: number; hold: HoldSummary }>> {
  try {
    const user = await requireCustomer()
    const userId = user.id
    const listingEvent = await pool.query<{ event_id: number }>('SELECT event_id FROM seat_listings WHERE id = $1', [
      input.listingId,
    ])
    const listingEventId = listingEvent.rows[0]?.event_id
    await assertEventAccess(listingEventId, user)
    const reservation = await reserveSeats(pool, {
      userId,
      listingId: input.listingId,
      quantity: input.quantity,
      allowHidden: isTestEvent(listingEventId),
    })
    const hold = await getActiveCheckoutHold(pool, { token: reservation.token, userId })
    if (!hold) throw new SeatMapError('Sorry, these tickets are no longer available.', 'unavailable')
    return { ok: true, data: { token: reservation.token, eventId: reservation.eventId, hold } }
  } catch (error) {
    return fail(error)
  }
}

export async function releaseSeatHoldAction(token: string): Promise<Result<null>> {
  try {
    const userId = await requireCustomerId()
    await releaseCheckoutHold(pool, { token, userId })
    return { ok: true, data: null }
  } catch (error) {
    return fail(error)
  }
}

export async function submitSeatOrderAction(input: {
  token: string
  details: SeatOrderDetails
}): Promise<Result<{ reference: string; editableUntil: string }>> {
  try {
    const user = await requireCustomer()
    const userId = user.id
    const hold = await getActiveCheckoutHold(pool, { token: input.token, userId })
    if (hold) await assertEventAccess(hold.eventId, user)
    const result = await submitHoldOrder(pool, { token: input.token, userId, details: input.details })
    // No revalidatePath here: it would re-render /submit?hold=<converted token>, which redirects to the
    // "hold expired" screen before the confirmation can show. /orders is force-dynamic already.
    const editableUntil = new Date(Date.now() + SEAT_ORDER_EDIT_WINDOW_MS).toISOString()
    return { ok: true, data: { reference: result.reference, editableUntil } }
  } catch (error) {
    return fail(error)
  }
}
