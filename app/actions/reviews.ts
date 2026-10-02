'use server'

import { and, eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { orders, reviews } from '@/lib/db/schema'
import { isComplete } from '@/lib/order-status'
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

export async function submitCustomerReview(input: { reference: string; text: string }) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Please sign in to leave a review')

  const reference = input.reference.trim().toUpperCase()
  const text = input.text.trim()

  if (!reference || !text) throw new Error('Order and review text are required')
  if (text.length > 2000) throw new Error('Review must be 2,000 characters or fewer')

  const [order] = await db
    .select({ reference: orders.reference, status: orders.status, holderName: orders.holderName, eventTitle: orders.eventTitle })
    .from(orders)
    .where(and(eq(orders.reference, reference), eq(orders.userId, session.user.id)))
    .limit(1)

  if (!order || !isComplete(order.status)) throw new Error('Reviews are available after your order is completed')

  await ensureReviewsTable()
  await db.insert(reviews).values({
    name: order.holderName,
    event: order.eventTitle,
    text,
    images: [],
    hidden: false,
    sortOrder: 0,
  })
  revalidate()
}

export async function deleteReview(id: number) {
  await assertAdmin()
  await ensureReviewsTable()
  await db.delete(reviews).where(eq(reviews.id, id))
  revalidate()
}
