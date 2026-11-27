import { buildAranetaColiseumMap } from '@/lib/seat-map/templates/araneta-coliseum'
import { buildMoaArenaMap } from '@/lib/seat-map/templates/moa-arena'
import { buildPhilippineSportsStadiumMap } from '@/lib/seat-map/templates/philippine-sports-stadium'
import { buildPhilippineArenaMap } from '@/lib/seat-map/templates/philippine-arena'
import { buildSmSeasideArenaMap } from '@/lib/seat-map/templates/sm-seaside-arena'
import { buildRajamangalaStadiumMap } from '@/lib/seat-map/templates/rajamangala-stadium'
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

export const MOCK_ARENA_MAP: VenueMap = buildPhilippineArenaMap('philippine-arena')

export const MOCK_ARENA_EVENT: SeatMapEvent = {
  id: 'evt-bruno-mars-ph',
  name: 'Bruno Mars Live',
  dateLabel: 'Sat, 15 May 2027 · 7:00 PM',
  venue: 'Philippine Arena, Bulacan',
  layoutId: MOCK_ARENA_MAP.id,
  seatMapEnabled: true,
}

export const MOCK_ARENA_LISTINGS: Listing[] = [
  listing('a-floor', 'FLOOR', null, 10, 15750, { ...standing, featured: true }),
  listing('a-106', '106', 'B', 4, 23750, { viewNote: 'Clear view' }),
  listing('a-110', '110', 'F', 2, 21400),
  listing('a-205', '205', 'D', 4, 18750, { originalPrice: 21000 }),
  listing('a-212', '212', 'H', 6, 15200),
  listing('a-219', '219', 'C', 2, 13500),
  listing('a-308', '308', 'J', 4, 8750),
  listing('a-315', '315', 'E', 2, 6900),
  listing('a-410', '410', 'K', 8, 3250),
  listing('a-421', '421', 'M', 4, 2400, { viewNote: 'Aisle seat' }),
  listing('a-430', '430', 'P', 2, 1500),
  listing('a-418', '418', 'G', 0, 2100, { status: 'sold_out' }),
]

export const MOCK_ARANETA_MAP: VenueMap = buildAranetaColiseumMap('araneta-coliseum')

export const MOCK_ARANETA_EVENT: SeatMapEvent = {
  id: 'evt-araneta-ph',
  name: 'Live at the Big Dome',
  dateLabel: 'Fri, 21 May 2027 · 8:00 PM',
  venue: 'Smart Araneta Coliseum, Quezon City',
  layoutId: MOCK_ARANETA_MAP.id,
  seatMapEnabled: true,
}

export const MOCK_ARANETA_LISTINGS: Listing[] = [
  listing('c-103', '103', 'C', 4, 20350, { featured: true, viewNote: 'Clear view' }),
  listing('c-101', '101', 'F', 2, 18900),
  listing('c-106', '106', 'D', 4, 12400),
  listing('c-115', '115', 'B', 2, 11800, { originalPrice: 13500 }),
  listing('c-201', '201', 'E', 6, 7900),
  listing('c-221', '221', 'H', 2, 5870),
  listing('c-205', '205', 'A', 4, 6400),
  listing('c-401', '401', 'K', 8, 3200),
  listing('c-421', '421', 'M', 4, 2600, { viewNote: 'Aisle seat' }),
  listing('c-ga', 'GA', null, 10, 950, standing),
  listing('c-404', '404', 'G', 0, 2900, { status: 'sold_out' }),
]

export const MOCK_CEBU_MAP: VenueMap = buildSmSeasideArenaMap('sm-seaside-arena')

export const MOCK_CEBU_EVENT: SeatMapEvent = {
  id: 'evt-katseye-cebu',
  name: 'KATSEYE: The Wildworld Tour - Cebu',
  dateLabel: 'Sun, 7 Feb 2027 · 8:00 PM',
  venue: 'SM Seaside Arena, Cebu City',
  layoutId: MOCK_CEBU_MAP.id,
  seatMapEnabled: true,
}

export const MOCK_CEBU_LISTINGS: Listing[] = [
  listing('sc-standing', 'STANDING', null, 6, 21000, { ...standing, featured: true }),
  listing('sc-206', '206', 'C', 4, 15200, { viewNote: 'Close to stage' }),
  listing('sc-205', '205', 'B', 2, 14800),
  listing('sc-204', '204', 'D', 4, 13900),
  listing('sc-203', '203', 'A', 2, 13500),
  listing('sc-202', '202', 'E', 2, 12600),
  listing('sc-213', '213', 'C', 4, 15000),
  listing('sc-215', '215', 'B', 2, 13800, { originalPrice: 15200 }),
  listing('sc-216', '216', 'F', 4, 13200),
  listing('sc-218', '218', 'G', 6, 11900, { viewNote: 'Center view' }),
  listing('sc-406', '406', 'H', 2, 8600),
  listing('sc-413', '413', 'J', 4, 8400),
  listing('sc-418', '418', 'K', 4, 7900, { viewNote: 'Center view' }),
  listing('sc-605', '605', 'M', 2, 4200),
  listing('sc-505', '505', 'L', 2, 5600),
  listing('sc-604', '604', 'M', 4, 4100),
  listing('sc-603b', '603B', 'N', 2, 3900),
  listing('sc-606', '606', 'N', 2, 4000),
  listing('sc-613', '613', 'N', 4, 4000),
  listing('sc-513', '513', 'L', 2, 5500),
  listing('sc-614', '614', 'M', 2, 4200),
  listing('sc-616b', '616B', 'N', 4, 3800),
  listing('sc-617a', '617A', 'N', 2, 3700),
  listing('sc-617b', '617B', 'P', 6, 3600),
  listing('sc-602b', '602B', 'N', 2, 3700),
  listing('sc-601', '601', 'P', 4, 3500),
  listing('sc-618', '618', 'P', 2, 3500, { viewNote: 'Aisle seat' }),
  listing('sc-401', '401', 'K', 0, 7800, { status: 'sold_out' }),
]

export const MOCK_BANGKOK_MAP: VenueMap = buildRajamangalaStadiumMap('rajamangala-stadium')

export const MOCK_BANGKOK_EVENT: SeatMapEvent = {
  id: 'evt-bts-bangkok',
  name: 'BTS World Tour - Bangkok',
  dateLabel: 'Date to be announced',
  venue: 'Rajamangala National Stadium, Bangkok',
  layoutId: MOCK_BANGKOK_MAP.id,
  seatMapEnabled: true,
}

export const MOCK_BANGKOK_LISTINGS: Listing[] = [
  listing('bk-v2', 'V2', 'C', 1, 148172, { featured: true, viewNote: 'Next to the catwalk' }),
  listing('bk-v10', 'V10', 'B', 1, 132318, { viewNote: 'Next to the catwalk' }),
  listing('bk-v1', 'V1', 'F', 2, 128400),
  listing('bk-v5', 'V5', 'D', 4, 118900, { viewNote: 'Close to stage' }),
  listing('bk-e1n', 'E1N', 'K', 1, 120516),
  listing('bk-e1e', 'E1E', 'K', 1, 120516),
  listing('bk-w1e', 'W1E', 'H', 1, 85228),
  listing('bk-a13', 'A13', 'J', 4, 76500),
  listing('bk-a1', 'A1', 'G', 2, 74900, { originalPrice: 79900 }),
  listing('bk-w1q', 'W1Q', 'M', 1, 62476),
  listing('bk-a8', 'A8', 'L', 2, 54296),
  listing('bk-a19', 'A19', 'N', 4, 52800),
  listing('bk-a21', 'A21', 'P', 1, 49530),
  listing('bk-w1c', 'W1C', 'R', 1, 49068),
  listing('bk-w3d', 'W3D', 'T', 1, 47180),
  listing('bk-n1f', 'N1F', 'S', 2, 44500, { viewNote: 'Side view' }),
  listing('bk-s1f', 'S1F', 'S', 4, 43900, { viewNote: 'Side view' }),
  listing('bk-e2k', 'E2K', 'U', 2, 36800),
  listing('bk-w2j', 'W2J', 'U', 6, 35900, { viewNote: 'Center view' }),
  listing('bk-e3j', 'E3J', 'Z', 4, 24600),
  listing('bk-a14', 'A14', 'E', 0, 79000, { status: 'sold_out' }),
]
