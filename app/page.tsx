import { SiteHeader } from '@/components/site-header'
import { Hero } from '@/components/hero'
import { EventsSection } from '@/components/events-section'
import { Reviews } from '@/components/reviews'
import { SiteFooter } from '@/components/site-footer'
import { AdminTabGate } from '@/components/admin-tab-gate'
import { getEventsByType } from '@/lib/events'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const [resale, helpToBuy] = await Promise.all([
    getEventsByType('resale'),
    getEventsByType('help_to_buy'),
  ])

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <Hero />
        <EventsSection
          id="resale"
          variant="resale"
          title="Buy Resale Concert Tickets — Available Now"
          subtitle="Click on any concert to book or view available seats"
          events={resale}
        />
        <EventsSection
          id="help-to-buy"
          variant="help_to_buy"
          title="Help to Buy Concert Tickets — We Queue For You"
          subtitle="We buy tickets on your behalf during official sales"
          events={helpToBuy}
        />
        <Reviews />
      </main>
      <SiteFooter />
      <AdminTabGate />
    </div>
  )
}
