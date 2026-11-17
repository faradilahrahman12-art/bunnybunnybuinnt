import { Bookmark, Eye, Sparkles, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatMoney, LOW_STOCK_THRESHOLD, sectionName, type Listing } from './types'

type Props = {
  listing: Listing
  selected: boolean
  onSelect: () => void
  quantity: number
}

export function ListingCard({ listing, selected, onSelect, quantity }: Props) {
  const name = sectionName(listing.sectionCode)
  const lowStock = listing.available <= LOW_STOCK_THRESHOLD

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        'flex w-full items-start justify-between gap-4 rounded-2xl border bg-card p-4 text-left transition-colors',
        'hover:border-primary/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
        selected && 'border-[oklch(0.66_0.22_350)] ring-2 ring-[oklch(0.66_0.22_350)]/40',
      )}
    >
      <div className="flex min-w-0 flex-col gap-1">
        <p className="font-semibold">{name}</p>
        {(listing.row || listing.seats) && (
          <p className="text-sm text-muted-foreground">
            {[listing.row && `Row ${listing.row}`, listing.seats && `Seats ${listing.seats}`].filter(Boolean).join(' · ')}
          </p>
        )}
        <p className="text-xs text-muted-foreground">{listing.available} available</p>
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Users className="size-3.5 text-primary" aria-hidden="true" />
          {listing.seatedTogether ? `${quantity} tickets together` : `${quantity} tickets`}
        </p>
        {listing.viewNote && (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Eye className="size-3.5" aria-hidden="true" />
            {listing.viewNote}
          </p>
        )}
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {lowStock && (
            <span className="inline-flex items-center gap-1 rounded-md bg-[oklch(0.66_0.22_350)]/12 px-2 py-0.5 text-xs font-medium text-[oklch(0.52_0.22_350)] dark:text-[oklch(0.78_0.15_350)]">
              <Bookmark className="size-3" aria-hidden="true" />
              Last tickets
            </span>
          )}
          {listing.featured && (
            <span className="inline-flex items-center gap-1 rounded-md bg-primary/12 px-2 py-0.5 text-xs font-medium text-primary">
              <Sparkles className="size-3" aria-hidden="true" />
              Top choice
            </span>
          )}
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-0.5">
        {listing.originalPrice && listing.originalPrice > listing.price && (
          <s className="text-xs text-muted-foreground">
            <span className="sr-only">Was </span>
            {formatMoney(listing.originalPrice, listing.currency)}
          </s>
        )}
        <p className="text-lg font-bold">{formatMoney(listing.price, listing.currency)}</p>
        <p className="text-xs text-muted-foreground">per ticket, all-in</p>
      </div>
    </button>
  )
}
