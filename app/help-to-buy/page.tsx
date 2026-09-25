import { SiteHeader } from '@/components/site-header'
import { EventsSection } from '@/components/events-section'
import { SiteFooter } from '@/components/site-footer'
import { AdminTabGate } from '@/components/admin-tab-gate'
import { getEventsByType } from '@/lib/events'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Help to Buy Concert Tickets — Bunnyticket',
  description: 'We queue and buy sold-out tickets on your behalf during official sales.',
}

export default async function HelpToBuyPage() {
  const helpToBuy = await getEventsByType('help_to_buy')

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <EventsSection
          id="help-to-buy"
          variant="help_to_buy"
          title="Help to Buy Concert Tickets — We Queue For You"
          subtitle="We buy tickets on your behalf during official sales"
          events={helpToBuy}
        />
      </main>
      <SiteFooter />
      <AdminTabGate />
    </div>
  )
}
