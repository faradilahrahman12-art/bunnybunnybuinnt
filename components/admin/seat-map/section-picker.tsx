'use client'

import { CheckSquare, Square, Ticket, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { isCustomerVisible, type Listing, type VenueMap } from '@/components/seat-map/types'

type Props = {
  layout: VenueMap
  listings: Listing[]
  selected: Set<string>
  onSelectedChange: (next: Set<string>) => void
  onAddTickets: () => void
}

export function SectionPicker({ layout, listings, selected, onSelectedChange, onAddTickets }: Props) {
  const sellable = layout.sections.filter((s) => s.kind !== 'stage')
  const liveCodes = new Set(listings.filter(isCustomerVisible).map((l) => l.sectionCode))
  const listedCodes = new Set(listings.filter((l) => l.status !== 'hidden').map((l) => l.sectionCode))
  const unlisted = sellable.filter((s) => !listedCodes.has(s.code))

  function toggle(code: string) {
    const next = new Set(selected)
    if (next.has(code)) next.delete(code)
    else next.add(code)
    onSelectedChange(next)
  }

  return (
    <section aria-labelledby="section-picker-heading" className="flex flex-col gap-3 rounded-2xl border bg-card p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 id="section-picker-heading" className="font-semibold">
            Choose available sections
          </h2>
          <p className="text-xs text-muted-foreground">
            {liveCodes.size} of {sellable.length} sections are on sale. Click sections on the map, then add tickets to all of them at once.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => onSelectedChange(new Set(unlisted.map((s) => s.code)))} disabled={!unlisted.length}>
            <CheckSquare className="size-4" aria-hidden="true" />
            Select unlisted ({unlisted.length})
          </Button>
          <Button size="sm" variant="outline" onClick={() => onSelectedChange(new Set(sellable.map((s) => s.code)))}>
            <Square className="size-4" aria-hidden="true" />
            Select all
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onSelectedChange(new Set())} disabled={!selected.size}>
            <X className="size-4" aria-hidden="true" />
            Clear
          </Button>
          <Button size="sm" onClick={onAddTickets} disabled={!selected.size}>
            <Ticket className="size-4" aria-hidden="true" />
            Add tickets to {selected.size || ''} section{selected.size === 1 ? '' : 's'}
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border bg-muted/60">
        <svg viewBox={`0 0 ${layout.viewBox.width} ${layout.viewBox.height}`} className="h-auto w-full select-none">
          {layout.backgroundImage && (
            <image href={layout.backgroundImage} width={layout.viewBox.width} height={layout.viewBox.height} opacity={0.55} />
          )}
          {layout.sections.map((section) => {
            const isStage = section.kind === 'stage'
            const isSelected = selected.has(section.code)
            const isLive = liveCodes.has(section.code)
            const isListed = listedCodes.has(section.code)
            return (
              <g key={section.code}>
                <path
                  d={section.path}
                  role={isStage ? undefined : 'checkbox'}
                  aria-checked={isStage ? undefined : isSelected}
                  aria-label={isStage ? undefined : `Section ${section.code}${isLive ? ', on sale' : isListed ? ', listed but not on sale' : ', no tickets'}`}
                  tabIndex={isStage ? undefined : 0}
                  onClick={() => !isStage && toggle(section.code)}
                  onKeyDown={(e) => {
                    if (isStage || (e.key !== 'Enter' && e.key !== ' ')) return
                    e.preventDefault()
                    toggle(section.code)
                  }}
                  strokeWidth={isSelected ? 3 : 1.5}
                  className={cn(
                    'outline-none transition-colors',
                    isStage
                      ? 'fill-foreground/50 stroke-background'
                      : cn(
                          'cursor-pointer focus-visible:stroke-ring',
                          isSelected
                            ? 'fill-[oklch(0.66_0.22_350)]/80 stroke-[oklch(0.45_0.2_350)]'
                            : isLive
                              ? 'fill-primary/70 stroke-background hover:fill-primary/85'
                              : isListed
                                ? 'fill-amber-500/50 stroke-background hover:fill-amber-500/70'
                                : 'fill-background/40 stroke-muted-foreground/60 hover:fill-primary/30',
                        ),
                  )}
                />
                <text
                  x={section.labelX}
                  y={section.labelY}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={section.labelSize}
                  className="pointer-events-none fill-foreground font-semibold"
                >
                  {section.code}
                </text>
              </g>
            )
          })}
        </svg>
      </div>

      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground" aria-label="Map legend">
        <li className="flex items-center gap-1.5">
          <span className="size-3 rounded-sm bg-primary/70" aria-hidden="true" /> On sale
        </li>
        <li className="flex items-center gap-1.5">
          <span className="size-3 rounded-sm bg-amber-500/50" aria-hidden="true" /> Listed, sold out
        </li>
        <li className="flex items-center gap-1.5">
          <span className="size-3 rounded-sm border border-muted-foreground/60 bg-background/40" aria-hidden="true" /> No tickets (gray for customers)
        </li>
        <li className="flex items-center gap-1.5">
          <span className="size-3 rounded-sm bg-[oklch(0.66_0.22_350)]/80" aria-hidden="true" /> Selected
        </li>
      </ul>
    </section>
  )
}
