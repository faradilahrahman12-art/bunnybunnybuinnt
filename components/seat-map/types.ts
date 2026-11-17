export type SectionKind = 'seat' | 'floor' | 'stage'

export type MapSection = {
  code: string
  kind: SectionKind
  path: string
  labelX: number
  labelY: number
  labelSize: number
}

export type VenueMap = {
  id: string
  name: string
  viewBox: { width: number; height: number }
  backgroundImage?: string | null
  sections: MapSection[]
}

export type ListingStatus = 'available' | 'reserved' | 'sold_out' | 'hidden'

export const LISTING_STATUS_LABELS: Record<ListingStatus, string> = {
  available: 'Available',
  reserved: 'Reserved',
  sold_out: 'Sold Out',
  hidden: 'Hidden',
}

export type Listing = {
  id: string
  sectionCode: string
  row: string | null
  seats: string | null
  available: number
  price: number
  originalPrice: number | null
  currency: string
  seatedTogether: boolean
  viewNote: string | null
  featured: boolean
  status: ListingStatus
  dateLabel?: string | null
}

export type SeatMapEvent = {
  id: string
  name: string
  dateLabel: string
  venue: string
  layoutId: string | null
  seatMapEnabled: boolean
}

export type SortOrder = 'price-asc' | 'price-desc' | 'section'

export const LOW_STOCK_THRESHOLD = 4

export const ALL_IN_PRICING_NOTE = 'All fees included. No additional service charges.'

export function formatMoney(amount: number, currency: string) {
  const symbol = currency === 'PHP' ? '₱' : currency
  return `${symbol}${amount.toLocaleString('en-PH', { maximumFractionDigits: 0 })}`
}

export function sectionName(code: string) {
  if (code === 'FLOOR') return 'Floor'
  return /^\d/.test(code) ? `Section ${code}` : code
}

/** All-in pricing: the listed price is final, so the total is price × quantity with no added fees. */
export function orderTotal(price: number, quantity: number) {
  return price * quantity
}

export function isCustomerVisible(listing: Listing) {
  return listing.status === 'available' && listing.available > 0
}
