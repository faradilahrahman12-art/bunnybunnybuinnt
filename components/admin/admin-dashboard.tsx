'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/site-header'
import { EventForm } from '@/components/admin/event-form'
import { SubmitContentForm } from '@/components/admin/submit-content-form'
import { QrphManager } from '@/components/admin/qrph-manager'
import { OrdersManager } from '@/components/admin/orders-manager'
import { ReviewsManager } from '@/components/admin/reviews-manager'
import { deleteEvent, setEventHidden, reorderEvents } from '@/app/actions/events'
import type { TrackedOrder } from '@/app/actions/orders'
import type { AdminAccount } from '@/lib/admin-auth'
import type { EventWithSchedule, QrphMerchant, Review } from '@/lib/db/schema'
import type { SubmitContent } from '@/lib/submit-content'
import { toast } from 'sonner'
import {
  ArrowUp,
  ArrowDown,
  CalendarDays,
  Eye,
  EyeOff,
  ExternalLink,
  FileText,
  LayoutGrid,
  Package,
  Pencil,
  Plus,
  QrCode,
  Star,
  Ticket,
  Trash2,
  Zap,
} from 'lucide-react'

type Tab = 'resale' | 'help_to_buy'
type Section = 'events' | 'orders' | 'submit' | 'qrph' | 'reviews'

function totalTickets(event: EventWithSchedule) {
  return event.schedule.reduce(
    (sum, d) => sum + d.sections.reduce((s, sec) => s + sec.quantity, 0),
    0,
  )
}

export function AdminDashboard({
  account,
  events,
  orders,
  submitContent,
  merchants,
  reviews,
  initialTab = 'resale',
  initialSection = 'events',
  initialAdding = false,
}: {
  account: AdminAccount
  events: EventWithSchedule[]
  orders: TrackedOrder[]
  submitContent: SubmitContent
  merchants: QrphMerchant[]
  reviews: Review[]
  initialTab?: Tab
  initialSection?: Section
  initialAdding?: boolean
}) {
  const router = useRouter()
  const [section, setSection] = useState<Section>(initialSection)
  const [tab, setTab] = useState<Tab>(initialTab)
  const [adding, setAdding] = useState(initialAdding)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [, startTransition] = useTransition()

  const list = events.filter((e) => e.type === tab)

  function remove(event: EventWithSchedule) {
    if (!confirm(`Delete "${event.title}"? This cannot be undone.`)) return
    startTransition(async () => {
      try {
        await deleteEvent(event.id)
        toast.success('Event deleted')
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to delete')
      }
    })
  }

  function move(event: EventWithSchedule, dir: -1 | 1) {
    const idx = list.findIndex((e) => e.id === event.id)
    const target = idx + dir
    if (idx === -1 || target < 0 || target >= list.length) return
    const reordered = [...list]
    ;[reordered[idx], reordered[target]] = [reordered[target], reordered[idx]]
    const reorderedIds = reordered.map((e) => e.id)
    // Rebuild the full order across every event, substituting the reordered
    // sequence only for events in the currently selected tab.
    let pointer = 0
    const fullOrder = events.map((e) => (e.type === tab ? reorderedIds[pointer++] : e.id))
    startTransition(async () => {
      try {
        await reorderEvents(fullOrder)
        toast.success('Event order updated')
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to reorder')
      }
    })
  }

  function toggleHidden(event: EventWithSchedule) {
    startTransition(async () => {
      try {
        await setEventHidden(event.id, !event.hidden)
        toast.success(event.hidden ? 'Event is now visible' : 'Event hidden from site')
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to update')
      }
    })
  }

  const tabs: { key: Tab; label: string; icon: typeof Ticket }[] = [
    { key: 'resale', label: 'Resale Tickets', icon: Ticket },
    { key: 'help_to_buy', label: 'Help to Buy', icon: Zap },
  ]

  const sections: { key: Section; label: string; icon: typeof Ticket }[] = [
    { key: 'events', label: 'Events', icon: LayoutGrid },
    { key: 'orders', label: 'Orders', icon: Package },
    { key: 'submit', label: 'Submit Page', icon: FileText },
    { key: 'qrph', label: 'QRPH', icon: QrCode },
    { key: 'reviews', label: 'Reviews', icon: Star },
  ]

  return (
    <div className="min-h-screen bg-muted/20">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Logo />
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              {account.role === 'team' ? 'Team' : 'Editor'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="gap-1.5" render={<Link href="/" />}>
              <ExternalLink className="size-3.5" />
              View site
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6 inline-flex rounded-full border border-border bg-background p-1">
          {sections.map((s) => {
            const Icon = s.icon
            return (
              <button
                key={s.key}
                onClick={() => {
                  setSection(s.key)
                  setAdding(false)
                  setEditingId(null)
                }}
                className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition ${
                  section === s.key
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="size-3.5" />
                {s.label}
              </button>
            )
          })}
        </div>

        {section === 'orders' ? (
          <OrdersManager orders={orders} />
        ) : section === 'submit' ? (
          <SubmitContentForm content={submitContent} />
        ) : section === 'qrph' ? (
          <QrphManager merchants={merchants} />
        ) : section === 'reviews' ? (
          <ReviewsManager reviews={reviews} />
        ) : (
        <>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Manage Events</h1>
            <p className="text-sm text-muted-foreground">
              Add, edit, hide, reorder, or remove events. Use the arrows to arrange which events show first.
            </p>
          </div>
          <Button
            className="gap-1.5"
            onClick={() => {
              setAdding((a) => !a)
              setEditingId(null)
            }}
          >
            <Plus className="size-4" />
            Add Event
          </Button>
        </div>

        <div className="mt-6 inline-flex rounded-full border border-border bg-background p-1">
          {tabs.map((t) => {
            const Icon = t.icon
            const count = events.filter((e) => e.type === t.key).length
            return (
              <button
                key={t.key}
                onClick={() => {
                  setTab(t.key)
                  setAdding(false)
                  setEditingId(null)
                }}
                className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition ${
                  tab === t.key
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="size-3.5" />
                {t.label}
                <span className="text-xs opacity-70">({count})</span>
              </button>
            )
          })}
        </div>

        {adding && (
          <div className="mt-5">
            <EventForm defaultType={tab} onDone={() => setAdding(false)} />
          </div>
        )}

        <div className="mt-5 space-y-3">
          {list.length === 0 && !adding && (
            <p className="rounded-xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
              No events yet. Click “Add Event” to create one.
            </p>
          )}

          {list.map((event) =>
            editingId === event.id ? (
              <EventForm
                key={event.id}
                event={event}
                defaultType={tab}
                onDone={() => setEditingId(null)}
              />
            ) : (
              <div
                key={event.id}
                className={`flex items-center gap-4 rounded-xl border border-border bg-card p-3 shadow-sm ${
                  event.hidden ? 'opacity-60' : ''
                }`}
              >
                <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
                  {event.imageUrl ? (
                    <Image
                      src={event.imageUrl || '/placeholder.svg'}
                      alt={event.title}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="grid h-full place-items-center text-muted-foreground">
                      <Ticket className="size-5" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold">{event.title}</p>
                    {event.hidden && (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        <EyeOff className="size-3" />
                        Hidden
                      </span>
                    )}
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    {event.country}
                    {event.platform ? ` · ${event.platform}` : ''}
                  </p>
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <CalendarDays className="size-3.5 shrink-0 text-primary" />
                    {event.schedule.length} date{event.schedule.length === 1 ? '' : 's'} ·{' '}
                    {totalTickets(event)} tickets
                  </p>
                  {event.saleInfo && (
                    <p className="truncate text-xs text-muted-foreground">{event.saleInfo}</p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <div className="flex flex-col">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-6"
                      onClick={() => move(event, -1)}
                      disabled={list.findIndex((e) => e.id === event.id) === 0}
                      aria-label="Move event up"
                      title="Move up"
                    >
                      <ArrowUp className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-6"
                      onClick={() => move(event, 1)}
                      disabled={list.findIndex((e) => e.id === event.id) === list.length - 1}
                      aria-label="Move event down"
                      title="Move down"
                    >
                      <ArrowDown className="size-3.5" />
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => toggleHidden(event)}
                    title={event.hidden ? 'Show on site' : 'Hide from site'}
                  >
                    {event.hidden ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
                    <span className="hidden sm:inline">{event.hidden ? 'Show' : 'Hide'}</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => {
                      setEditingId(event.id)
                      setAdding(false)
                    }}
                  >
                    <Pencil className="size-3.5" />
                    <span className="hidden sm:inline">Edit</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => remove(event)}
                    aria-label="Delete event"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            ),
          )}
        </div>
        </>
        )}
      </main>
    </div>
  )
}
