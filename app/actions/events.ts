'use server'

import { eq, inArray } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { events, eventDates, dateSections } from '@/lib/db/schema'
import { isAdmin, signInAdmin, signOutAdmin } from '@/lib/admin-auth'

async function assertAdmin() {
  if (!(await isAdmin())) throw new Error('Unauthorized')
}

export type SectionInput = { name: string; quantity: number; price: number }
export type ScheduleDateInput = { label: string; sections: SectionInput[] }

export type EventInput = {
  type: 'resale' | 'help_to_buy'
  title: string
  country: string
  platform: string
  saleInfo: string
  imageUrl: string
  seatMapUrl: string
  hidden: boolean
  sortOrder: number
  schedule: ScheduleDateInput[]
}

function normalizeEvent(input: EventInput) {
  const cleanSchedule = cleanSchedule_(input.schedule)
  return {
    type: input.type,
    title: input.title.trim(),
    country: input.country.trim(),
    // keep the flat text column in sync for a quick summary / fallback
    dates: cleanSchedule.length ? cleanSchedule.map((d) => d.label).join(' · ') : null,
    platform: input.platform.trim() || null,
    saleInfo: input.saleInfo.trim() || null,
    imageUrl: input.imageUrl.trim() || null,
    seatMapUrl: input.seatMapUrl.trim() || null,
    hidden: Boolean(input.hidden),
    sortOrder: Number.isFinite(input.sortOrder) ? input.sortOrder : 0,
  }
}

function cleanSchedule_(schedule: ScheduleDateInput[]) {
  return (schedule ?? [])
    .map((d) => ({
      label: d.label.trim(),
      sections: (d.sections ?? [])
        .map((s) => ({
          name: s.name.trim(),
          quantity: Number.isFinite(s.quantity) && s.quantity > 0 ? Math.floor(s.quantity) : 0,
          price: Number.isFinite(s.price) && s.price > 0 ? Math.round(s.price * 100) / 100 : 0,
        }))
        .filter((s) => s.name.length > 0),
    }))
    .filter((d) => d.label.length > 0)
}

async function replaceSchedule(eventId: number, schedule: ScheduleDateInput[]) {
  const existingDates = await db
    .select({ id: eventDates.id })
    .from(eventDates)
    .where(eq(eventDates.eventId, eventId))
  const existingIds = existingDates.map((d) => d.id)
  if (existingIds.length) {
    await db.delete(dateSections).where(inArray(dateSections.dateId, existingIds))
    await db.delete(eventDates).where(eq(eventDates.eventId, eventId))
  }

  const clean = cleanSchedule_(schedule)
  for (let i = 0; i < clean.length; i++) {
    const d = clean[i]
    const [inserted] = await db
      .insert(eventDates)
      .values({ eventId, label: d.label, sortOrder: i })
      .returning({ id: eventDates.id })
    if (d.sections.length) {
      await db.insert(dateSections).values(
        d.sections.map((s, j) => ({
          dateId: inserted.id,
          name: s.name,
          quantity: s.quantity,
          price: s.price,
          sortOrder: j,
        })),
      )
    }
  }
}

export async function createEvent(input: EventInput) {
  await assertAdmin()
  if (!input.title.trim() || !input.country.trim()) {
    throw new Error('Title and country are required')
  }
  const [inserted] = await db
    .insert(events)
    .values(normalizeEvent(input))
    .returning({ id: events.id })
  await replaceSchedule(inserted.id, input.schedule)
  revalidatePath('/')
    revalidatePath('/4dminstotor')
}

export async function updateEvent(id: number, input: EventInput) {
  await assertAdmin()
  if (!input.title.trim() || !input.country.trim()) {
    throw new Error('Title and country are required')
  }
  await db.update(events).set(normalizeEvent(input)).where(eq(events.id, id))
  await replaceSchedule(id, input.schedule)
  revalidatePath('/')
    revalidatePath('/4dminstotor')
}

export async function reorderEvents(orderedIds: number[]) {
  await assertAdmin()
  const ids = orderedIds.filter((id) => Number.isFinite(id))
  for (let i = 0; i < ids.length; i++) {
    await db.update(events).set({ sortOrder: i }).where(eq(events.id, ids[i]))
  }
  revalidatePath('/')
  revalidatePath('/4dminstotor')
}

export async function setEventHidden(id: number, hidden: boolean) {
  await assertAdmin()
  await db.update(events).set({ hidden }).where(eq(events.id, id))
  revalidatePath('/')
    revalidatePath('/4dminstotor')
}

export async function deleteEvent(id: number) {
  await assertAdmin()
  const existingDates = await db
    .select({ id: eventDates.id })
    .from(eventDates)
    .where(eq(eventDates.eventId, id))
  const dateIds = existingDates.map((d) => d.id)
  if (dateIds.length) {
    await db.delete(dateSections).where(inArray(dateSections.dateId, dateIds))
    await db.delete(eventDates).where(eq(eventDates.eventId, id))
  }
  await db.delete(events).where(eq(events.id, id))
  revalidatePath('/')
    revalidatePath('/4dminstotor')
}

export async function loginAdmin(username: string, password: string) {
  const account = await signInAdmin(username, password)
  if (!account) return { error: 'Incorrect username or password' }
    revalidatePath('/4dminstotor')
  return { success: true }
}

export async function logoutAdmin() {
  await signOutAdmin()
    revalidatePath('/4dminstotor')
}
