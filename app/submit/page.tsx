import Link from 'next/link'
import { getCustomerSession } from '@/lib/customer-session'
import { SignInRequired } from '@/components/auth/sign-in-required'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { Button } from '@/components/ui/button'
import { SubmitWizard } from '@/components/submit/submit-wizard'
import { getEventById } from '@/lib/events'
import { getSubmitContent } from '@/lib/settings'
import { getQrphMerchants } from '@/lib/qrph'
import { getEditableOrder } from '@/app/actions/orders'
import { redirect } from 'next/navigation'
import { pool } from '@/lib/db'
import { getActiveCheckoutHold } from '@/lib/seat-map/inventory'
import { canAccessEvent, isTestEvent } from '@/lib/seat-map/test-mode'
import { getPublicSeatMap } from '@/lib/seat-map/catalog'
import type { WizardSeatMap } from '@/components/submit/step-seat-map'

async function loadWizardSeatMap(eventId: number, allowHidden: boolean): Promise<WizardSeatMap | null> {
  const seatMap = await getPublicSeatMap(pool, eventId, { allowHidden })
  if (!seatMap) return null
  return {
    venueName: seatMap.map.venueName,
    map: {
      id: String(seatMap.map.id),
      name: seatMap.map.name,
      viewBox: { width: seatMap.map.width, height: seatMap.map.height },
      backgroundImage: seatMap.map.backgroundImageUrl,
      sections: seatMap.sections,
    },
    listings: seatMap.listings.map((l) => ({
      id: String(l.id),
      sectionCode: l.sectionCode,
      row: l.rowLabel,
      seats: l.seats,
      available: l.available,
      price: l.price,
      originalPrice: l.originalPrice,
      currency: l.currency,
      seatedTogether: l.seatedTogether,
      viewNote: l.viewNote,
      featured: l.featured,
      status: l.available > 0 ? 'available' : 'sold_out',
      dateLabel: l.dateLabel,
    })),
  }
}

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Submit an Order — Bunnyticket',
  description: 'Reserve your concert tickets in a few quick steps.',
}

export default async function SubmitPage({
  searchParams,
}: {
  searchParams: Promise<{ event?: string; edit?: string; hold?: string; expired?: string }>
}) {
  const { event: eventParam, edit: editParam, hold: holdParam, expired: expiredParam } = await searchParams
  const session = await getCustomerSession()
  if (!session?.user) {
    const query = new URLSearchParams()
    if (eventParam) query.set('event', eventParam)
    if (editParam) query.set('edit', editParam)
    if (holdParam) query.set('hold', holdParam)
    const redirectTo = query.size > 0 ? `/submit?${query.toString()}` : '/submit'
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
  const [rawEvent, content, merchants, editResult, rawHold] = await Promise.all([
    Number.isFinite(id) ? getEventById(id) : Promise.resolve(null),
    getSubmitContent(),
    getQrphMerchants(),
    editParam ? getEditableOrder(editParam) : Promise.resolve(null),
    holdParam && !editParam ? getActiveCheckoutHold(pool, { token: holdParam, userId: session.user.id }) : Promise.resolve(null),
  ])
  const seatHold = rawHold && rawHold.eventId === rawEvent?.id ? rawHold : null
  if (holdParam && !editParam && !seatHold && rawEvent) redirect(`/submit?event=${rawEvent.id}&expired=1`)
  const editingOrder = editResult?.order && editResult.order.eventId === rawEvent?.id ? editResult.order : null
  // Coming soon events are visible on the site but cannot be booked — unless editing an existing order.
  const bookable = rawEvent && rawEvent.comingSoon && !editingOrder ? null : rawEvent
  const event = bookable && canAccessEvent(bookable.id, session.user) ? bookable : null
  const testEvent = isTestEvent(event?.id)
  const seatMap =
    event && event.type === 'resale' && !editingOrder ? await loadWizardSeatMap(event.id, testEvent) : null

  if (editParam && !editingOrder) {
    return (
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex-1 px-4 py-10 font-normal">
          <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-16 text-center">
            <h1 className="text-2xl font-extrabold tracking-tight">Order can&apos;t be edited</h1>
            <p className="text-sm text-muted-foreground">
              {editResult?.error ?? 'This order does not match the selected event.'}
            </p>
            <Button render={<Link href="/orders" />}>Back to My Orders</Button>
          </div>
        </main>
        <SiteFooter />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      {!event && <SiteHeader />}
      <main className={`flex-1 px-4 font-normal ${event ? 'pb-10' : 'py-10'}`}>
        {event ? (
          <>
            {testEvent && (
              <p role="status" className="mx-auto mt-4 max-w-2xl rounded-md border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                Test event: do not send any payment. Upload any image as a receipt. No emails are sent for this order.
              </p>
            )}
            {expiredParam && seatMap && !seatHold && (
              <p role="status" className="mx-auto mt-4 max-w-2xl rounded-md border border-border bg-muted px-4 py-3 text-sm">
                Your ticket hold expired, so those tickets were released. Please choose again.
              </p>
            )}
            <SubmitWizard
              event={event}
              content={content}
              merchants={testEvent ? [] : merchants}
              editingOrder={editingOrder}
              seatHold={seatHold}
              seatMap={seatMap}
            />
          </>
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
