'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  AlarmClock,
  BookOpen,
  CalendarDays,
  Eye,
  Mail,
  MapPin,
  RotateCcw,
  Sparkles,
  X,
  Ticket,
  Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { OrderProgress } from '@/components/orders/order-progress'
import { pesos } from '@/components/submit/types'
import { stageIndex } from '@/lib/order-status'
import type { TrackedOrder } from '@/app/actions/orders'

const EDIT_WINDOW_HOURS = 5

function useCountdown(target: number | null) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (target === null) return
    const id = setInterval(() => setNow(Date.now()), 1000 * 30)
    return () => clearInterval(id)
  }, [target])
  if (target === null) return null
  const diff = target - now
  if (diff <= 0) return null
  const hours = Math.floor(diff / 3_600_000)
  const minutes = Math.floor((diff % 3_600_000) / 60_000)
  return `${hours}h ${minutes}m`
}

export function OrderCard({ order }: { order: TrackedOrder }) {
  const [guideOpen, setGuideOpen] = useState(false)
  const isResale = order.serviceType === 'resale'
  const created = new Date(order.createdAt)
  const stage = stageIndex(order.status)

  const editDeadline = stage === 0 ? created.getTime() + EDIT_WINDOW_HOURS * 3_600_000 : null
  const remaining = useCountdown(editDeadline)
  const canEdit = remaining !== null

  const createdLabel = created.toLocaleDateString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  const packages = order.dates
    .map((label) => order.sections[label]?.priority)
    .filter((v): v is string => Boolean(v))
  const packageSummary = Array.from(new Set(packages)).join(' + ')

  const reorderHref = order.eventId
    ? `/submit?event=${order.eventId}`
    : isResale
      ? '/resale'
      : '/help-to-buy'

  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-border border-l-4 border-l-primary bg-card p-4 shadow-sm">
      {/* Top meta row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                isResale
                  ? 'bg-primary/10 text-primary'
                  : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
              }`}
            >
              {isResale ? <Sparkles className="size-3" /> : <Zap className="size-3" />}
              {isResale ? 'Resale' : 'Help to Buy'}
            </span>
            <span className="font-mono text-[11px] text-muted-foreground">{order.reference}</span>
            <span className="text-[11px] text-muted-foreground">· {createdLabel}</span>
          </div>
          <h3 className="text-balance text-base font-bold leading-snug">{order.eventTitle}</h3>
          {(order.country || order.paymentMerchant) && (
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="size-3 text-primary" />
              {order.country ?? 'Bunnyticket'}
            </p>
          )}
        </div>
        <p className="shrink-0 text-right text-sm font-extrabold text-primary">
          {order.totalAmount !== null ? pesos(order.totalAmount) : 'TBQ'}
        </p>
      </div>

      {/* Chips */}
      <div className="flex flex-wrap gap-2">
        <span className="inline-flex max-w-full items-center gap-1.5 rounded-lg bg-muted px-2.5 py-1 text-xs text-muted-foreground">
          <Mail className="size-3.5 shrink-0 text-primary" />
          <span className="truncate">{order.accountEmail}</span>
        </span>
        {order.dates.length > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-muted px-2.5 py-1 text-xs text-muted-foreground">
            <CalendarDays className="size-3.5 shrink-0 text-primary" />
            <span className="truncate">{order.dates.join(', ')}</span>
          </span>
        )}
      </div>

      {/* Progress */}
      <OrderProgress status={order.status} />

      {/* Edit window */}
      {canEdit && (
        <div className="flex flex-col gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2">
            <AlarmClock className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <div>
              <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">
                Edit window closes in {remaining}
              </p>
              <p className="text-xs text-amber-700/80 dark:text-amber-300/80">
                Make any changes now — orders are final after the window closes.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="shrink-0 gap-1.5 border-amber-500/40 bg-background"
            render={
              <Link
                href={order.eventId ? `/submit?event=${order.eventId}&edit=${encodeURIComponent(order.reference)}` : reorderHref}
              />
            }
          >
            Edit Now
          </Button>
        </div>
      )}

      {/* Package summary */}
      {packageSummary && (
        <div className="flex items-start gap-2 rounded-xl bg-primary/5 p-3 text-xs">
          <Ticket className="mt-0.5 size-3.5 shrink-0 text-primary" />
          <span className="font-medium">{packageSummary}</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" className="gap-1.5" render={<Link href={`/track?ref=${order.reference}`} />}>
          <Eye className="size-3.5" />
          View Details
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="gap-1.5 text-primary"
          onClick={() => setGuideOpen(true)}
        >
          <BookOpen className="size-3.5" />
          Guide
        </Button>
        {guideOpen && (
          <div
            className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"
            role="presentation"
            onClick={() => setGuideOpen(false)}
          >
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby={`terms-title-${order.reference}`}
              className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-card p-5 text-left shadow-xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary">Order guide</p>
                  <h2 id={`terms-title-${order.reference}`} className="mt-1 text-lg font-bold">Terms &amp; Conditions</h2>
                  <p className="mt-1 text-xs text-muted-foreground">{order.eventTitle}</p>
                </div>
                <button type="button" aria-label="Close terms and conditions" className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground" onClick={() => setGuideOpen(false)}>
                  <X className="size-4" />
                </button>
              </div>
              <div className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">
                <p>Review these terms before making changes to your order.</p>
                <p><strong className="text-foreground">Order details:</strong> Check that your account information, ticket details, selected dates, and payment information are correct.</p>
                <p><strong className="text-foreground">Edit window:</strong> You may edit this order only while the edit countdown is active. Once the window closes, the order is final.</p>
                <p><strong className="text-foreground">Refund policy:</strong> Incorrect account credentials, wrong passwords, social-login details, and customer cancellations are not refundable.</p>
                <p><strong className="text-foreground">Fulfillment:</strong> Ticket delivery or transfer follows the event-specific process and schedule shown in your order details.</p>
              </div>
              <Button className="mt-5 w-full" onClick={() => setGuideOpen(false)}>I Understand</Button>
            </section>
          </div>
        )}
        <Button size="sm" variant="ghost" className="gap-1.5" render={<Link href={reorderHref} />}>
          <RotateCcw className="size-3.5" />
          Reorder
        </Button>
      </div>
    </article>
  )
}
