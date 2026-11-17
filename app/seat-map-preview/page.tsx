import { notFound } from 'next/navigation'
import { CalendarDays, MapPin } from 'lucide-react'
import { SeatMapExplorer } from '@/components/seat-map/seat-map-explorer'
import {
  MOCK_ARANETA_EVENT,
  MOCK_ARANETA_LISTINGS,
  MOCK_ARANETA_MAP,
  MOCK_ARENA_EVENT,
  MOCK_ARENA_LISTINGS,
  MOCK_ARENA_MAP,
  MOCK_EVENT,
  MOCK_LISTINGS,
  MOCK_STADIUM_EVENT,
  MOCK_STADIUM_LISTINGS,
  MOCK_STADIUM_MAP,
  MOCK_VENUE_MAP,
} from '@/components/seat-map/mock-data'

export const metadata = {
  title: 'Seat Map Preview — Bunnyticket',
  robots: { index: false, follow: false },
}

export default async function SeatMapPreviewPage({ searchParams }: { searchParams: Promise<{ venue?: string }> }) {
  if (process.env.VERCEL_ENV === 'production') notFound()

  const { venue } = await searchParams
  const preview =
    venue === 'stadium'
      ? { event: MOCK_STADIUM_EVENT, map: MOCK_STADIUM_MAP, listings: MOCK_STADIUM_LISTINGS }
      : venue === 'arena'
        ? { event: MOCK_ARENA_EVENT, map: MOCK_ARENA_MAP, listings: MOCK_ARENA_LISTINGS }
        : venue === 'araneta'
          ? { event: MOCK_ARANETA_EVENT, map: MOCK_ARANETA_MAP, listings: MOCK_ARANETA_LISTINGS }
          : { event: MOCK_EVENT, map: MOCK_VENUE_MAP, listings: MOCK_LISTINGS }
  const { event, map, listings } = preview

  return (
    <main className="mx-auto flex w-full max-w-[1500px] flex-col gap-4 px-4 py-6 md:px-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">Choose your seats</p>
          <h1 className="text-2xl font-bold text-balance md:text-3xl">{event.name}</h1>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <CalendarDays className="size-4" aria-hidden="true" />
              {event.dateLabel}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="size-4" aria-hidden="true" />
              {event.venue}
            </span>
          </div>
        </div>
        <p className="rounded-full border border-dashed px-3 py-1 text-xs text-muted-foreground">
          Preview with sample listings
        </p>
      </header>
      <SeatMapExplorer key={map.id} map={map} listings={listings} />
    </main>
  )
}
