'use client'

import { useCallback, useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarCog, Eye, LayoutGrid, Loader2, Save, Ticket } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { Listing, SeatMapEvent, VenueMap } from '@/components/seat-map/types'
import { SeatMapExplorer } from '@/components/seat-map/seat-map-explorer'
import type { AdminHoldRecord, ListingRecord, SeatMapEventRecord, VenueMapRecord } from '@/lib/seat-map/catalog'
import {
  assignEventMapAction,
  deleteVenueMapAction,
  getEventInventoryAction,
  saveListingAction,
  saveVenueMapAction,
  uploadVenueImageAction,
} from '@/app/actions/seat-map'
import { LayoutEditor } from './layout-editor'
import { InventoryManager } from './inventory-manager'
import { EventSettings } from './event-settings'
import { HoldsPanel } from './holds-panel'

type Tab = 'events' | 'layouts' | 'inventory' | 'preview'

const TABS: { id: Tab; label: string; icon: typeof Ticket }[] = [
  { id: 'events', label: 'Events', icon: CalendarCog },
  { id: 'layouts', label: 'Venue layouts', icon: LayoutGrid },
  { id: 'inventory', label: 'Ticket inventory', icon: Ticket },
  { id: 'preview', label: 'Customer preview', icon: Eye },
]

export type InventoryByEvent = Record<string, Listing[]>

type LayoutMeta = { venueName: string; pathname: string | null }

function toLayout(map: VenueMapRecord): VenueMap {
  return {
    id: String(map.id),
    name: map.name,
    viewBox: { width: map.width, height: map.height },
    backgroundImage: map.backgroundImageUrl,
    sections: map.sections,
  }
}

function toEvent(event: SeatMapEventRecord, maps: VenueMapRecord[]): SeatMapEvent {
  const map = maps.find((m) => m.id === event.mapId)
  return {
    id: String(event.id),
    name: event.title,
    dateLabel: event.dates.map((d) => d.label).join(' · ') || 'No dates',
    venue: map?.venueName || event.country,
    layoutId: event.mapId ? String(event.mapId) : null,
    seatMapEnabled: event.enabled,
  }
}

export function toListing(record: ListingRecord): Listing {
  return {
    id: String(record.id),
    sectionCode: record.sectionCode,
    row: record.rowLabel,
    seats: record.seats,
    available: record.available,
    price: record.price,
    originalPrice: record.originalPrice,
    currency: record.currency,
    seatedTogether: record.seatedTogether,
    viewNote: record.viewNote,
    featured: record.featured,
    status: record.status === 'hidden' ? 'hidden' : record.available > 0 ? 'available' : 'sold_out',
  }
}

const isSaved = (id: string) => /^\d+$/.test(id)

async function dataUrlToFile(dataUrl: string) {
  const blob = await (await fetch(dataUrl)).blob()
  return new File([blob], 'venue', { type: blob.type })
}

export function SeatMapAdmin({ maps, events: eventRecords }: { maps: VenueMapRecord[]; events: SeatMapEventRecord[] }) {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('events')
  const [layouts, setLayouts] = useState<VenueMap[]>(() => maps.map(toLayout))
  const [meta, setMeta] = useState<Record<string, LayoutMeta>>(() =>
    Object.fromEntries(maps.map((m) => [String(m.id), { venueName: m.venueName, pathname: m.backgroundImagePathname }])),
  )
  const [dirty, setDirty] = useState<Set<string>>(new Set())
  const events = eventRecords.map((e) => toEvent(e, maps))
  const [eventId, setEventId] = useState(events[0]?.id ?? '')
  const [records, setRecords] = useState<Record<string, ListingRecord[]>>({})
  const [holds, setHolds] = useState<AdminHoldRecord[]>([])
  const [saving, startSaving] = useTransition()
  const [loadingInventory, setLoadingInventory] = useState(false)

  useEffect(() => {
    setLayouts(maps.map(toLayout))
    setDirty(new Set())
  }, [maps])

  const event = events.find((e) => e.id === eventId) ?? events[0]
  const layout = layouts.find((l) => l.id === event?.layoutId) ?? null
  const inventory: InventoryByEvent = Object.fromEntries(
    Object.entries(records).map(([id, list]) => [id, list.map(toListing)]),
  )
  const listings = event ? (inventory[event.id] ?? []) : []

  const loadInventory = useCallback(async (id: string) => {
    if (!id) return
    setLoadingInventory(true)
    const result = await getEventInventoryAction(Number(id))
    setLoadingInventory(false)
    if (!result.ok) return toast.error(result.error)
    setRecords((current) => ({ ...current, [id]: result.data.listings }))
    setHolds(result.data.holds)
  }, [])

  useEffect(() => {
    if (event && (tab === 'inventory' || tab === 'preview')) void loadInventory(event.id)
  }, [event?.id, tab, loadInventory]) // eslint-disable-line react-hooks/exhaustive-deps

  function markDirty(id: string) {
    setDirty((current) => new Set(current).add(id))
  }

  function saveLayouts() {
    startSaving(async () => {
      for (const id of dirty) {
        const current = layouts.find((l) => l.id === id)
        if (!current) continue
        let backgroundImageUrl = current.backgroundImage ?? null
        let backgroundImagePathname = meta[id]?.pathname ?? null
        if (backgroundImageUrl?.startsWith('data:')) {
          const form = new FormData()
          form.set('file', await dataUrlToFile(backgroundImageUrl))
          const upload = await uploadVenueImageAction(form)
          if (!upload.ok) return void toast.error(`${current.name}: ${upload.error}`)
          backgroundImageUrl = upload.data.url
          backgroundImagePathname = upload.data.pathname
        }
        if (!backgroundImageUrl) backgroundImagePathname = null
        const result = await saveVenueMapAction({
          id: isSaved(id) ? Number(id) : null,
          name: current.name,
          venueName: meta[id]?.venueName || current.name,
          width: current.viewBox.width,
          height: current.viewBox.height,
          backgroundImageUrl,
          backgroundImagePathname,
          sections: current.sections,
        })
        if (!result.ok) return void toast.error(`${current.name}: ${result.error}`)
      }
      toast.success('Venue layouts saved.')
      setDirty(new Set())
      router.refresh()
    })
  }

  function changeEvents(next: SeatMapEvent[]) {
    const changed = next.find((n) => {
      const prev = events.find((e) => e.id === n.id)
      return prev && (prev.layoutId !== n.layoutId || prev.seatMapEnabled !== n.seatMapEnabled)
    })
    if (!changed) return
    if (changed.layoutId && !isSaved(changed.layoutId)) {
      return void toast.error('Save the new layout before assigning it to an event.')
    }
    startSaving(async () => {
      const result = await assignEventMapAction({
        eventId: Number(changed.id),
        mapId: changed.layoutId ? Number(changed.layoutId) : null,
        enabled: changed.seatMapEnabled,
      })
      if (!result.ok) return void toast.error(result.error)
      toast.success(`${changed.name} updated.`)
      router.refresh()
    })
  }

  function changeListings(next: Listing[]) {
    if (!event) return
    const saved = records[event.id] ?? []
    const nextIds = new Set(next.map((l) => l.id))
    const toSave: { listing: Listing; record?: ListingRecord }[] = []
    for (const listing of next) {
      const record = saved.find((r) => String(r.id) === listing.id)
      const before = record ? toListing(record) : null
      if (!before || JSON.stringify(before) !== JSON.stringify(listing)) toSave.push({ listing, record })
    }
    for (const record of saved) {
      if (!nextIds.has(String(record.id))) toSave.push({ listing: { ...toListing(record), status: 'hidden' }, record })
    }
    startSaving(async () => {
      for (const { listing, record } of toSave) {
        const result = await saveListingAction({
          id: record?.id ?? null,
          eventId: Number(event.id),
          eventDateId: record?.eventDateId ?? null,
          sectionCode: listing.sectionCode,
          rowLabel: listing.row,
          seats: listing.seats,
          quantityTotal: listing.available + (record?.quantityHeld ?? 0) + (record?.quantitySold ?? 0),
          maxPerOrder: record?.maxPerOrder ?? 10,
          price: listing.price,
          originalPrice: listing.originalPrice,
          seatedTogether: listing.seatedTogether,
          viewNote: listing.viewNote,
          featured: listing.featured,
          status: listing.status === 'hidden' ? 'hidden' : 'available',
        })
        if (!result.ok) {
          toast.error(result.error)
          break
        }
      }
      await loadInventory(event.id)
      if (toSave.length) toast.success('Inventory saved.')
    })
  }

  if (!event) {
    return (
      <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
        Create a Resale event first, then return here to attach a seat map.
      </p>
    )
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
        <div className="flex items-center gap-3">
          {(saving || loadingInventory) && <Loader2 className="size-4 animate-spin text-muted-foreground" aria-label="Saving" />}
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
      </div>

      {tab === 'events' && (
        <EventSettings
          events={events}
          layouts={layouts.filter((l) => isSaved(l.id))}
          inventory={inventory}
          onChange={changeEvents}
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
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-2 rounded-xl border bg-card p-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              {dirty.size > 0
                ? `${dirty.size} layout${dirty.size === 1 ? '' : 's'} with unsaved changes. Images upload to Blob on save.`
                : 'All layouts are saved to the database.'}
            </p>
            <Button onClick={saveLayouts} disabled={dirty.size === 0 || saving}>
              {saving ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Save className="size-4" aria-hidden="true" />}
              Save layouts
            </Button>
          </div>
          <LayoutEditor
            layouts={layouts}
            events={events}
            onCreate={(next) => {
              setLayouts((current) => [...current, next])
              setMeta((current) => ({ ...current, [next.id]: { venueName: next.name, pathname: null } }))
              markDirty(next.id)
            }}
            onUpdate={(next) => {
              setLayouts((current) => current.map((l) => (l.id === next.id ? next : l)))
              markDirty(next.id)
            }}
            onDelete={(id) => {
              if (!isSaved(id)) {
                setLayouts((current) => current.filter((l) => l.id !== id))
                setDirty((current) => {
                  const nextDirty = new Set(current)
                  nextDirty.delete(id)
                  return nextDirty
                })
                return
              }
              startSaving(async () => {
                const result = await deleteVenueMapAction(Number(id))
                if (!result.ok) return void toast.error(result.error)
                toast.success('Layout deleted.')
                router.refresh()
              })
            }}
          />
        </div>
      )}

      {tab === 'inventory' && (
        <div className="flex flex-col gap-5">
          <InventoryManager event={event} layout={layout} listings={listings} onChange={changeListings} />
          <HoldsPanel holds={holds} onChanged={() => loadInventory(event.id)} />
        </div>
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
