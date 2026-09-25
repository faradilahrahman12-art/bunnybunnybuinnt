import { AdminTab } from '@/components/admin-tab'

// The floating admin quick-access tab is only for the website builder/editor,
// not for public site visitors. It shows in the v0 preview, local dev, and
// Vercel preview deployments, but is hidden on the live production site.
export async function AdminTabGate() {
  const isProduction = process.env.VERCEL_ENV === 'production'
  if (isProduction) return null
  return <AdminTab />
}
