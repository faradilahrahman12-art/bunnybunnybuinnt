'use server'

import { desc } from 'drizzle-orm'
import { db, pool } from '@/lib/db'
import { requestReserve } from '@/lib/db/schema'
import { isAdmin } from '@/lib/admin-auth'

let ensured = false
async function ensureRequestReserveTable() {
  if (ensured) return
  await pool.query(`
    CREATE TABLE IF NOT EXISTS request_reserve (
      id serial PRIMARY KEY,
      service_type text NOT NULL,
      artist text NOT NULL,
      tour_name text,
      country text,
      concert_dates text,
      tickets_needed integer NOT NULL DEFAULT 2,
      section text,
      budget text,
      telegram text,
      email text,
      notes text,
      status text NOT NULL DEFAULT 'new',
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `)
  ensured = true
}

export type SubmitRequestInput = {
  serviceType: 'ticket_purchase' | 'transfer' | 'other'
  artist: string
  tourName: string
  country: string
  concertDates: string
  ticketsNeeded: number
  section: string
  budget: string
  telegram: string
  email: string
  notes: string
}

export async function submitRequestReserve(input: SubmitRequestInput) {
  if (!input.artist.trim()) {
    return { error: 'Please tell us which artist or group you are targeting.' }
  }
  if (!input.telegram.trim() && !input.email.trim()) {
    return { error: 'Please share a Telegram handle or email so we can follow up.' }
  }

  const qty = Number.isFinite(input.ticketsNeeded)
    ? Math.min(Math.max(Math.floor(input.ticketsNeeded), 1), 20)
    : 2

  await ensureRequestReserveTable()

  await db.insert(requestReserve).values({
    serviceType: input.serviceType,
    artist: input.artist.trim(),
    tourName: input.tourName.trim() || null,
    country: input.country.trim() || null,
    concertDates: input.concertDates.trim() || null,
    ticketsNeeded: qty,
    section: input.section.trim() || null,
    budget: input.budget.trim() || null,
    telegram: input.telegram.trim() || null,
    email: input.email.trim() || null,
    notes: input.notes.trim() || null,
  })

  return { success: true }
}

export async function getAllRequestReserve() {
  if (!(await isAdmin())) throw new Error('Unauthorized')
  await ensureRequestReserveTable()
  return db.select().from(requestReserve).orderBy(desc(requestReserve.createdAt))
}
