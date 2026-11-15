'use client'

import { useState } from 'react'
import { CalendarCog, Eye, LayoutGrid, Ticket } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MOCK_EVENTS, MOCK_LISTINGS, MOCK_VENUE_MAP } from '@/components/seat-map/mock-data'
import type { Listing, SeatMapEvent, VenueMap } from '@/components/seat-map/types'
import { SeatMapExplorer } from '@/components/seat-map/seat-map-explorer'
import { LayoutEditor } from './layout-editor'
import { InventoryManager } from './inventory-manager'
import { EventSettings } from './event-settings'

type Tab = 'events' | 'layouts' | 'inventory' | 'preview'

const TABS: { id: Tab; label: string; icon: typeof Ticket }[] = [
  { id: 'events', label: 'Events', icon: CalendarCog },
  { id: 'layouts', label: 'Venue layouts', icon: LayoutGrid },
  { id: 'inventory', label: 'Ticket inventory', icon: Ticket },
  { id: 'preview', label: 'Customer preview', icon: Eye },
]

export type InventoryByEvent = Record<string, Listing[]>

export function SeatMapAdmin() {
  const [tab, setTab] = useState<Tab>('events')
  const [layouts, setLayouts] = useState<VenueMap[]>([MOCK_VENUE_MAP])
  const [events, setEvents] = useState<SeatMapEvent[]>(MOCK_EVENTS)
  const [inventory, setInventory] = useState<InventoryByEvent>({ [MOCK_EVENTS[0].id]: MOCK_LISTINGS })
  const [eventId, setEventId] = useState(MOCK_EVENTS[0].id)

  const event = events.find((e) => e.id === eventId) ?? events[0]
  const layout = layouts.find((l) => l.id === event.layoutId) ?? null
  const listings = inventory[event.id] ?? []

  function updateLayout(next: VenueMap) {
    setLayouts((current) => current.map((l) => (l.id === next.id ? next : l)))
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <nav aria-label="Seat map admin sections" className="flex gap-1 overflow-x-auto rounded-xl border bg-card p-1">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              aria-current={tab === id ? 'page' : undefined}
              className={cn(
                'flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                tab === id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent hover:text-foreground',
              )}
            >
              <Icon className="size-4" aria-hidden="true" />
              {label}
            </button>
          ))}
        </nav>
        {(tab === 'inventory' || tab === 'preview') && (
          <label className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Event</span>
            <select
              value={event.id}
              onChange={(e) => setEventId(e.target.value)}
              className="h-9 rounded-md border bg-background px-3 text-sm"
            >
              {events.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {tab === 'events' && (
        <EventSettings
          events={events}
          layouts={layouts}
          inventory={inventory}
          onChange={setEvents}
          onManageInventory={(id) => {
            setEventId(id)
            setTab('inventory')
          }}
          onPreview={(id) => {
            setEventId(id)
            setTab('preview')
          }}
        />
      )}

      {tab === 'layouts' && (
        <LayoutEditor
          layouts={layouts}
          events={events}
          onCreate={(next) => setLayouts((current) => [...current, next])}
          onUpdate={updateLayout}
          onDelete={(id) => {
            setLayouts((current) => current.filter((l) => l.id !== id))
            setEvents((current) => current.map((e) => (e.layoutId === id ? { ...e, layoutId: null, seatMapEnabled: false } : e)))
          }}
        />
      )}

      {tab === 'inventory' && (
        <InventoryManager
          event={event}
          layout={layout}
          listings={listings}
          onChange={(next) => setInventory((current) => ({ ...current, [event.id]: next }))}
        />
      )}

      {tab === 'preview' &&
        (layout ? (
          <div className="flex flex-col gap-3">
            {!event.seatMapEnabled && (
              <p className="rounded-xl border border-dashed p-3 text-sm text-muted-foreground">
                The seat map is disabled for this event, so customers currently see the existing ordering interface.
                This is how it will look once enabled.
              </p>
            )}
            <SeatMapExplorer key={`${event.id}-${layout.id}`} map={layout} listings={listings} />
          </div>
        ) : (
          <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
            Assign a venue layout to {event.name} in the Events tab to preview its seat map.
          </p>
        ))}
    </div>
  )
}
