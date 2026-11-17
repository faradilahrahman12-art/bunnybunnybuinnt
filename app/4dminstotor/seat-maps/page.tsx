import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { AdminLogin } from '@/components/admin/admin-login'
import { SeatMapAdmin } from '@/components/admin/seat-map/seat-map-admin'
import { getSeatMapEditorAccount, isPreviewLoginBypassed } from '@/lib/admin-auth'
import { pool } from '@/lib/db'
import { listResaleEvents, listVenueMaps } from '@/lib/seat-map/catalog'
import { sweepExpiredHolds } from '@/lib/seat-map/inventory'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Seat Maps — Bunnyticket Admin',
  robots: { index: false, follow: false },
}

export default async function SeatMapAdminPage() {
  const account = await getSeatMapEditorAccount()
  if (!account) return <AdminLogin />

  await sweepExpiredHolds(pool)
  const [maps, events] = await Promise.all([listVenueMaps(pool), listResaleEvents(pool)])

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
      </header>
      {account.username === 'preview' && isPreviewLoginBypassed() && (
        <p role="status" className="rounded-lg border border-border bg-muted px-4 py-3 text-sm text-muted-foreground">
          Preview test mode: admin login is skipped here. The live website still requires signing in.
        </p>
      )}
      <SeatMapAdmin maps={maps} events={events} />
    </main>
  )
}
