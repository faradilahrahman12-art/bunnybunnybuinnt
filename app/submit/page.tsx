import Link from 'next/link'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { Button } from '@/components/ui/button'
import { SubmitWizard } from '@/components/submit/submit-wizard'
import { getEventById } from '@/lib/events'
import { getSubmitContent } from '@/lib/settings'
import { getQrphMerchants } from '@/lib/qrph'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Submit an Order — Bunnyticket',
  description: 'Reserve your concert tickets in a few quick steps.',
}

export default async function SubmitPage({
  searchParams,
}: {
  searchParams: Promise<{ event?: string }>
}) {
  const { event: eventParam } = await searchParams
  const id = Number(eventParam)
  const [event, content, merchants] = await Promise.all([
    Number.isFinite(id) ? getEventById(id) : Promise.resolve(null),
    getSubmitContent(),
    getQrphMerchants(),
  ])

  return (
    <div className="flex min-h-screen flex-col">
      {!event && <SiteHeader />}
      <main className="flex-1 px-4 py-10 font-normal">
        {event ? (
          <SubmitWizard event={event} content={content} merchants={merchants} />
        ) : (
          <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-16 text-center">
            <h1 className="text-2xl font-extrabold tracking-tight">Event not found</h1>
            <p className="text-sm text-muted-foreground">
              We couldn&apos;t find the event you&apos;re trying to order. Please pick one from our listings.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button render={<Link href="/resale" />}>Browse Resale Tickets</Button>
              <Button variant="outline" render={<Link href="/help-to-buy" />}>
                Browse HTB Events
              </Button>
            </div>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  )
}
