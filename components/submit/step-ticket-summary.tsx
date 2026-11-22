'use client'

import { useEffect, useRef } from 'react'
import { BadgeCheck, CalendarDays, Eye, LockOpen, MapPin, Repeat, ShieldCheck, Sparkles, Ticket, Timer, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { EventWithSchedule } from '@/lib/db/schema'
import type { HoldSummary } from '@/lib/seat-map/inventory'
import { formatMoney, sectionName, type Listing } from '@/components/seat-map/types'
import { computeTotal, isFlexibleDeliveryEligible, type DeliveryOption, type SubmitFormState } from './types'

const DELIVERY_HIGHLIGHTS: Record<Exclude<DeliveryOption, ''>, { title: string; note: string }> = {
  enter_together: { title: 'Enter with account holder', note: 'Enter the venue together with the original account holder' },
  change_details: { title: 'Account changed to your name', note: 'Account details updated to your name (1–7 days)' },
  electronic_ticket: { title: 'Electronic ticket', note: 'Your ticket and PDF will be sent to you by email' },
  etix_transfer: { title: 'Ticket transfer via Etix', note: 'Your ticket will be transferred to your Etix account' },
  flexible: { title: 'Flexible delivery', note: 'Flexible delivery method' },
}

function formatClock(ms: number) {
  if (!Number.isFinite(ms)) return null
  const minutes = Math.floor(ms / 60000)
  const seconds = Math.floor((ms % 60000) / 1000)
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

export function HoldIntroDialog({ minutes, onStart }: { minutes: number; onStart: () => void }) {
  const startRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    startRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onStart()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onStart])

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/70 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="hold-intro-title"
        aria-describedby="hold-intro-desc"
        className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 text-center shadow-2xl"
      >
        <span className="mx-auto grid size-12 place-items-center rounded-xl bg-primary/15 text-primary">
          <LockOpen className="size-5" aria-hidden="true" />
        </span>
        <h2 id="hold-intro-title" className="mt-4 text-xl font-bold leading-tight text-balance">
          You have {minutes} minutes to complete your purchase
        </h2>
        <p id="hold-intro-desc" className="mt-2 text-sm text-muted-foreground">
          The price of your tickets will be locked during this time.
        </p>
        <Button ref={startRef} onClick={onStart} className="mt-5 h-12 w-full rounded-xl text-base font-semibold">
          Start
        </Button>
      </div>
    </div>
  )
}

export function StepTicketSummary({
  event,
  form,
  total,
  hold,
  listing,
  venueName,
  msLeft,
  onChangeSeats,
}: {
  event: EventWithSchedule
  form: SubmitFormState
  total: number | null
  hold: HoldSummary | null
  listing: Listing | null
  venueName: string | null
  msLeft: number
  onChangeSeats?: () => void
}) {
  const clock = hold ? formatClock(msLeft) : null
  const venue = venueName || event.country
  const currency = listing?.currency ?? 'PHP'

  const lines = hold
    ? [
        {
          key: hold.dateLabel,
          date: hold.dateLabel,
          title: `Section ${sectionName(hold.sectionCode)}${hold.rowLabel ? ` · Row ${hold.rowLabel}` : ''}`,
          quantity: hold.quantity,
          unitPrice: hold.unitPrice,
        },
      ]
    : form.selectedDates.map((date) => {
        const selection = form.sections[date]
        const quantity = selection?.quantity ?? 1
        const dateTotal = computeTotal(event, { ...form, selectedDates: [date], holdTotal: null })
        return {
          key: date,
          date,
          title: selection?.priority || 'General sale',
          quantity,
          unitPrice: dateTotal !== null && quantity > 0 ? dateTotal / quantity : null,
        }
      })

  const highlights = [
    listing?.seatedTogether && hold && hold.quantity > 1
      ? { icon: Users, title: 'Seated together', note: `${hold.quantity} seats side by side` }
      : null,
    { icon: Eye, title: listing?.viewNote || 'Clear view', note: 'Checked view of the stage' },
    form.deliveryOption ? { icon: Ticket, ...DELIVERY_HIGHLIGHTS[form.deliveryOption] } : null,
    listing?.featured ? { icon: Sparkles, title: 'Popular pick', note: 'One of the most-viewed sections' } : null,
  ].filter((h): h is { icon: typeof Eye; title: string; note: string } => h !== null)

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
        {event.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={event.imageUrl} alt="" className="size-14 shrink-0 rounded-xl object-cover" />
        ) : (
          <span className="grid size-14 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
            <Ticket className="size-6" aria-hidden="true" />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold">{event.title}</p>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
            <CalendarDays className="size-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate">{lines.map((l) => l.date).join(', ') || 'Date to follow'}</span>
          </p>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate">{venue}</span>
          </p>
        </div>
        {clock && (
          <span
            className={`flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 font-mono text-sm font-bold tabular-nums ${
              msLeft > 0 ? 'bg-primary/15 text-primary' : 'bg-destructive/15 text-destructive'
            }`}
            aria-label={`Time left on your hold: ${clock}`}
          >
            <Timer className="size-3.5" aria-hidden="true" />
            {clock}
          </span>
        )}
      </div>

      {event.imageUrl && (
        <div className="overflow-hidden rounded-2xl border border-border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={event.imageUrl} alt={`${event.title} event artwork`} className="aspect-[16/9] w-full object-cover" />
        </div>
      )}

      <div className="flex flex-col gap-5 md:flex-row md:items-start">
        <section className="flex min-w-0 flex-1 flex-col gap-4" aria-label="Ticket details">
          {lines.map((line) => (
            <div key={line.key}>
              <h2 className="text-xl font-bold tracking-tight">{line.title}</h2>
              <p className="text-sm text-muted-foreground">
                {line.quantity} {line.quantity === 1 ? 'ticket' : 'tickets'}
                {hold?.seats ? ` · Seats ${hold.seats}` : ''} · {line.date}
              </p>
            </div>
          ))}

          <span className="inline-flex w-fit items-center gap-1.5 rounded-md bg-primary/15 px-2 py-1 text-xs font-semibold text-primary">
            <BadgeCheck className="size-3.5" aria-hidden="true" />
            Verified resale ticket
          </span>

          <ul className="flex flex-col gap-3 border-t border-border pt-4">
            {highlights.map(({ icon: Icon, title, note }) => (
              <li key={title} className="flex items-start gap-3">
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-muted text-foreground">
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-semibold">{title}</p>
                  <p className="text-xs text-muted-foreground">{note}</p>
                </div>
              </li>
            ))}
          </ul>

          {isFlexibleDeliveryEligible(event) && (
            <div className="rounded-xl border border-primary/35 bg-primary/10 p-3 shadow-[0_0_22px_color-mix(in_oklch,var(--primary)_12%,transparent)] sm:rounded-2xl sm:p-4">
              <p className="text-xs font-bold text-foreground sm:text-sm">Ticket Delivery: Flexible</p>
              <p className="mt-1 text-pretty text-xs font-semibold leading-snug text-primary sm:text-sm">Priority Method: Change Account Details to Your Own Name</p>
              <p className="mt-1.5 text-pretty text-[11px] leading-relaxed text-muted-foreground sm:mt-2 sm:text-xs">
                The actual delivery arrangement depends on ticketing platform rules, event requirements, and availability.
              </p>
            </div>
          )}

          {onChangeSeats && (
            <button
              type="button"
              onClick={onChangeSeats}
              className="w-fit text-sm font-semibold text-primary underline-offset-4 hover:underline"
            >
              Change seats
            </button>
          )}
        </section>

        <aside className="flex w-full flex-col gap-4 md:w-72 md:shrink-0">
          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="flex items-center justify-center gap-1.5 rounded-lg bg-primary/15 px-3 py-2 text-xs font-semibold text-primary">
              <Sparkles className="size-3.5" aria-hidden="true" />
              These tickets are almost yours!
            </p>
            <h3 className="mt-4 text-sm font-bold">Order summary</h3>
            <dl className="mt-2 flex flex-col gap-1.5 text-sm">
              {lines.map((line) => (
                <div key={line.key} className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Ticket price</dt>
                  <dd className="tabular-nums">
                    {line.quantity} × {line.unitPrice !== null ? formatMoney(line.unitPrice, currency) : '—'}
                  </dd>
                </div>
              ))}
              <div className="mt-1 flex justify-between gap-3 border-t border-border pt-2 font-bold">
                <dt>Total</dt>
                <dd className="tabular-nums">{total !== null ? formatMoney(total, currency) : '—'}</dd>
              </div>
            </dl>
          </div>

          <div className="flex items-start gap-3 px-1">
            <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold">100% order guarantee</p>
              <p className="text-xs text-muted-foreground">We back every order so you can buy with confidence.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 px-1">
            <Repeat className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold">Resell anytime</p>
              <p className="text-xs text-muted-foreground">
                {"Can't make it to the show? You can resell your tickets with BunnyTicket."}
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
