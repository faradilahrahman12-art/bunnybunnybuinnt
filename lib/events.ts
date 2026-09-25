import 'server-only'
import { asc, inArray } from 'drizzle-orm'
import { db } from '@/lib/db'
import {
  events,
  eventDates,
  dateSections,
  type EventWithSchedule,
  type ScheduleDate,
} from '@/lib/db/schema'

export async function getAllEvents(): Promise<EventWithSchedule[]> {
  const rows = await db.select().from(events).orderBy(asc(events.sortOrder), asc(events.id))
  if (rows.length === 0) return []

  const eventIds = rows.map((e) => e.id)
  const dateRows = await db
    .select()
    .from(eventDates)
    .where(inArray(eventDates.eventId, eventIds))
    .orderBy(asc(eventDates.sortOrder), asc(eventDates.id))

  const dateIds = dateRows.map((d) => d.id)
  const sectionRows = dateIds.length
    ? await db
        .select()
        .from(dateSections)
        .where(inArray(dateSections.dateId, dateIds))
        .orderBy(asc(dateSections.sortOrder), asc(dateSections.id))
    : []

  const sectionsByDate = new Map<number, typeof sectionRows>()
  for (const s of sectionRows) {
    const arr = sectionsByDate.get(s.dateId) ?? []
    arr.push(s)
    sectionsByDate.set(s.dateId, arr)
  }

  const scheduleByEvent = new Map<number, ScheduleDate[]>()
  for (const d of dateRows) {
    const arr = scheduleByEvent.get(d.eventId) ?? []
    arr.push({ ...d, sections: sectionsByDate.get(d.id) ?? [] })
    scheduleByEvent.set(d.eventId, arr)
  }

  return rows.map((e) => ({ ...e, schedule: scheduleByEvent.get(e.id) ?? [] }))
}

export async function getEventsByType(type: 'resale' | 'help_to_buy') {
  const all = await getAllEvents()
  return all.filter((e) => e.type === type && !e.hidden)
}

export async function getEventById(id: number): Promise<EventWithSchedule | null> {
  if (!Number.isFinite(id)) return null
  const all = await getAllEvents()
  return all.find((e) => e.id === id) ?? null
}
