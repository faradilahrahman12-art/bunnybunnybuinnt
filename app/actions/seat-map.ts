'use server'

import { randomUUID } from 'node:crypto'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { del, put } from '@vercel/blob'
import { auth } from '@/lib/auth'
import { pool } from '@/lib/db'
import { getAdminAccount } from '@/lib/admin-auth'
import { isUserBlocked } from '@/lib/user-block'
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

function fail(error: unknown): { ok: false; error: string } {
  if (error instanceof SeatMapError) return { ok: false, error: error.message }
  console.error('Seat map action failed', error)
  return { ok: false, error: 'Something went wrong. Please try again.' }
}

async function requireAdminActor() {
  const account = await getAdminAccount()
  if (!account) throw new SeatMapError('Your admin session has expired. Please sign in again.', 'unauthorized')
  return `admin:${account.username}`
}

async function requireCustomerId() {
  const session = await auth.api.getSession({ headers: await headers() })
  const userId = session?.user?.id
  if (!userId) throw new SeatMapError('Please sign in to reserve tickets.', 'unauthenticated')
  if (await isUserBlocked(userId)) throw new SeatMapError('Your account cannot place orders.', 'blocked')
  return userId
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
}): Promise<Result<{ token: string; eventId: number }>> {
  try {
    const userId = await requireCustomerId()
    const reservation = await reserveSeats(pool, { userId, listingId: input.listingId, quantity: input.quantity })
    return { ok: true, data: { token: reservation.token, eventId: reservation.eventId } }
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
}): Promise<Result<{ reference: string }>> {
  try {
    const userId = await requireCustomerId()
    const result = await submitHoldOrder(pool, { token: input.token, userId, details: input.details })
    revalidatePath('/orders')
    return { ok: true, data: { reference: result.reference } }
  } catch (error) {
    return fail(error)
  }
}
