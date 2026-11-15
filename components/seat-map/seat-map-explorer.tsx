'use client'

import { useMemo, useState } from 'react'
import { BadgeCheck, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ListingCard } from './listing-card'
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
  /** Single-column layout for narrow containers such as the Submit Wizard. */
  stacked?: boolean
}

const QUANTITY_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
const PRICE_OPTIONS = [10000, 15000, 20000, 30000]

export function SeatMapExplorer({ map, listings, onContinue, continuing = false, stacked = false }: Props) {
  const [quantity, setQuantity] = useState(2)
  const [maxPrice, setMaxPrice] = useState<number | null>(null)
  const [sort, setSort] = useState<SortOrder>('price-asc')
  const [selectedSection, setSelectedSection] = useState<string | null>(null)
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null)

  const soldOutSections = useMemo(() => {
    const visibleCodes = new Set(listings.filter(isCustomerVisible).map((l) => l.sectionCode))
    return new Set(
      listings
        .filter((l) => l.status !== 'hidden' && !visibleCodes.has(l.sectionCode))
        .map((l) => l.sectionCode),
    )
  }, [listings])

  const eligible = useMemo(
    () =>
      listings.filter(
        (listing) =>
          isCustomerVisible(listing) &&
          listing.available >= quantity &&
          (maxPrice === null || listing.price <= maxPrice),
      ),
    [listings, quantity, maxPrice],
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

  const sectionOptions = useMemo(
    () => [...summaries.keys()].sort((a, b) => a.localeCompare(b, undefined, { numeric: true })),
    [summaries],
  )

  const activeSection = selectedSection && summaries.has(selectedSection) ? selectedSection : null

  const visible = useMemo(() => {
    const filtered = activeSection ? eligible.filter((l) => l.sectionCode === activeSection) : eligible
    return [...filtered].sort((a, b) => {
      if (sort === 'price-desc') return b.price - a.price
      if (sort === 'section') return a.sectionCode.localeCompare(b.sectionCode, undefined, { numeric: true })
      return a.price - b.price
    })
  }, [eligible, activeSection, sort])

  const selectedListing = eligible.find((listing) => listing.id === selectedListingId) ?? null

  function chooseSection(code: string | null) {
    setSelectedSection(code)
    if (code && selectedListing?.sectionCode !== code) setSelectedListingId(null)
  }

  function chooseListing(listing: Listing) {
    const isSame = listing.id === selectedListingId
    setSelectedListingId(isSame ? null : listing.id)
    if (!isSame) setSelectedSection(listing.sectionCode)
  }

  return (
    <div
      className={
        stacked
          ? 'flex flex-col gap-4'
          : 'flex flex-col gap-4 lg:grid lg:h-[calc(100dvh-12rem)] lg:min-h-[600px] lg:grid-cols-[minmax(0,1fr)_400px]'
      }
    >
      <div className={stacked ? 'h-[52vh] min-h-[320px] max-h-[560px]' : 'h-[58vh] min-h-[340px] lg:h-full'}>
        <VenueMap
          map={map}
          summaries={summaries}
          soldOutCodes={soldOutSections}
          selectedCode={activeSection}
          onSelect={chooseSection}
        />
      </div>

      <aside className="flex min-h-0 flex-col overflow-hidden rounded-2xl border bg-card" aria-label="Available tickets">
        <div className="grid grid-cols-2 gap-2 border-b p-3">
          <Select value={String(quantity)} onValueChange={(value) => setQuantity(Number(value))}>
            <SelectTrigger className="w-full" aria-label="Number of tickets">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {QUANTITY_OPTIONS.map((option) => (
                <SelectItem key={option} value={String(option)}>
                  {option} {option === 1 ? 'ticket' : 'tickets'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={maxPrice === null ? 'any' : String(maxPrice)}
            onValueChange={(value) => setMaxPrice(value === 'any' ? null : Number(value))}
          >
            <SelectTrigger className="w-full" aria-label="Maximum price per ticket">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any price</SelectItem>
              {PRICE_OPTIONS.map((option) => (
                <SelectItem key={option} value={String(option)}>
                  Up to {formatMoney(option, 'PHP')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={activeSection ?? 'all'}
            onValueChange={(value) => chooseSection(value === 'all' ? null : value)}
          >
            <SelectTrigger className="w-full" aria-label="Filter by section">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sections</SelectItem>
              {sectionOptions.map((code) => (
                <SelectItem key={code} value={code}>
                  {sectionName(code)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={(value) => setSort(value as SortOrder)}>
            <SelectTrigger className="w-full" aria-label="Sort listings">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="price-asc">Price: low to high</SelectItem>
              <SelectItem value="price-desc">Price: high to low</SelectItem>
              <SelectItem value="section">Section</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between gap-2 px-4 pt-3">
          <p className="text-xs text-muted-foreground" aria-live="polite">
            {visible.length} {visible.length === 1 ? 'listing' : 'listings'}
            {activeSection ? ` in ${sectionName(activeSection)}` : ''} for {quantity}{' '}
            {quantity === 1 ? 'ticket' : 'tickets'}
          </p>
          {activeSection && (
            <Button variant="ghost" size="sm" onClick={() => chooseSection(null)} className="h-7 px-2 text-xs">
              <X className="size-3.5" aria-hidden="true" />
              Clear
              <span className="sr-only"> section filter</span>
            </Button>
          )}
        </div>

        <ul
          className={
            stacked
              ? 'flex max-h-[420px] flex-col gap-3 overflow-y-auto p-3'
              : 'flex max-h-[60vh] flex-col gap-3 overflow-y-auto p-3 lg:max-h-none lg:flex-1'
          }
        >
          {visible.length === 0 ? (
            <li className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
              No listings match these filters. Try fewer tickets or a higher price.
            </li>
          ) : (
            visible.map((listing) => (
              <li key={listing.id}>
                <ListingCard
                  listing={listing}
                  quantity={quantity}
                  selected={listing.id === selectedListingId}
                  onSelect={() => chooseListing(listing)}
                />
              </li>
            ))
          )}
        </ul>

        <div className="flex flex-col gap-3 border-t bg-muted/40 p-4">
          {selectedListing ? (
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
              <Button
                disabled={!onContinue || continuing}
                title={onContinue ? undefined : 'Preview only'}
                onClick={() => onContinue?.(selectedListing, quantity)}
              >
                {continuing ? 'Reserving…' : 'Continue'}
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Select a section on the map or a listing to continue.</p>
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
