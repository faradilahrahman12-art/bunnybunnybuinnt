import type { Listing, MapSection, SeatMapEvent, VenueMap } from './types'

const CENTER_X = 500
const CENTER_Y = 700
const START_ANGLE = -168
const END_ANGLE = -12
const GAP_DEGREES = 0.7

type Tier = { first: number; last: number; inner: number; outer: number; labelSize: number }

const TIERS: Tier[] = [
  { first: 103, last: 113, inner: 150, outer: 245, labelSize: 18 },
  { first: 203, last: 221, inner: 255, outer: 345, labelSize: 16 },
  { first: 402, last: 435, inner: 357, outer: 485, labelSize: 14 },
]

function polar(radius: number, degrees: number): [number, number] {
  const radians = (degrees * Math.PI) / 180
  return [CENTER_X + radius * Math.cos(radians), CENTER_Y + radius * Math.sin(radians)]
}

function wedgePath(inner: number, outer: number, from: number, to: number) {
  const steps = 6
  const points: [number, number][] = []
  for (let i = 0; i <= steps; i++) points.push(polar(outer, from + ((to - from) * i) / steps))
  for (let i = steps; i >= 0; i--) points.push(polar(inner, from + ((to - from) * i) / steps))
  return `M${points.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join('L')}Z`
}

function buildTier(tier: Tier): MapSection[] {
  const count = tier.last - tier.first + 1
  const span = (END_ANGLE - START_ANGLE) / count
  return Array.from({ length: count }, (_, index) => {
    const from = START_ANGLE + span * index + GAP_DEGREES / 2
    const to = from + span - GAP_DEGREES
    const [labelX, labelY] = polar((tier.inner + tier.outer) / 2, (from + to) / 2)
    return {
      code: String(tier.first + index),
      kind: 'seat' as const,
      path: wedgePath(tier.inner, tier.outer, from, to),
      labelX,
      labelY,
      labelSize: tier.labelSize,
    }
  })
}

export const MOCK_VENUE_MAP: VenueMap = {
  id: 'layout-philippine-arena',
  name: 'Philippine Arena',
  viewBox: { width: 1000, height: 780 },
  sections: [
    ...TIERS.flatMap(buildTier),
    {
      code: 'FLOOR',
      kind: 'floor',
      path: 'M372 700 L372 640 Q500 520 628 640 L628 700 Z',
      labelX: 500,
      labelY: 650,
      labelSize: 18,
    },
    {
      code: 'STAGE',
      kind: 'stage',
      path: 'M420 712 L580 712 L580 762 L420 762 Z',
      labelX: 500,
      labelY: 738,
      labelSize: 18,
    },
  ],
}

export const MOCK_EVENT: SeatMapEvent = {
  id: 'evt-bruno-mars',
  name: 'Bruno Mars Live',
  dateLabel: 'Sat, 15 May 2027 · 7:00 PM',
  venue: 'Philippine Arena, Bulacan',
  layoutId: MOCK_VENUE_MAP.id,
  seatMapEnabled: true,
}

export const MOCK_EVENTS: SeatMapEvent[] = [
  MOCK_EVENT,
  {
    id: 'evt-blackpink',
    name: 'BLACKPINK World Tour',
    dateLabel: 'Sat, 12 Jun 2027 · 8:00 PM',
    venue: 'Philippine Arena, Bulacan',
    layoutId: MOCK_VENUE_MAP.id,
    seatMapEnabled: false,
  },
  {
    id: 'evt-ed-sheeran',
    name: 'Ed Sheeran Mathematics Tour',
    dateLabel: 'Fri, 3 Sep 2027 · 7:30 PM',
    venue: 'SM Mall of Asia Arena, Pasay',
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
  listing('l-415', '415', '12', 2, 9750, { seats: '14–15' }),
  listing('l-216', '216', '5', 0, 16800, { status: 'sold_out' }),
  listing('l-108', '108', '3', 4, 21000, { status: 'reserved' }),
  listing('l-430', '430', '22', 6, 8900, { status: 'hidden' }),
  listing('l-421', '421', '8', 4, 14100),
  listing('l-425', '425', '15', 4, 14100),
  listing('l-425b', '425', '3', 6, 15800),
  listing('l-209', '209', '20', 4, 17300),
  listing('l-211', '211', '17', 2, 12340),
  listing('l-212', '212', '4', 6, 12500, { featured: true, seats: '1–6' }),
  listing('l-214', '214', '9', 4, 17500),
  listing('l-218', '218', '11', 4, 17300),
  listing('l-110', '110', '6', 2, 18500),
  listing('l-112', '112', '2', 4, 18500),
  listing('l-113', '113', '9', 2, 15250, { viewNote: 'Side view of stage' }),
  listing('l-floor', 'FLOOR', null, 10, 24900, {
    seatedTogether: false,
    viewNote: 'Standing, general admission',
    featured: true,
  }),
]
