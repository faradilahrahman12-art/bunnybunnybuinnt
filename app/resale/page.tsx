import { SiteHeader } from '@/components/site-header'
import { EventsSection } from '@/components/events-section'
import { SiteFooter } from '@/components/site-footer'
import { AdminTabGate } from '@/components/admin-tab-gate'
import { getEventsByType } from '@/lib/events'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Resale Concert Tickets — Bunnyticket',
  description: 'Browse verified resale K-pop and live event tickets available now across Asia.',
}

export default async function ResalePage() {
  const resale = await getEventsByType('resale')

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <EventsSection
          id="resale"
          variant="resale"
          title="Buy Resale Concert Tickets — Available Now"
          subtitle="Click on any concert to book or view available seats"
          events={resale}
        />
      </main>
      <SiteFooter />
      <AdminTabGate />
    </div>
  )
}
