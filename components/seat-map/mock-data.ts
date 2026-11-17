import { buildMoaArenaMap } from '@/lib/seat-map/templates/moa-arena'
import { buildPhilippineSportsStadiumMap } from '@/lib/seat-map/templates/philippine-sports-stadium'
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

export const MOCK_STADIUM_MAP: VenueMap = buildPhilippineSportsStadiumMap('philippine-sports-stadium')

export const MOCK_STADIUM_EVENT: SeatMapEvent = {
  id: 'evt-bts-arirang',
  name: 'BTS World Tour: Arirang',
  dateLabel: 'Sat, 13 Mar 2027 · 7:00 PM',
  venue: 'Philippine Sports Stadium, Bulacan',
  layoutId: MOCK_STADIUM_MAP.id,
  seatMapEnabled: true,
}

const standing = { seatedTogether: false, viewNote: 'Standing only' }

export const MOCK_STADIUM_LISTINGS: Listing[] = [
  listing('s-floor-a', 'FLOOR A', null, 10, 48500, { ...standing, featured: true }),
  listing('s-floor-b', 'FLOOR B', null, 6, 42900, standing),
  listing('s-floor-c', 'FLOOR C', null, 4, 39800, { ...standing, originalPrice: 45000 }),
  listing('s-floor-d', 'FLOOR D', null, 2, 41200, standing),
  listing('s-101', '101', 'C', 4, 28400),
  listing('s-106', '106', 'F', 2, 24750),
  listing('s-112', '112', 'A', 6, 31900, { viewNote: 'Aisle seat' }),
  listing('s-118', '118', 'H', 4, 22600),
  listing('s-123', '123', 'D', 2, 26300),
  listing('s-203', '203', 'K', 4, 14900),
  listing('s-209', '209', 'B', 2, 13200),
  listing('s-214', '214', 'M', 8, 11800),
  listing('s-221', '221', 'E', 4, 12450, { originalPrice: 15000 }),
  listing('s-226', '226', 'G', 0, 10900, { status: 'sold_out' }),
]
