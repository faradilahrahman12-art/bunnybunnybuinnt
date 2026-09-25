'use server'

import { sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { siteSettings } from '@/lib/db/schema'
import { isAdmin } from '@/lib/admin-auth'
import {
  mergeSubmitContent,
  SUBMIT_CONTENT_KEY,
  type SubmitContent,
} from '@/lib/submit-content'

async function assertAdmin() {
  if (!(await isAdmin())) throw new Error('Unauthorized')
}

export async function updateSubmitContent(content: SubmitContent) {
  await assertAdmin()
  // Normalize/merge to guarantee a well-formed blob regardless of client input.
  const clean = mergeSubmitContent(content)
  await db
    .insert(siteSettings)
    .values({ key: SUBMIT_CONTENT_KEY, value: clean, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: siteSettings.key,
      set: { value: clean, updatedAt: new Date() },
    })
  revalidatePath('/submit')
  revalidatePath('/terms')
  revalidatePath('/4dminstotor')
  return { success: true }
}

export async function resetSubmitContent() {
  await assertAdmin()
  await db.delete(siteSettings).where(sql`${siteSettings.key} = ${SUBMIT_CONTENT_KEY}`)
  revalidatePath('/submit')
  revalidatePath('/terms')
  revalidatePath('/4dminstotor')
  return { success: true }
}
