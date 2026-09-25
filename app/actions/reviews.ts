'use server'

import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { reviews } from '@/lib/db/schema'
import { isAdmin } from '@/lib/admin-auth'
import { ensureReviewsTable } from '@/lib/reviews'

async function assertAdmin() {
  if (!(await isAdmin())) throw new Error('Unauthorized')
}

export type ReviewInput = {
  name: string
  event: string
  text: string
  images: string[]
  hidden: boolean
  sortOrder: number
}

function normalize(input: ReviewInput) {
  return {
    name: input.name.trim(),
    event: input.event.trim() || null,
    text: input.text.trim(),
    images: Array.isArray(input.images) ? input.images.filter((i) => typeof i === 'string' && i.trim()) : [],
    hidden: Boolean(input.hidden),
    sortOrder: Number.isFinite(input.sortOrder) ? Math.floor(input.sortOrder) : 0,
  }
}

function revalidate() {
  revalidatePath('/4dminstotor')
  revalidatePath('/reviews')
  revalidatePath('/')
}

export async function createReview(input: ReviewInput) {
  await assertAdmin()
  await ensureReviewsTable()
  if (!input.name.trim()) throw new Error('Name is required')
  if (!input.text.trim()) throw new Error('Review text is required')
  await db.insert(reviews).values(normalize(input))
  revalidate()
}

export async function updateReview(id: number, input: ReviewInput) {
  await assertAdmin()
  await ensureReviewsTable()
  if (!input.name.trim()) throw new Error('Name is required')
  if (!input.text.trim()) throw new Error('Review text is required')
  await db.update(reviews).set(normalize(input)).where(eq(reviews.id, id))
  revalidate()
}

export async function deleteReview(id: number) {
  await assertAdmin()
  await ensureReviewsTable()
  await db.delete(reviews).where(eq(reviews.id, id))
  revalidate()
}
