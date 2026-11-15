import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { AdminLogin } from '@/components/admin/admin-login'
import { SeatMapAdmin } from '@/components/admin/seat-map/seat-map-admin'
import { getAdminAccount } from '@/lib/admin-auth'

export const metadata = {
  title: 'Seat Maps — Bunnyticket Admin',
  robots: { index: false, follow: false },
}

export default async function SeatMapAdminPage() {
  if (process.env.VERCEL_ENV === 'production') notFound()

  const account = await getAdminAccount()
  if (!account) return <AdminLogin />

  return (
    <main className="mx-auto flex w-full max-w-[1500px] flex-col gap-6 px-4 py-6 md:px-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1">
          <Link
            href="/4dminstotor"
            className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Admin dashboard
          </Link>
          <h1 className="text-2xl font-bold md:text-3xl">Interactive seat maps</h1>
          <p className="text-sm text-muted-foreground">
            Manage venue layouts, clickable sections, ticket inventory and per-event settings.
          </p>
        </div>
        <p className="rounded-full border border-dashed px-3 py-1 text-xs text-muted-foreground">
          Mock data. Changes reset on reload and are not saved to the database.
        </p>
      </header>
      <SeatMapAdmin />
    </main>
  )
}
