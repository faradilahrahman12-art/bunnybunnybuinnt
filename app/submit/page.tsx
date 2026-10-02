import Link from 'next/link'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { SignInRequired } from '@/components/auth/sign-in-required'
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
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    const redirectTo = eventParam ? `/submit?event=${encodeURIComponent(eventParam)}` : '/submit'
    return (
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex-1 px-4 font-normal">
          <SignInRequired redirectTo={redirectTo} />
        </main>
        <SiteFooter />
      </div>
    )
  }

  const id = Number(eventParam)
  const [rawEvent, content, merchants] = await Promise.all([
    Number.isFinite(id) ? getEventById(id) : Promise.resolve(null),
    getSubmitContent(),
    getQrphMerchants(),
  ])
  // Coming soon events are visible on the site but cannot be booked.
  const event = rawEvent && rawEvent.comingSoon ? null : rawEvent

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
