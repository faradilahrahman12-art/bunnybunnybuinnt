import 'server-only'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { siteSettings } from '@/lib/db/schema'
import {
  DEFAULT_SUBMIT_CONTENT,
  mergeSubmitContent,
  SUBMIT_CONTENT_KEY,
  type SubmitContent,
} from '@/lib/submit-content'

export async function getSubmitContent(): Promise<SubmitContent> {
  try {
    const [row] = await db
      .select({ value: siteSettings.value })
      .from(siteSettings)
      .where(eq(siteSettings.key, SUBMIT_CONTENT_KEY))
      .limit(1)
    if (!row) return DEFAULT_SUBMIT_CONTENT
    return mergeSubmitContent(row.value)
  } catch {
    // If the table/row isn't available yet, fall back to defaults so the page still renders.
    return DEFAULT_SUBMIT_CONTENT
  }
}
