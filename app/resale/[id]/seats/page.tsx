import { notFound, redirect } from 'next/navigation'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { pool } from '@/lib/db'
import { getEventById } from '@/lib/events'
import { getPublicSeatMap } from '@/lib/seat-map/catalog'
import { sweepExpiredHolds } from '@/lib/seat-map/inventory'
import { SeatCheckoutExplorer } from '@/components/seat-map/seat-checkout-explorer'
import type { Listing, VenueMap } from '@/components/seat-map/types'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const event = await getEventById(Number(id))
  return {
    title: event ? `Choose seats — ${event.title} — Bunnyticket` : 'Choose seats — Bunnyticket',
    description: 'Pick your section on the venue map and reserve tickets for 15 minutes while you check out.',
  }
}

export default async function SeatsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const eventId = Number(id)
  if (!Number.isInteger(eventId) || eventId < 1) notFound()

  await sweepExpiredHolds(pool, { eventId })
  const [event, seatMap] = await Promise.all([getEventById(eventId), getPublicSeatMap(pool, eventId)])
  if (!event || event.comingSoon) notFound()
  if (!seatMap) redirect(`/submit?event=${eventId}`)

  const map: VenueMap = {
    id: String(seatMap.map.id),
    name: seatMap.map.name,
    viewBox: { width: seatMap.map.width, height: seatMap.map.height },
    backgroundImage: seatMap.map.backgroundImageUrl,
    sections: seatMap.sections,
  }
  const listings: Listing[] = seatMap.listings.map((l) => ({
    id: String(l.id),
    sectionCode: l.sectionCode,
    row: l.rowLabel,
    seats: l.seats,
    available: l.available,
    price: l.price,
    originalPrice: l.originalPrice,
    currency: l.currency,
    seatedTogether: l.seatedTogether,
    viewNote: l.dateLabel ? [l.dateLabel, l.viewNote].filter(Boolean).join(' · ') : l.viewNote,
    featured: l.featured,
    status: l.available > 0 ? 'available' : 'sold_out',
  }))

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 px-4 py-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-6">
          <header className="flex flex-col gap-1">
            <p className="text-sm font-medium text-primary">{seatMap.map.venueName}</p>
            <h1 className="text-balance text-2xl font-extrabold tracking-tight md:text-3xl">{event.title}</h1>
            <p className="text-sm text-muted-foreground">
              Choose a section and quantity. Tickets are held for 15 minutes while you complete payment.
            </p>
          </header>
          <SeatCheckoutExplorer eventId={eventId} map={map} listings={listings} />
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
