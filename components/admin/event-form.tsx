'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  createEvent,
  updateEvent,
  type EventInput,
  type ScheduleDateInput,
} from '@/app/actions/events'
import type { EventWithSchedule } from '@/lib/db/schema'
import { toast } from 'sonner'
import { CalendarPlus, Eye, EyeOff, Plus, Trash2 } from 'lucide-react'

type Props = {
  event?: EventWithSchedule
  defaultType: 'resale' | 'help_to_buy'
  onDone: () => void
}

function initialSchedule(event?: EventWithSchedule): ScheduleDateInput[] {
  if (event?.schedule?.length) {
    return event.schedule.map((d) => ({
      label: d.label,
      sections: d.sections.map((s) => ({ name: s.name, quantity: s.quantity, price: s.price })),
    }))
  }
  return []
}

export function EventForm({ event, defaultType, onDone }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [type, setType] = useState<'resale' | 'help_to_buy'>(
    (event?.type as 'resale' | 'help_to_buy') ?? defaultType,
  )
  const [title, setTitle] = useState(event?.title ?? '')
  const [country, setCountry] = useState(event?.country ?? '')
  const [platform, setPlatform] = useState(event?.platform ?? '')
  const [saleInfo, setSaleInfo] = useState(event?.saleInfo ?? '')
  const [imageUrl, setImageUrl] = useState(event?.imageUrl ?? '')
  const [seatMapUrl, setSeatMapUrl] = useState(event?.seatMapUrl ?? '')
  const [sortOrder, setSortOrder] = useState(event?.sortOrder ?? 0)
  const [hidden, setHidden] = useState(event?.hidden ?? false)
  const [schedule, setSchedule] = useState<ScheduleDateInput[]>(initialSchedule(event))

  function addDate() {
    setSchedule((s) => [
      ...s,
      { label: '', sections: [{ name: 'General Admission', quantity: 20, price: 120 }] },
    ])
  }
  function removeDate(di: number) {
    setSchedule((s) => s.filter((_, i) => i !== di))
  }
  function setDateLabel(di: number, label: string) {
    setSchedule((s) => s.map((d, i) => (i === di ? { ...d, label } : d)))
  }
  function addSection(di: number) {
    setSchedule((s) =>
      s.map((d, i) =>
        i === di ? { ...d, sections: [...d.sections, { name: '', quantity: 0, price: 0 }] } : d,
      ),
    )
  }
  function removeSection(di: number, si: number) {
    setSchedule((s) =>
      s.map((d, i) => (i === di ? { ...d, sections: d.sections.filter((_, j) => j !== si) } : d)),
    )
  }
  function setSection(
    di: number,
    si: number,
    patch: Partial<{ name: string; quantity: number; price: number }>,
  ) {
    setSchedule((s) =>
      s.map((d, i) =>
        i === di
          ? { ...d, sections: d.sections.map((sec, j) => (j === si ? { ...sec, ...patch } : sec)) }
          : d,
      ),
    )
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !country.trim()) {
      toast.error('Title and country are required')
      return
    }
    const input: EventInput = {
      type,
      title,
      country,
      platform,
      saleInfo,
      imageUrl,
      seatMapUrl,
      hidden,
      sortOrder,
      schedule,
    }
    startTransition(async () => {
      try {
        if (event) {
          await updateEvent(event.id, input)
          toast.success('Event updated')
        } else {
          await createEvent(input)
          toast.success('Event created')
        }
        router.refresh()
        onDone()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Something went wrong')
      }
    })
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-xl border border-border bg-muted/30 p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Type</Label>
          <Select value={type} onValueChange={(v) => setType(v as 'resale' | 'help_to_buy')}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="resale">Resale — Available Now</SelectItem>
              <SelectItem value="help_to_buy">Help to Buy</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="country">Country</Label>
          <Input
            id="country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            placeholder="e.g. Singapore"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Concert / tour name"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="platform">
            Platform <span className="text-xs font-normal text-muted-foreground">(optional)</span>
          </Label>
          <Input
            id="platform"
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            placeholder="e.g. Ticketmaster Thailand"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="saleInfo">
            Sale Info <span className="text-xs font-normal text-muted-foreground">(optional)</span>
          </Label>
          <Textarea
            id="saleInfo"
            value={saleInfo}
            onChange={(e) => setSaleInfo(e.target.value)}
            placeholder="e.g. Membership Presale: Sep 21 · General Sale: Sep 23"
            rows={2}
          />
        </div>
      </div>

      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <Label>Dates &amp; Sections</Label>
          <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={addDate}>
            <CalendarPlus className="size-3.5" />
            Add Date
          </Button>
        </div>

        {schedule.length === 0 && (
          <p className="rounded-lg border border-dashed border-border bg-background/60 px-3 py-4 text-center text-xs text-muted-foreground">
            No dates yet. Add a date, then add sections with ticket quantities for that date.
          </p>
        )}

        <div className="space-y-3">
          {schedule.map((d, di) => (
            <div key={di} className="rounded-lg border border-border bg-background p-3">
              <div className="flex items-center gap-2">
                <Input
                  value={d.label}
                  onChange={(e) => setDateLabel(di, e.target.value)}
                  placeholder="e.g. 2026-12-03 or Fri, Dec 3"
                  className="h-9"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="shrink-0 text-destructive hover:text-destructive"
                  onClick={() => removeDate(di)}
                  aria-label="Remove date"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>

              <div className="mt-3 space-y-2">
                <div className="grid grid-cols-[1fr_84px_72px_32px] gap-2 px-0.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  <span>Section</span>
                  <span>Price</span>
                  <span>Qty</span>
                  <span className="sr-only">Remove</span>
                </div>
                {d.sections.map((sec, si) => (
                  <div key={si} className="grid grid-cols-[1fr_84px_72px_32px] items-center gap-2">
                    <Input
                      value={sec.name}
                      onChange={(e) => setSection(di, si, { name: e.target.value })}
                      placeholder="e.g. VIP / Cat 1 / Standing"
                      className="h-9"
                    />
                    <div className="relative">
                      <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                        ₱
                      </span>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={sec.price}
                        onChange={(e) => setSection(di, si, { price: Number(e.target.value) })}
                        className="h-9 pl-5"
                      />
                    </div>
                    <Input
                      type="number"
                      min={0}
                      value={sec.quantity}
                      onChange={(e) => setSection(di, si, { quantity: Number(e.target.value) })}
                      className="h-9"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8 text-muted-foreground hover:text-destructive"
                      onClick={() => removeSection(di, si)}
                      aria-label="Remove section"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-primary hover:text-primary"
                  onClick={() => addSection(di)}
                >
                  <Plus className="size-3.5" />
                  Add Section
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="imageUrl">Image URL</Label>
          <Input
            id="imageUrl"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="/posters/..."
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sortOrder">Sort Order</Label>
          <Input
            id="sortOrder"
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(Number(e.target.value))}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="seatMapUrl">Seat Map Image URL</Label>
        <Input
          id="seatMapUrl"
          value={seatMapUrl}
          onChange={(e) => setSeatMapUrl(e.target.value)}
          placeholder="https://… or /seatmaps/venue.png"
        />
        <p className="text-xs text-muted-foreground">
          Shown on the booking form (step 2). Paste a link to this venue&apos;s seat map. Leave blank to hide it.
        </p>
      </div>

      <button
        type="button"
        onClick={() => setHidden((h) => !h)}
        className="flex w-full items-center justify-between rounded-lg border border-border bg-background px-3 py-2.5 text-left"
      >
        <span className="flex items-center gap-2 text-sm font-medium">
          {hidden ? (
            <EyeOff className="size-4 text-muted-foreground" />
          ) : (
            <Eye className="size-4 text-primary" />
          )}
          {hidden ? 'Hidden from site' : 'Visible on site'}
        </span>
        <span
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
            hidden ? 'bg-muted-foreground/30' : 'bg-primary'
          }`}
        >
          <span
            className={`inline-block size-5 transform rounded-full bg-white shadow transition ${
              hidden ? 'translate-x-0.5' : 'translate-x-[22px]'
            }`}
          />
        </span>
      </button>

      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="ghost" onClick={onDone} disabled={pending}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? 'Saving…' : event ? 'Save Changes' : 'Create Event'}
        </Button>
      </div>
    </form>
  )
}
