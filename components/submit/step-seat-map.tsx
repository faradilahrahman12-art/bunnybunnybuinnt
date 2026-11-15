'use client'

import { useMemo } from 'react'
import { MapPin } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { countryFlag } from '@/lib/countries'
import type { EventWithSchedule } from '@/lib/db/schema'
import type { SubmitContent } from '@/lib/submit-content'
import { SeatMapExplorer } from '@/components/seat-map/seat-map-explorer'
import type { Listing, VenueMap } from '@/components/seat-map/types'

export type WizardSeatMap = { venueName: string; map: VenueMap; listings: Listing[] }

export function StepSeatMap({
  event,
  content,
  seatMap,
  selectedDate,
  onSelectDate,
  onReserve,
  reserving,
  error,
}: {
  event: EventWithSchedule
  content: SubmitContent
  seatMap: WizardSeatMap
  selectedDate: string | null
  onSelectDate: (label: string) => void
  onReserve: (listing: Listing, quantity: number) => void
  reserving: boolean
  error: string | null
}) {
  const hasDates = event.schedule.length > 0
  const activeDate = hasDates ? selectedDate : null

  const listings = useMemo(
    () =>
      hasDates
        ? seatMap.listings.filter((l) => !l.dateLabel || l.dateLabel === activeDate)
        : seatMap.listings,
    [seatMap.listings, hasDates, activeDate],
  )

  return (
    <div className="flex flex-col gap-5">
      <div className="text-left">
        <h1 className="text-3xl font-medium tracking-tight sm:text-4xl">🎟️{content.steps.ticket.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pick your date, then choose a section on the map. Tickets are held for 15 minutes while you finish your order.
        </p>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-xl bg-primary/5 p-4">
        <div>
          <p className="text-sm font-bold leading-snug">{event.title}</p>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="size-3.5 text-primary" aria-hidden="true" />
            <span className="text-sm leading-none">{countryFlag(event.country)}</span>
            {seatMap.venueName || event.country}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-primary/15 px-3 py-1 text-xs font-bold text-primary">Resale</span>
      </div>

      {hasDates && (
        <div className="rounded-xl border border-border bg-card p-4">
          <Label className="text-sm font-bold">
            📅Concert date <span className="text-primary">*</span>
          </Label>
          <p className="mt-1 text-xs text-muted-foreground">Select a date to see the seats available for it.</p>
          <div className="mt-3 flex flex-wrap gap-2" role="radiogroup" aria-label="Concert date">
            {event.schedule.map((d) => {
              const active = activeDate === d.label
              return (
                <button
                  key={d.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  disabled={reserving}
                  onClick={() => onSelectDate(d.label)}
                  className={cn(
                    'rounded-full border px-4 py-1.5 text-sm font-medium transition',
                    active
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground',
                  )}
                >
                  {d.label}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {error && (
        <p role="alert" className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      )}

      {hasDates && !activeDate ? (
        <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          Choose a concert date above to load the interactive seat map.
        </p>
      ) : (
        <SeatMapExplorer
          key={activeDate ?? 'all'}
          map={seatMap.map}
          listings={listings}
          onContinue={onReserve}
          continuing={reserving}
          stacked
        />
      )}
    </div>
  )
}
