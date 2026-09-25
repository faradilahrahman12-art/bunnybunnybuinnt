'use client'

import { useState } from 'react'
import Image from 'next/image'
import { CalendarDays, Check, Map, MapPin, Minus, Plus, X } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { countryFlag } from '@/lib/countries'
import { computeTotal, MAX_QUANTITY, pesos, pesosPlain, totalTickets, type StepProps } from './types'
import type { ScheduleDate } from '@/lib/db/schema'

export function StepTicket({ event, form, update, content }: StepProps) {
  const [lightbox, setLightbox] = useState(false)
  const isResale = event.type === 'resale'
  const seatMap = event.seatMapUrl

  function toggleDate(label: string) {
    const has = form.selectedDates.includes(label)
    if (has) {
      const nextSections = { ...form.sections }
      delete nextSections[label]
      update({
        selectedDates: form.selectedDates.filter((d) => d !== label),
        sections: nextSections,
      })
      return
    }
    // Default the priority tier to the first available section for this date, qty 1
    const day = event.schedule.find((d) => d.label === label)
    const firstSection = day?.sections.find((s) => s.quantity > 0) ?? day?.sections[0]
    update({
      selectedDates: [...form.selectedDates, label],
      sections: {
        ...form.sections,
        [label]: { priority: firstSection?.name ?? '', quantity: 1 },
      },
    })
  }

  function setQty(label: string, next: number, maxQuantity = MAX_QUANTITY) {
    const cur = form.sections[label]
    if (!cur) return
    const quantity = Math.min(Math.max(next, 1), maxQuantity)
    update({ sections: { ...form.sections, [label]: { ...cur, quantity } } })
  }

  function selectPriority(label: string, name: string) {
    const cur = form.sections[label]
    const day = event.schedule.find((d) => d.label === label)
    const selectedSection = day?.sections.find((section) => section.name === name)
    const maxQuantity = selectedSection?.quantity ?? MAX_QUANTITY
    // If the new priority matches the current backup, clear the backup.
    const backup = cur?.backup === name ? undefined : cur?.backup
    update({
      sections: {
        ...form.sections,
        [label]: { priority: name, backup, quantity: Math.min(cur?.quantity ?? 1, maxQuantity) },
      },
    })
  }

  function selectBackup(label: string, name: string, priority: string) {
    const cur = form.sections[label]
    update({
      sections: { ...form.sections, [label]: { priority, backup: name, quantity: cur?.quantity ?? 1 } },
    })
  }

  const total = computeTotal(event, form)
  const tickets = totalTickets(form)

  return (
    <div className="flex flex-col gap-5">
      <div className="text-left">
        <h1 className="text-3xl font-medium tracking-tight sm:text-4xl">🎟️{content.steps.ticket.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{content.steps.ticket.subtitle}</p>
      </div>

      {/* Event summary */}
      <div className="flex items-center justify-between gap-3 rounded-xl bg-primary/5 p-4">
        <div>
          <p className="text-sm font-bold leading-snug">{event.title}</p>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="size-3.5 text-primary" />
            <span className="text-sm leading-none">{countryFlag(event.country)}</span>
            {event.country}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-primary/15 px-3 py-1 text-xs font-bold text-primary">
          {isResale ? 'Resale' : 'Help to Buy'}
        </span>
      </div>

      {/* Notices */}
      <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4 text-sm">
        <p className="flex items-start gap-2 text-muted-foreground">
          🏷️All-in pricing — prices shown include the ticket price + service fee. No hidden charges.
        </p>
        {isResale ? (
          <p className="flex items-start gap-2 text-muted-foreground">
            📌Section and row assignments will depend on the number of tickets you order.
          </p>
        ) : (
          <p className="flex items-start gap-2 text-muted-foreground">
            📌<span>
              <span className="font-bold text-foreground">Random section</span>
              {' — specific sections/seats cannot be guaranteed and are randomly assigned.'}
            </span>
          </p>
        )}
      </div>

      {/* Seat map */}
      {seatMap && (
        <div className="overflow-hidden rounded-xl border border-border">
          <div className="flex items-center justify-between bg-primary/10 px-4 py-2.5">
            <p className="flex items-center gap-2 text-sm font-bold text-primary">
              <Map className="size-4" />
              Seat Map
            </p>
            <button
              type="button"
              onClick={() => setLightbox(true)}
              className="text-xs font-medium text-primary hover:underline"
            >
              Tap to view full size
            </button>
          </div>
          <button
            type="button"
            onClick={() => setLightbox(true)}
            aria-label="View full size seat map"
            className="grid w-full place-items-center bg-primary/5 p-6"
          >
            <span className="relative block h-44 w-full max-w-xs">
              <Image src={seatMap || '/placeholder.svg'} alt={`${event.title} seat map`} fill className="object-contain" />
            </span>
          </button>
        </div>
      )}

      {/* Concert dates */}
      <div className="rounded-xl border border-border bg-card p-4">
        <Label className="text-sm font-bold">
          📅Concert date(s) <span className="text-primary">*</span>
        </Label>
        <p className="mt-1 text-xs text-muted-foreground">
          Select one or more days you want us to queue for. Set the tier and quantity per date below.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {event.schedule.length === 0 ? (
            <p className="text-xs text-muted-foreground">Dates will be confirmed with you after ordering.</p>
          ) : (
            event.schedule.map((d) => {
              const active = form.selectedDates.includes(d.label)
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => toggleDate(d.label)}
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
            })
          )}
        </div>
      </div>

      {/* Tiers + quantity per selected date */}
      {form.selectedDates.length > 0 && (
        <div className="flex flex-col gap-3">
          {form.selectedDates.map((label) => {
            const day = event.schedule.find((d) => d.label === label)
            const sections = day?.sections ?? []
            const sel = form.sections[label]
            const priority = sel?.priority ?? sections[0]?.name
            const backup = sel?.backup
            const qty = sel?.quantity ?? 1
            const selectedSection = sections.find((section) => section.name === priority)
            const maxQuantity = selectedSection?.quantity ?? MAX_QUANTITY

            if (sections.length === 0) {
              return (
                <div key={label} className="rounded-xl border border-border bg-card p-4">
                  <p className="flex items-center gap-2 text-sm font-bold">
                    <CalendarDays className="size-4 text-primary" />
                    {label}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    No sections for this event — just set the quantity for this date.
                  </p>
                  <div className="mt-3">
                    <QuantityStepper
                      value={qty}
                      maxQuantity={MAX_QUANTITY}
                      onChange={(n) => setQty(label, n, MAX_QUANTITY)}
                    />
                  </div>
                </div>
              )
            }

            return (
              <div key={label} className="rounded-xl bg-primary/5 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="flex items-center gap-2 text-sm font-bold">
                    <CalendarDays className="size-4 text-primary" />
                    {label}
                  </p>
                  <QuantityStepper
                    value={qty}
                    maxQuantity={maxQuantity}
                    onChange={(n) => setQty(label, n, maxQuantity)}
                  />
                </div>

                <p className="mt-3 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                  {isResale ? 'Ticket Tier' : 'Priority Tier'}
                </p>
                <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {sections.map((s) => (
                    <TierCard
                      key={s.id}
                      section={s}
                      selected={priority === s.name}
                      onSelect={() => selectPriority(label, s.name)}
                    />
                  ))}
                </div>

                {!isResale && sections.length > 1 && (
                  <>
                    <p className="mt-4 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                      Backup Tier
                    </p>
                    <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {sections.map((s) => {
                        const isPriority = priority === s.name
                        return (
                          <TierCard
                            key={s.id}
                            section={s}
                            selected={backup === s.name}
                            disabled={isPriority}
                            disabledLabel={isPriority ? 'Priority' : undefined}
                            onSelect={() => priority && selectBackup(label, s.name, priority)}
                          />
                        )
                      })}
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Total */}
      <div className="flex items-center justify-between rounded-xl bg-primary px-5 py-4 text-primary-foreground">
        <div>
          <p className="text-xs font-medium opacity-80">Total Amount</p>
          <p className="text-2xl font-extrabold">{total !== null ? pesos(total) : '—'}</p>
        </div>
        <p className="text-right text-sm font-medium opacity-90">
          {form.selectedDates.length} day{form.selectedDates.length === 1 ? '' : 's'}
          <br />
          <span className="text-xs opacity-80">
            {tickets} ticket{tickets === 1 ? '' : 's'}
          </span>
        </p>
      </div>

      {lightbox && seatMap && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-4"
          onClick={() => setLightbox(false)}
        >
          <button
            type="button"
            aria-label="Close"
            className="absolute right-4 top-4 grid size-10 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <X className="size-5" />
          </button>
          <div className="relative h-[80vh] w-full max-w-3xl">
            <Image src={seatMap || '/placeholder.svg'} alt={`${event.title} seat map`} fill className="object-contain" />
          </div>
        </div>
      )}
    </div>
  )
}

function QuantityStepper({
  value,
  maxQuantity,
  onChange,
}: {
  value: number
  maxQuantity: number
  onChange: (n: number) => void
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        aria-label="Decrease quantity"
        onClick={() => onChange(value - 1)}
        className="grid size-8 place-items-center rounded-lg border border-border bg-background hover:bg-muted"
      >
        <Minus className="size-4" />
      </button>
      <span className="w-7 text-center text-base font-bold tabular-nums">{value}</span>
      <button
        type="button"
        aria-label="Increase quantity"
        onClick={() => onChange(value + 1)}
        className="grid size-8 place-items-center rounded-lg border border-border bg-background hover:bg-muted"
      >
        <Plus className="size-4" />
      </button>
      <span className="text-xs text-muted-foreground">max {maxQuantity}</span>
    </div>
  )
}

function TierCard({
  section,
  selected,
  disabled,
  disabledLabel,
  onSelect,
}: {
  section: ScheduleDate['sections'][number]
  selected: boolean
  disabled?: boolean
  disabledLabel?: string
  onSelect: () => void
}) {
  const soldOut = section.quantity <= 0
  const isDisabled = Boolean(disabled) || soldOut
  return (
    <button
      type="button"
      disabled={isDisabled}
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        'relative flex flex-col items-start rounded-lg border p-3 text-left transition',
        selected && !isDisabled
          ? 'border-primary bg-primary/10 ring-1 ring-primary'
          : 'border-border bg-background hover:border-primary/40',
        isDisabled && 'cursor-not-allowed opacity-50 hover:border-border',
      )}
    >
      <p className="pr-6 text-sm font-bold leading-snug">{section.name}</p>
      <p className="mt-0.5 text-sm font-semibold text-primary">
        {section.price > 0 ? pesosPlain(section.price) : 'TBA'}
      </p>
      <p className="mt-0.5 text-[11px] text-muted-foreground">
        {disabledLabel ?? (soldOut ? 'Sold out' : 'All-in (incl. service fee)')}
      </p>
      {selected && !isDisabled && (
        <span className="absolute right-2 top-2 grid size-5 place-items-center rounded-full bg-primary text-primary-foreground">
          <Check className="size-3" />
        </span>
      )}
    </button>
  )
}
