'use client'

import { useEffect, useMemo, useState } from 'react'
import { BadgeCheck, ChevronDown, ChevronLeft, Ticket } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { ListingCard } from './listing-card'
import { QuantityPicker } from './quantity-picker'
import { VenueMap, type SectionSummary } from './venue-map'
import {
  ALL_IN_PRICING_NOTE,
  formatMoney,
  isCustomerVisible,
  orderTotal,
  sectionName,
  type Listing,
  type SortOrder,
  type VenueMap as VenueMapData,
} from './types'

type Props = {
  map: VenueMapData
  listings: Listing[]
  onContinue?: (listing: Listing, quantity: number) => void
  continuing?: boolean
  /** Reports the current pick so a parent-owned button can continue instead of the inline one. */
  onSelectionChange?: (selection: { listing: Listing; quantity: number } | null) => void
  /** Single-column layout for narrow containers such as the Submit Wizard. */
  stacked?: boolean
}

const DEFAULT_QUANTITY = 2

export function SeatMapExplorer({
  map,
  listings,
  onContinue,
  continuing = false,
  onSelectionChange,
  stacked = false,
}: Props) {
  const [quantity, setQuantity] = useState<number | null>(null)
  const [pickerOpen, setPickerOpen] = useState(true)
  const [sort, setSort] = useState<SortOrder>('price-asc')
  const [selectedSection, setSelectedSection] = useState<string | null>(null)
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null)

  const effectiveQuantity = quantity ?? DEFAULT_QUANTITY

  const soldOutSections = useMemo(() => {
    const visibleCodes = new Set(listings.filter(isCustomerVisible).map((l) => l.sectionCode))
    return new Set(
      listings
        .filter((l) => l.status !== 'hidden' && !visibleCodes.has(l.sectionCode))
        .map((l) => l.sectionCode),
    )
  }, [listings])

  const eligible = useMemo(
    () => listings.filter((listing) => isCustomerVisible(listing) && listing.available >= effectiveQuantity),
    [listings, effectiveQuantity],
  )

  const summaries = useMemo(() => {
    const result = new Map<string, SectionSummary>()
    for (const listing of eligible) {
      const current = result.get(listing.sectionCode)
      result.set(listing.sectionCode, {
        minPrice: current ? Math.min(current.minPrice, listing.price) : listing.price,
        available: (current?.available ?? 0) + listing.available,
        currency: listing.currency,
      })
    }
    return result
  }, [eligible])

  const activeSection = selectedSection && summaries.has(selectedSection) ? selectedSection : null

  const visible = useMemo(() => {
    const filtered = activeSection ? eligible.filter((l) => l.sectionCode === activeSection) : eligible
    return [...filtered].sort((a, b) => {
      if (sort === 'price-desc') return b.price - a.price
      if (sort === 'section') return a.sectionCode.localeCompare(b.sectionCode, undefined, { numeric: true })
      return a.price - b.price
    })
  }, [eligible, activeSection, sort])

  const selectedListing = quantity ? (eligible.find((listing) => listing.id === selectedListingId) ?? null) : null

  useEffect(() => {
    onSelectionChange?.(selectedListing && quantity ? { listing: selectedListing, quantity } : null)
  }, [selectedListing, quantity, onSelectionChange])

  function confirmQuantity(next: number) {
    setQuantity(next)
    setPickerOpen(false)
    const stillFits = eligible.find((l) => l.id === selectedListingId && l.available >= next)
    if (!stillFits) setSelectedListingId(null)
  }

  function chooseSection(code: string | null) {
    setSelectedSection(code)
    if (selectedListing && selectedListing.sectionCode !== code) setSelectedListingId(null)
  }

  function chooseListing(listing: Listing) {
    const isSame = listing.id === selectedListingId
    setSelectedListingId(isSame ? null : listing.id)
    if (!isSame) setSelectedSection(listing.sectionCode)
  }

  const ticketsLabel = `${effectiveQuantity} ${effectiveQuantity === 1 ? 'ticket' : 'tickets'}`

  return (
    <div
      className={
        stacked
          ? 'flex flex-col gap-4'
          : 'flex flex-col gap-4 lg:grid lg:h-[calc(100dvh-12rem)] lg:min-h-[600px] lg:grid-cols-[minmax(0,1fr)_400px]'
      }
    >
      <div
        className={cn(
          'relative overflow-hidden rounded-2xl',
          stacked ? 'h-[56vh] min-h-[360px] max-h-[600px]' : 'h-[58vh] min-h-[340px] lg:h-full',
        )}
      >
        <VenueMap
          map={map}
          summaries={quantity ? summaries : new Map()}
          soldOutCodes={soldOutSections}
          selectedCode={activeSection}
          onSelect={chooseSection}
        />

        {quantity && !pickerOpen && (
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-sm font-semibold shadow-sm transition hover:border-primary/50"
            aria-label={`${ticketsLabel} selected. Change number of tickets`}
          >
            <Ticket className="size-4 text-primary" aria-hidden="true" />
            {ticketsLabel}
            <ChevronDown className="size-4 text-muted-foreground" aria-hidden="true" />
          </button>
        )}

        {pickerOpen && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/60 backdrop-blur-[2px]">
            <QuantityPicker initial={effectiveQuantity} onConfirm={confirmQuantity} />
          </div>
        )}
      </div>

      <aside
        className={cn(
          'flex min-h-0 flex-col overflow-hidden rounded-2xl border bg-card transition-opacity',
          !quantity && 'pointer-events-none opacity-50',
        )}
        aria-label="Available tickets"
        aria-hidden={!quantity}
      >
        <div className="flex items-center justify-between gap-2 border-b px-3 py-2.5">
          {activeSection ? (
            <button
              type="button"
              onClick={() => chooseSection(null)}
              className="flex items-center gap-1 rounded-md px-1 py-1 text-sm font-bold hover:text-primary"
            >
              <ChevronLeft className="size-4" aria-hidden="true" />
              {sectionName(activeSection)}
              <span className="sr-only">, show all sections</span>
            </button>
          ) : (
            <p className="px-1 text-sm font-bold">All sections</p>
          )}
          <Select value={sort} onValueChange={(value) => setSort(value as SortOrder)}>
            <SelectTrigger className="h-8 w-auto gap-1.5 text-xs" aria-label="Sort listings">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="price-asc">Price: low to high</SelectItem>
              <SelectItem value="price-desc">Price: high to low</SelectItem>
              <SelectItem value="section">Section</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <ul
          className={
            stacked
              ? 'flex max-h-[420px] flex-col gap-2 overflow-y-auto p-3'
              : 'flex max-h-[60vh] flex-col gap-2 overflow-y-auto p-3 lg:max-h-none lg:flex-1'
          }
        >
          {visible.length === 0 ? (
            <li className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
              No seats together for {ticketsLabel}. Try fewer tickets.
            </li>
          ) : (
            visible.map((listing) => (
              <li key={listing.id}>
                <ListingCard
                  listing={listing}
                  quantity={effectiveQuantity}
                  selected={listing.id === selectedListingId}
                  onSelect={() => chooseListing(listing)}
                />
              </li>
            ))
          )}
        </ul>
        <p className="px-4 pb-2 text-center text-xs text-muted-foreground" aria-live="polite">
          Showing {visible.length} of {eligible.length}
        </p>

        <div className="flex flex-col gap-3 border-t bg-muted/40 p-4">
          {selectedListing && quantity ? (
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">
                  {sectionName(selectedListing.sectionCode)}
                  {selectedListing.row ? ` · Row ${selectedListing.row}` : ''} · {quantity} ×{' '}
                  {formatMoney(selectedListing.price, selectedListing.currency)}
                </p>
                <p className="text-lg font-bold">
                  Total {formatMoney(orderTotal(selectedListing.price, quantity), selectedListing.currency)}
                </p>
              </div>
              {!onSelectionChange && (
                <Button
                  disabled={!onContinue || continuing}
                  title={onContinue ? undefined : 'Preview only'}
                  onClick={() => onContinue?.(selectedListing, quantity)}
                >
                  {continuing ? 'Reserving…' : 'Continue'}
                </Button>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Tap a highlighted section on the map or pick a listing.</p>
          )}
          <p className="flex items-center gap-1.5 text-xs font-medium text-primary">
            <BadgeCheck className="size-4 shrink-0" aria-hidden="true" />
            {ALL_IN_PRICING_NOTE}
          </p>
        </div>
      </aside>
    </div>
  )
}
