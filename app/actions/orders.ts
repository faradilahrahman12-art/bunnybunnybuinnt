'use server'

import { and, desc, eq, isNull, sql } from 'drizzle-orm'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { db, pool } from '@/lib/db'
import { orders } from '@/lib/db/schema'
import { isAdmin } from '@/lib/admin-auth'
import { ADMIN_STATUS_OPTIONS } from '@/lib/order-status'

let ensured = false
async function ensureOrdersTable() {
  if (ensured) return
  await pool.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id serial PRIMARY KEY,
      reference text NOT NULL UNIQUE,
      event_id integer,
      event_title text NOT NULL,
      service_type text NOT NULL,
      country text,
      dates text NOT NULL,
      quantity_per_date integer NOT NULL DEFAULT 1,
      sections text,
      total_amount numeric(10,2),
      account_email text NOT NULL,
      account_password text,
      holder_name text NOT NULL,
      holder_dob text,
      contact_number text NOT NULL,
      telegram text,
      instagram text,
      memberships text,
      payment_method text,
      payment_reference text,
      amount_sent numeric(10,2),
      status text NOT NULL DEFAULT 'pending',
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `)
  // Columns added after the table's first version — safe to run every time.
  await pool.query(`
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_merchant text;
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS date_paid text;
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS time_paid text;
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS screenshots text;
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS service_tier text;
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_id text;
  `)
  ensured = true
}

async function getSessionUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  return session?.user?.id ?? null
}

export type SubmitOrderInput = {
  eventId: number | null
  eventTitle: string
  serviceType: 'resale' | 'help_to_buy'
  serviceTier: 'manual' | 'premium_bots' | null
  country: string | null
  dates: string[]
  quantityPerDate: number
  sections: Record<string, { priority: string; backup?: string }>
  totalAmount: number | null
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
}

function makeReference() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let s = ''
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)]
  return `NP-${s}`
}

export async function submitOrder(input: SubmitOrderInput) {
  const userId = await getSessionUserId()
  if (!userId) return { error: 'Please sign in to place an order.' }

  if (!input.accountEmail.trim() || !input.holderName.trim() || !input.contactNumber.trim()) {
    return { error: 'Missing required order details.' }
  }
  if (!Array.isArray(input.dates) || input.dates.length === 0) {
    return { error: 'Please select at least one concert date.' }
  }
  const qty = Number.isFinite(input.quantityPerDate)
    ? Math.min(Math.max(Math.floor(input.quantityPerDate), 1), 10)
    : 1

  await ensureOrdersTable()

  const reference = makeReference()
  await db.insert(orders).values({
    reference,
    userId,
    eventId: input.eventId,
    eventTitle: input.eventTitle,
    serviceType: input.serviceType,
    serviceTier: input.serviceTier,
    country: input.country,
    dates: JSON.stringify(input.dates),
    quantityPerDate: qty,
    sections: JSON.stringify(input.sections ?? {}),
    totalAmount: input.totalAmount ?? null,
    accountEmail: input.accountEmail.trim(),
    accountPassword: input.accountPassword,
    holderName: input.holderName.trim(),
    holderDob: input.holderDob,
    contactNumber: input.contactNumber.trim(),
    telegram: input.telegram?.trim() || null,
    instagram: input.instagram?.trim() || null,
    memberships: JSON.stringify(input.memberships ?? []),
    paymentMethod: input.paymentMethod,
    paymentMerchant: input.paymentMerchant?.trim() || null,
    paymentReference: input.paymentReference?.trim() || null,
    datePaid: input.datePaid?.trim() || null,
    timePaid: input.timePaid?.trim() || null,
    amountSent: input.amountSent ?? null,
    screenshots: JSON.stringify(Array.isArray(input.screenshots) ? input.screenshots : []),
  })

  return { success: true, reference }
}

export type TrackedOrder = {
  reference: string
  status: string
  createdAt: string
  eventTitle: string
  eventId: number | null
  serviceType: 'resale' | 'help_to_buy'
  serviceTier: 'manual' | 'premium_bots' | null
  country: string | null
  dates: string[]
  quantityPerDate: number
  sections: Record<string, { priority?: string; backup?: string; quantity?: number }>
  totalAmount: number | null
  accountEmail: string
  hasPassword: boolean
  holderName: string
  holderDob: string | null
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
}

function safeParse<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback
  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

export async function getOrderByReference(
  reference: string,
): Promise<{ order?: TrackedOrder; error?: string }> {
  const ref = reference.trim().toUpperCase()
  if (!ref) return { error: 'Please enter your order reference.' }

  await ensureOrdersTable()

  const rows = await db.select().from(orders).where(eq(orders.reference, ref)).limit(1)
  const row = rows[0]
  if (!row) {
    return { error: 'No order found with that reference number. Please double-check and try again.' }
  }

  return { order: mapOrderRow(row) }
}

function mapOrderRow(row: typeof orders.$inferSelect): TrackedOrder {
  const screenshots = safeParse<string[]>(row.screenshots, [])
  return {
    reference: row.reference,
    status: row.status,
    createdAt: (row.createdAt instanceof Date ? row.createdAt : new Date(row.createdAt)).toISOString(),
    eventTitle: row.eventTitle,
    eventId: row.eventId ?? null,
    serviceType: row.serviceType as 'resale' | 'help_to_buy',
    serviceTier: (row.serviceTier as 'manual' | 'premium_bots' | null) ?? null,
    country: row.country,
    dates: safeParse<string[]>(row.dates, []),
    quantityPerDate: row.quantityPerDate,
    sections: safeParse(row.sections, {}),
    totalAmount: row.totalAmount ?? null,
    accountEmail: row.accountEmail,
    hasPassword: Boolean(row.accountPassword),
    holderName: row.holderName,
    holderDob: row.holderDob ?? null,
    contactNumber: row.contactNumber,
    telegram: row.telegram ?? null,
    instagram: row.instagram ?? null,
    memberships: safeParse<string[]>(row.memberships, []),
    paymentMethod: row.paymentMethod ?? null,
    paymentMerchant: row.paymentMerchant ?? null,
    paymentReference: row.paymentReference ?? null,
    datePaid: row.datePaid ?? null,
    timePaid: row.timePaid ?? null,
    amountSent: row.amountSent ?? null,
    screenshots: Array.isArray(screenshots) ? screenshots : [],
  }
}

// Orders belonging to the signed-in customer — powers the "My Orders" dashboard.
export async function getMyOrders(): Promise<TrackedOrder[]> {
  const userId = await getSessionUserId()
  if (!userId) throw new Error('Unauthorized')

  await ensureOrdersTable()

  const rows = await db
    .select()
    .from(orders)
    .where(eq(orders.userId, userId))
    .orderBy(desc(orders.createdAt))

  return rows.map(mapOrderRow)
}

// Attach an order placed before accounts existed. Requires both the reference and the
// email on the order, and only works for orders not already linked to an account.
export async function claimOrder(
  reference: string,
  email: string,
): Promise<{ success?: true; error?: string }> {
  const userId = await getSessionUserId()
  if (!userId) return { error: 'Please sign in first.' }

  const ref = reference.trim().toUpperCase()
  const value = email.trim().toLowerCase()
  if (!ref || !value.includes('@')) {
    return { error: 'Enter your order reference and the email used on the order.' }
  }

  await ensureOrdersTable()

  const linked = await db
    .update(orders)
    .set({ userId })
    .where(
      and(
        eq(orders.reference, ref),
        sql`lower(${orders.accountEmail}) = ${value}`,
        isNull(orders.userId),
      ),
    )
    .returning({ reference: orders.reference })

  if (linked.length === 0) {
    return { error: 'We couldn’t match that order. Check the reference and email, or it may already be linked.' }
  }
  return { success: true }
}

// Admin: full order list for the management dashboard.
export async function getAllOrders(): Promise<TrackedOrder[]> {
  if (!(await isAdmin())) throw new Error('Unauthorized')
  await ensureOrdersTable()
  const rows = await db.select().from(orders).orderBy(desc(orders.createdAt))
  return rows.map(mapOrderRow)
}

// Admin: advance an order through the Submitted → Confirmed → In Progress → Complete pipeline.
export async function updateOrderStatus(reference: string, status: string) {
  if (!(await isAdmin())) throw new Error('Unauthorized')
  const allowed = ADMIN_STATUS_OPTIONS.map((o) => o.value)
  if (!allowed.includes(status)) return { error: 'Invalid status.' }

  await ensureOrdersTable()
  await db.update(orders).set({ status }).where(eq(orders.reference, reference.trim().toUpperCase()))
  return { success: true }
}
