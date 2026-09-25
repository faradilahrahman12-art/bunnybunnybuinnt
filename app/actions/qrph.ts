'use server'

import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { qrphMerchants } from '@/lib/db/schema'
import { isAdmin } from '@/lib/admin-auth'
import { ensureQrphTable } from '@/lib/qrph'

async function assertAdmin() {
  if (!(await isAdmin())) throw new Error('Unauthorized')
}

export type QrphMerchantInput = {
  name: string
  qrImageUrl: string
  active: boolean
  sortOrder: number
}

function normalize(input: QrphMerchantInput) {
  return {
    name: input.name.trim(),
    qrImageUrl: input.qrImageUrl.trim() || null,
    active: Boolean(input.active),
    sortOrder: Number.isFinite(input.sortOrder) ? Math.floor(input.sortOrder) : 0,
  }
}

export async function createQrphMerchant(input: QrphMerchantInput) {
  await assertAdmin()
  await ensureQrphTable()
  if (!input.name.trim()) throw new Error('Merchant name is required')
  await db.insert(qrphMerchants).values(normalize(input))
  revalidatePath('/4dminstotor')
  revalidatePath('/submit')
}

export async function updateQrphMerchant(id: number, input: QrphMerchantInput) {
  await assertAdmin()
  await ensureQrphTable()
  if (!input.name.trim()) throw new Error('Merchant name is required')
  await db.update(qrphMerchants).set(normalize(input)).where(eq(qrphMerchants.id, id))
  revalidatePath('/4dminstotor')
  revalidatePath('/submit')
}

export async function deleteQrphMerchant(id: number) {
  await assertAdmin()
  await ensureQrphTable()
  await db.delete(qrphMerchants).where(eq(qrphMerchants.id, id))
  revalidatePath('/4dminstotor')
  revalidatePath('/submit')
}
