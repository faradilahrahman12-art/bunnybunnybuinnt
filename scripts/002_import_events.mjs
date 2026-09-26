import { Client } from 'pg'

const resale = [
  { title: "BTS WORLD TOUR 'ARIRANG' IN BANGKOK", country: 'Thailand', dates: '2026-12-03 · 2026-12-05 · 2026-12-06', imageUrl: '/posters/bts-arirang.png' },
  { title: "BTS WORLD TOUR 'ARIRANG' IN SINGAPORE", country: 'Singapore', dates: '2026-12-17 · 2026-12-19 · 2026-12-20 · 2026-12-22', imageUrl: '/posters/bts-arirang.png' },
  { title: "2027 ENHYPEN WORLD TOUR 'BLOOD SAGA' IN SINGAPORE", country: 'Singapore', dates: '2027-03-14', imageUrl: '/posters/enhypen-blood-saga.png' },
  { title: "NCT 127 5TH TOUR 'NEO CITY : SEOUL - THE REDLINE'", country: 'Korea', dates: '2026-09-18 · 2026-09-19 · 2026-09-20', imageUrl: '/posters/nct-redline.png' },
  { title: 'BIGBANG 2026-2027 WORLD TOUR < XX : COSMOS > IN SINGAPORE', country: 'Singapore', dates: '2026-10-17', imageUrl: '/posters/bigbang-cosmos.png' },
  { title: 'BIGBANG 2026-2027 WORLD TOUR < XX : COSMOS > IN HANOI', country: 'Vietnam', dates: '2026-10-24 · 2026-10-25', imageUrl: '/posters/bigbang-cosmos.png' },
  { title: 'EXO PLANET #6 - EXhOrizon [dot]', country: 'Korea', dates: '2026-11-06 · 2026-11-07 · 2026-11-08', imageUrl: '/posters/exo-exhorizon.png' },
  { title: 'Stray Kids World Tour <RUN IT SINGAPORE>', country: 'Singapore', dates: '2027-03-06 · 2027-03-07', imageUrl: '/posters/straykids-runit.png' },
]

const helpToBuy = [
  { title: 'Stray Kids World Tour <RUN IT BANGKOK>', country: 'Thailand', platform: 'Ticketmaster Thailand', saleInfo: 'Membership Presale: Sep 21 · Livenation Presale: Sep 22 · General Sale: Sep 23', imageUrl: '/posters/straykids-runit.png' },
  { title: 'BIGBANG 2026-2027 WORLD TOUR <XX : COSMOS> IN MANILA', country: 'Philippines', platform: 'Ticketmaster PH', saleInfo: 'Membership Presale: Sep 17 · General Sale: Sep 21', imageUrl: '/posters/bigbang-cosmos.png' },
  { title: 'BIGBANG 2026-2027 WORLD TOUR <XX : COSMOS> IN KUALA LUMPUR', country: 'Malaysia', platform: 'Fantopia', saleInfo: 'Membership Presale: Sep 17 · General Sale: Sep 22', imageUrl: '/posters/bigbang-cosmos.png' },
  { title: 'BIGBANG 2026-2027 WORLD TOUR <XX : COSMOS> IN JAKARTA', country: 'Indonesia', platform: 'LOKET', saleInfo: 'Membership Presale: Sep 17 · General Sale: Sep 20', imageUrl: '/posters/bigbang-cosmos.png' },
  { title: '2026 DINOxPICHEOLIN [KIBOARD SHOW] – MACAU', country: 'Macao', platform: 'Fantopia', saleInfo: 'General Sale: Sep 24', imageUrl: '/posters/dino-kiboard.png' },
  { title: "NCT 127 5TH TOUR 'NEO CITY : MANILA - THE REDLINE'", country: 'Philippines', platform: 'Smtickets', saleInfo: 'Membership Presale: Oct 17 · General Sale: Oct 18', imageUrl: '/posters/nct-redline.png' },
]

const client = new Client({ connectionString: process.env.DATABASE_URL })
await client.connect()

let inserted = 0
let order = 1
for (const e of resale) {
  await client.query(
    `insert into events (type, title, country, dates, image_url, sort_order) values ($1,$2,$3,$4,$5,$6)`,
    ['resale', e.title, e.country, e.dates, e.imageUrl ?? null, order++],
  )
  inserted++
}
order = 1
for (const e of helpToBuy) {
  await client.query(
    `insert into events (type, title, country, platform, sale_info, image_url, sort_order) values ($1,$2,$3,$4,$5,$6,$7)`,
    ['help_to_buy', e.title, e.country, e.platform, e.saleInfo, e.imageUrl ?? null, order++],
  )
  inserted++
}

const { rows } = await client.query('select type, count(*)::int as n from events group by type')
console.log('[v0] inserted', inserted, 'events; totals by type:', rows)
await client.end()
