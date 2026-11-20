'use client'

import { useState } from 'react'
import { Copy, Pencil, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import {
  formatMoney,
  LISTING_STATUS_LABELS,
  sectionName,
  type Listing,
  type ListingStatus,
  type SeatMapEvent,
  type VenueMap,
} from '@/components/seat-map/types'
import { SectionPicker } from './section-picker'

type Props = {
  event: SeatMapEvent
  layout: VenueMap | null
  listings: Listing[]
  activeDateId: string | null
  onChange: (listings: Listing[]) => void
}

const ALL_DATES = ''

type FormState = {
  dateId: string
  sectionCode: string
  row: string
  seats: string
  available: string
  price: string
  status: ListingStatus
  viewNote: string
  seatedTogether: boolean
  featured: boolean
}

const EMPTY_FORM: FormState = {
  dateId: ALL_DATES,
  sectionCode: '',
  row: '',
  seats: '',
  available: '2',
  price: '',
  status: 'available',
  viewNote: 'Clear view',
  seatedTogether: true,
  featured: false,
}

const STATUS_STYLES: Record<ListingStatus, string> = {
  available: 'bg-primary/12 text-primary',
  reserved: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  sold_out: 'bg-muted text-muted-foreground',
  hidden: 'border border-dashed text-muted-foreground',
}

function toForm(listing: Listing): FormState {
  return {
    dateId: listing.dateId ?? ALL_DATES,
    sectionCode: listing.sectionCode,
    row: listing.row ?? '',
    seats: listing.seats ?? '',
    available: String(listing.available),
    price: String(listing.price),
    status: listing.status,
    viewNote: listing.viewNote ?? '',
    seatedTogether: listing.seatedTogether,
    featured: listing.featured,
  }
}

export function InventoryManager({ event, layout, listings, activeDateId, onChange }: Props) {
  const [editingId, setEditingId] = useState<string | 'new' | 'bulk' | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [copySource, setCopySource] = useState('')

  const dates = event.dates ?? []
  const activeDate = dates.find((d) => d.id === activeDateId) ?? null
  const dateLabel = (id: string | null | undefined) => dates.find((d) => d.id === id)?.label ?? 'All dates'
  const visible = activeDate ? listings.filter((l) => !l.dateId || l.dateId === activeDate.id) : listings
  const sharedCount = activeDate ? visible.filter((l) => !l.dateId).length : 0
  const copyOptions = dates.filter((d) => d.id !== activeDate?.id)

  const sellableSections = (layout?.sections ?? []).filter((s) => s.kind !== 'stage')
  const sorted = [...visible].sort((a, b) => a.sectionCode.localeCompare(b.sectionCode, undefined, { numeric: true }))
  const defaultDateId = activeDate?.id ?? ALL_DATES

  function startNew() {
    setForm({ ...EMPTY_FORM, dateId: defaultDateId, sectionCode: sellableSections[0]?.code ?? '' })
    setEditingId('new')
    setError(null)
  }

  function copyFromDate() {
    if (!activeDate || !copySource) return
    const source = listings.filter((l) => l.dateId === copySource && l.status !== 'hidden')
    if (!source.length) return setError(`${dateLabel(copySource)} has no listings to copy.`)
    const copies = source.map((l) => ({
      ...l,
      id: `l-${crypto.randomUUID().slice(0, 8)}`,
      dateId: activeDate.id,
      dateLabel: activeDate.label,
    }))
    onChange([...listings, ...copies])
    setCopySource('')
    setError(null)
  }

  function startBulk() {
    setForm({ ...EMPTY_FORM, dateId: defaultDateId, row: '', seats: '' })
    setEditingId('bulk')
    setError(null)
  }

  function startEdit(listing: Listing) {
    setForm(toForm(listing))
    setEditingId(listing.id)
    setError(null)
  }

  function save(e: React.FormEvent) {
    e.preventDefault()
    const available = Number(form.available)
    const price = Number(form.price)
    const bulkCodes = editingId === 'bulk' ? sellableSections.map((s) => s.code).filter((c) => selected.has(c)) : []
    if (editingId === 'bulk' ? !bulkCodes.length : !form.sectionCode) return setError('Choose a section.')
    if (!Number.isInteger(available) || available < 0 || available > 500) return setError('Quantity must be a whole number from 0 to 500.')
    if (!Number.isFinite(price) || price <= 0) return setError('Price must be greater than 0.')

    const status: ListingStatus = available === 0 && form.status === 'available' ? 'sold_out' : form.status
    const base: Omit<Listing, 'id'> = {
      sectionCode: form.sectionCode,
      row: form.row.trim() || null,
      seats: form.seats.trim() || null,
      available,
      price: Math.round(price),
      originalPrice: null,
      currency: 'PHP',
      seatedTogether: form.seatedTogether,
      viewNote: form.viewNote.trim() || null,
      featured: form.featured,
      status,
      dateId: form.dateId || null,
    }

    if (editingId === 'bulk') {
      const created = bulkCodes.map((sectionCode) => ({ ...base, sectionCode, id: `l-${crypto.randomUUID().slice(0, 8)}` }))
      onChange([...listings, ...created])
      setSelected(new Set())
    } else if (editingId === 'new') {
      onChange([...listings, { ...base, id: `l-${crypto.randomUUID().slice(0, 8)}` }])
    } else {
      onChange(listings.map((l) => (l.id === editingId ? { ...l, ...base } : l)))
    }
    setEditingId(null)
    setError(null)
  }

  function setStatus(id: string, status: ListingStatus) {
    onChange(listings.map((l) => (l.id === id ? { ...l, status } : l)))
  }

  function field<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  if (!layout) {
    return (
      <p className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
        Assign a venue layout to {event.name} in the Events tab before adding tickets.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-4">
    {sellableSections.length > 0 && (
      <SectionPicker
        layout={layout}
        listings={visible}
        selected={selected}
        onSelectedChange={setSelected}
        onAddTickets={startBulk}
      />
    )}
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section aria-labelledby="inventory-heading" className="flex min-w-0 flex-col gap-3 rounded-2xl border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="inventory-heading" className="font-semibold">
            {activeDate ? activeDate.label : event.name} · {visible.length} listings
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            {activeDate && copyOptions.length > 0 && (
              <div className="flex items-center gap-1">
                <select
                  value={copySource}
                  onChange={(e) => setCopySource(e.target.value)}
                  aria-label={`Copy listings into ${activeDate.label} from another date`}
                  className="h-8 rounded-md border bg-background px-2 text-xs"
                >
                  <option value="">Copy from date…</option>
                  {copyOptions.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.label}
                    </option>
                  ))}
                </select>
                <Button size="sm" variant="outline" disabled={!copySource} onClick={copyFromDate}>
                  <Copy className="size-4" aria-hidden="true" />
                  Copy
                </Button>
              </div>
            )}
            <Button size="sm" onClick={startNew}>
              <Plus className="size-4" aria-hidden="true" />
              Add tickets
            </Button>
          </div>
        </div>
        {sharedCount > 0 && (
          <p className="rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-800 dark:text-amber-200">
            {sharedCount} listing{sharedCount === 1 ? ' is' : 's are'} marked All dates and show on every date. Edit
            {sharedCount === 1 ? ' it' : ' them'} to assign a specific date.
          </p>
        )}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="text-left text-xs text-muted-foreground">
              <tr className="border-b">
                <th scope="col" className="py-2 pr-3 font-medium">Section</th>
                <th scope="col" className="py-2 pr-3 font-medium">Row</th>
                <th scope="col" className="py-2 pr-3 font-medium">Seats</th>
                <th scope="col" className="py-2 pr-3 font-medium">Qty</th>
                <th scope="col" className="py-2 pr-3 font-medium">Price (all-in)</th>
                <th scope="col" className="py-2 pr-3 font-medium">Status</th>
                <th scope="col" className="py-2 font-medium"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((listing) => (
                <tr key={listing.id} className={cn('border-b last:border-0', editingId === listing.id && 'bg-primary/5')}>
                  <td className="py-2 pr-3 font-medium">
                    {sectionName(listing.sectionCode)}
                    {dates.length > 0 && !listing.dateId && (
                      <span className="ml-2 rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-medium text-amber-800 dark:text-amber-200">
                        All dates
                      </span>
                    )}
                  </td>
                  <td className="py-2 pr-3">{listing.row ?? '—'}</td>
                  <td className="py-2 pr-3">{listing.seats ?? '—'}</td>
                  <td className="py-2 pr-3">{listing.available}</td>
                  <td className="py-2 pr-3">{formatMoney(listing.price, listing.currency)}</td>
                  <td className="py-2 pr-3">
                    <select
                      value={listing.status}
                      onChange={(e) => setStatus(listing.id, e.target.value as ListingStatus)}
                      aria-label={`Status for ${sectionName(listing.sectionCode)} row ${listing.row ?? 'none'}`}
                      className={cn('h-8 rounded-md px-2 text-xs font-medium', STATUS_STYLES[listing.status])}
                    >
                      {Object.entries(LISTING_STATUS_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-2">
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" className="size-8" onClick={() => startEdit(listing)}>
                        <Pencil className="size-4" aria-hidden="true" />
                        <span className="sr-only">Edit listing</span>
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-8 text-destructive"
                        onClick={() => {
                          onChange(listings.filter((l) => l.id !== listing.id))
                          if (editingId === listing.id) setEditingId(null)
                        }}
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                        <span className="sr-only">Delete listing</span>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {sorted.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-muted-foreground">
                    No tickets yet. Add the first listing.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground">
          Only Available listings with quantity above zero appear to customers. Sold Out and Reserved sections show gray on
          the map; Hidden listings are not shown at all.
        </p>
      </section>

      {editingId && (
        <section aria-labelledby="listing-form-heading" className="rounded-2xl border bg-card p-4">
          <form onSubmit={save} className="flex flex-col gap-3">
            <h2 id="listing-form-heading" className="font-semibold">
              {editingId === 'bulk' ? `Add tickets to ${selected.size} sections` : editingId === 'new' ? 'Add tickets' : 'Edit listing'}
            </h2>
            {dates.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="listing-date">Date</Label>
                <select
                  id="listing-date"
                  value={form.dateId}
                  onChange={(e) => field('dateId', e.target.value)}
                  className="h-9 rounded-md border bg-background px-3 text-sm"
                >
                  {dates.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.label}
                    </option>
                  ))}
                  <option value={ALL_DATES}>All dates (shared)</option>
                </select>
              </div>
            )}
            {editingId === 'bulk' ? (
              <div className="flex flex-col gap-1.5">
                <p className="text-sm font-medium">Sections</p>
                <p className="text-sm text-muted-foreground">
                  {[...selected].sort((a, b) => a.localeCompare(b, undefined, { numeric: true })).join(', ') || 'None selected'}
                </p>
                <p className="text-xs text-muted-foreground">
                  One listing is created per section with the quantity and price below. Edit each one afterwards if needed.
                </p>
              </div>
            ) : (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="listing-section">Section</Label>
              <select
                id="listing-section"
                value={form.sectionCode}
                onChange={(e) => field('sectionCode', e.target.value)}
                className="h-9 rounded-md border bg-background px-3 text-sm"
              >
                {sellableSections.map((s) => (
                  <option key={s.code} value={s.code}>
                    {sectionName(s.code)}
                  </option>
                ))}
              </select>
            </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="listing-row">Row</Label>
                <Input id="listing-row" value={form.row} onChange={(e) => field('row', e.target.value)} placeholder="Optional" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="listing-seats">Seat numbers</Label>
                <Input id="listing-seats" value={form.seats} onChange={(e) => field('seats', e.target.value)} placeholder="e.g. 14–15" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="listing-qty">Quantity</Label>
                <Input id="listing-qty" type="number" min={0} max={500} value={form.available} onChange={(e) => field('available', e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="listing-price">Price per ticket (PHP)</Label>
                <Input id="listing-price" type="number" min={1} value={form.price} onChange={(e) => field('price', e.target.value)} />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Enter the final all-in price. No fees are added at checkout.</p>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="listing-status">Status</Label>
              <select
                id="listing-status"
                value={form.status}
                onChange={(e) => field('status', e.target.value as ListingStatus)}
                className="h-9 rounded-md border bg-background px-3 text-sm"
              >
                {Object.entries(LISTING_STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="listing-note">View note</Label>
              <Input id="listing-note" value={form.viewNote} onChange={(e) => field('viewNote', e.target.value)} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.seatedTogether} onChange={(e) => field('seatedTogether', e.target.checked)} className="size-4 accent-primary" />
              Seated together
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.featured} onChange={(e) => field('featured', e.target.checked)} className="size-4 accent-primary" />
              Mark as top choice
            </label>
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <div className="flex gap-2">
              <Button type="submit">Save</Button>
              <Button type="button" variant="ghost" onClick={() => setEditingId(null)}>
                Cancel
              </Button>
            </div>
          </form>
        </section>
      )}
    </div>
    </div>
  )
}
