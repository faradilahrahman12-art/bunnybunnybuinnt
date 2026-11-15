'use client'

import { Eye, Ticket } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { SeatMapEvent, VenueMap } from '@/components/seat-map/types'
import type { InventoryByEvent } from './seat-map-admin'

type Props = {
  events: SeatMapEvent[]
  layouts: VenueMap[]
  inventory: InventoryByEvent
  onChange: (events: SeatMapEvent[]) => void
  onManageInventory: (eventId: string) => void
  onPreview: (eventId: string) => void
}

export function EventSettings({ events, layouts, inventory, onChange, onManageInventory, onPreview }: Props) {
  function update(id: string, patch: Partial<SeatMapEvent>) {
    onChange(events.map((e) => (e.id === id ? { ...e, ...patch } : e)))
  }

  return (
    <ul className="flex flex-col gap-3">
      {events.map((event) => {
        const listingCount = inventory[event.id]?.length ?? 0
        const switchId = `seat-map-enabled-${event.id}`
        return (
          <li key={event.id} className="flex flex-col gap-4 rounded-2xl border bg-card p-4 lg:flex-row lg:items-center">
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <p className="font-semibold">{event.name}</p>
              <p className="text-sm text-muted-foreground">
                {event.dateLabel} · {event.venue}
              </p>
              <p className="text-xs text-muted-foreground">
                {listingCount} {listingCount === 1 ? 'listing' : 'listings'}
              </p>
            </div>

            <label className="flex flex-col gap-1 text-sm">
              <span className="text-xs font-medium text-muted-foreground">Venue layout</span>
              <select
                value={event.layoutId ?? ''}
                onChange={(e) =>
                  update(event.id, {
                    layoutId: e.target.value || null,
                    seatMapEnabled: e.target.value ? event.seatMapEnabled : false,
                  })
                }
                className="h-9 min-w-[200px] rounded-md border bg-background px-3 text-sm"
              >
                <option value="">No layout</option>
                {layouts.map((layout) => (
                  <option key={layout.id} value={layout.id}>
                    {layout.name}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex items-center gap-3">
              <button
                id={switchId}
                type="button"
                role="switch"
                aria-checked={event.seatMapEnabled}
                disabled={!event.layoutId}
                onClick={() => update(event.id, { seatMapEnabled: !event.seatMapEnabled })}
                className={cn(
                  'relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-40',
                  event.seatMapEnabled ? 'bg-primary' : 'bg-muted-foreground/30',
                )}
              >
                <span
                  className={cn(
                    'absolute left-0.5 top-0.5 size-5 rounded-full bg-background shadow transition-transform',
                    event.seatMapEnabled && 'translate-x-5',
                  )}
                />
              </button>
              <label htmlFor={switchId} className="text-sm">
                Enable Interactive Seat Map
                <span className="block text-xs text-muted-foreground">
                  {event.seatMapEnabled ? 'Customers choose seats on the map' : 'Existing ordering interface'}
                </span>
              </label>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => onManageInventory(event.id)}>
                <Ticket className="size-4" aria-hidden="true" />
                Inventory
              </Button>
              <Button variant="outline" size="sm" onClick={() => onPreview(event.id)} disabled={!event.layoutId}>
                <Eye className="size-4" aria-hidden="true" />
                Preview
              </Button>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
