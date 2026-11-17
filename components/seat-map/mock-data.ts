import { buildMoaArenaMap } from '@/lib/seat-map/templates/moa-arena'
import type { Listing, SeatMapEvent, VenueMap } from './types'

export const MOCK_VENUE_MAP: VenueMap = buildMoaArenaMap('moa-arena')

export const MOCK_EVENT: SeatMapEvent = {
  id: 'evt-katseye',
  name: 'KATSEYE: The Wildworld Tour',
  dateLabel: 'Fri, 29 Jan 2027 · 8:00 PM',
  venue: 'SM Mall of Asia Arena, Pasay',
  layoutId: MOCK_VENUE_MAP.id,
  seatMapEnabled: true,
}

export const MOCK_EVENTS: SeatMapEvent[] = [
  MOCK_EVENT,
  {
    id: 'evt-blackpink',
    name: 'BLACKPINK World Tour',
    dateLabel: 'Sat, 12 Jun 2027 · 8:00 PM',
    venue: 'SM Mall of Asia Arena, Pasay',
    layoutId: MOCK_VENUE_MAP.id,
    seatMapEnabled: false,
  },
  {
    id: 'evt-ed-sheeran',
    name: 'Ed Sheeran Mathematics Tour',
    dateLabel: 'Fri, 3 Sep 2027 · 7:30 PM',
    venue: 'Philippine Arena, Bulacan',
    layoutId: null,
    seatMapEnabled: false,
  },
]

function listing(
  id: string,
  sectionCode: string,
  row: string | null,
  available: number,
  price: number,
  extra: Partial<Listing> = {},
): Listing {
  return {
    id,
    sectionCode,
    row,
    seats: null,
    available,
    price,
    originalPrice: null,
    currency: 'PHP',
    seatedTogether: true,
    viewNote: 'Clear view',
    featured: false,
    status: 'available',
    ...extra,
  }
}

export const MOCK_LISTINGS: Listing[] = [
  listing('l-516', '516', 'D', 4, 17610, { featured: true }),
  listing('l-svip', 'SVIP', null, 8, 61294, { seatedTogether: false, viewNote: 'Standing only' }),
  listing('l-504', '504', 'B', 2, 18617),
  listing('l-518', '518', 'E', 2, 18637),
  listing('l-519', '519', 'F', 2, 22554),
  listing('l-520b', '520B', 'G', 4, 18647, { originalPrice: 23999 }),
  listing('l-505', '505', 'A', 4, 19971),
  listing('l-218', '218', 'C', 4, 103605, { viewNote: 'Aisle seat' }),
  listing('l-503b', '503B', 'F', 4, 20017),
  listing('l-503b-a', '503B', 'A', 6, 32400, { viewNote: 'Aisle seat' }),
  listing('l-520a', '520A', 'E', 4, 22088),
  listing('l-502', '502', 'A', 4, 44942),
  listing('l-206', '206', 'H', 2, 23534),
  listing('l-216', '216', 'K', 0, 16800, { status: 'sold_out' }),
  listing('l-401', '401', 'C', 4, 21000, { status: 'reserved' }),
  listing('l-421', '421', 'J', 6, 15800, { status: 'hidden' }),
]
