import { notFound } from 'next/navigation'
import { CalendarDays, MapPin } from 'lucide-react'
import { SeatMapExplorer } from '@/components/seat-map/seat-map-explorer'
import { MOCK_EVENT, MOCK_LISTINGS, MOCK_VENUE_MAP } from '@/components/seat-map/mock-data'

export const metadata = {
  title: 'Seat Map Preview — Bunnyticket',
  robots: { index: false, follow: false },
}

export default function SeatMapPreviewPage() {
  if (process.env.VERCEL_ENV === 'production') notFound()

  return (
    <main className="mx-auto flex w-full max-w-[1500px] flex-col gap-4 px-4 py-6 md:px-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">Choose your seats</p>
          <h1 className="text-2xl font-bold text-balance md:text-3xl">{MOCK_EVENT.name}</h1>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <CalendarDays className="size-4" aria-hidden="true" />
              {MOCK_EVENT.dateLabel}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="size-4" aria-hidden="true" />
              {MOCK_EVENT.venue}
            </span>
          </div>
        </div>
        <p className="rounded-full border border-dashed px-3 py-1 text-xs text-muted-foreground">
          Preview with sample listings
        </p>
      </header>
      <SeatMapExplorer map={MOCK_VENUE_MAP} listings={MOCK_LISTINGS} />
    </main>
  )
}
