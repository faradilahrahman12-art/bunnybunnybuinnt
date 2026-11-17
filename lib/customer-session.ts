import 'server-only'

import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { pool } from '@/lib/db'
import { isPreviewLoginBypassed } from '@/lib/admin-auth'

export const PREVIEW_CUSTOMER = {
  id: 'v0-preview-customer',
  name: 'Preview Tester',
  email: 'preview-tester@bunnyticket.invalid',
  emailVerified: true,
} as const

let previewCustomerReady: Promise<void> | null = null

// The dev server only connects to the isolated development database (see lib/db),
// so this placeholder account never exists in Production.
function ensurePreviewCustomer() {
  previewCustomerReady ??= pool
    .query(
      `INSERT INTO "user" (id, name, email, "emailVerified") VALUES ($1, $2, $3, true) ON CONFLICT DO NOTHING`,
      [PREVIEW_CUSTOMER.id, PREVIEW_CUSTOMER.name, PREVIEW_CUSTOMER.email],
    )
    .then(() => undefined)
    .catch((error) => {
      previewCustomerReady = null
      throw error
    })
  return previewCustomerReady
}

export function isPreviewCustomer(user: { id?: string | null } | null | undefined) {
  return isPreviewLoginBypassed() && user?.id === PREVIEW_CUSTOMER.id
}

// A real signed-in session always wins. Without one, only `next dev` (the v0 editor
// preview) falls back to the preview tester; deployed builds still require sign-in.
export async function getCustomerSession() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (session?.user) return session
  if (!isPreviewLoginBypassed()) return null
  await ensurePreviewCustomer()
  return { user: { ...PREVIEW_CUSTOMER } }
}
