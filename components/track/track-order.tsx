'use client'

import { useEffect, useState, useTransition } from 'react'
import {
  CalendarDays,
  CreditCard,
  Loader2,
  Lock,
  Search,
  Ticket,
  User,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getOrderByReference, type TrackedOrder } from '@/app/actions/orders'
import { pesos } from '@/components/submit/types'
import { OrderProgress } from '@/components/orders/order-progress'

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  pending: { label: 'Pending verification', className: 'bg-amber-500/15 text-amber-600 dark:text-amber-400' },
  submitted: { label: 'Pending verification', className: 'bg-amber-500/15 text-amber-600 dark:text-amber-400' },
  verified: { label: 'Confirmed', className: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' },
  confirmed: { label: 'Confirmed', className: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' },
  processing: { label: 'In Progress', className: 'bg-primary/15 text-primary' },
  in_progress: { label: 'In Progress', className: 'bg-primary/15 text-primary' },
  completed: { label: 'Completed', className: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' },
  complete: { label: 'Completed', className: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' },
  cancelled: { label: 'Cancelled', className: 'bg-destructive/15 text-destructive' },
}

export function TrackOrder({ initialRef = '' }: { initialRef?: string }) {
  const [reference, setReference] = useState(initialRef)
  const [order, setOrder] = useState<TrackedOrder | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function lookup(ref: string) {
    const value = ref.trim()
    if (!value) return
    setError(null)
    startTransition(async () => {
      const res = await getOrderByReference(value)
      if (res.error) {
        setError(res.error)
        setOrder(null)
      } else if (res.order) {
        setOrder(res.order)
      }
    })
  }

  // Auto-lookup when arriving from the confirmation screen with ?ref=
  useEffect(() => {
    if (initialRef) lookup(initialRef)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialRef])

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div className="text-center">
        <h1 className="text-3xl font-medium tracking-tight sm:text-4xl">Track Your Order</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter the reference number you received when you submitted your order.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          lookup(reference)
        }}
        className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-end"
      >
        <div className="flex flex-1 flex-col gap-1.5">
          <Label className="text-sm">Order Reference</Label>
          <Input
            value={reference}
            onChange={(e) => setReference(e.target.value.toUpperCase())}
            placeholder="e.g. NP-2W7RLZ"
            autoCapitalize="characters"
            className="tracking-widest"
          />
        </div>
        <Button type="submit" disabled={pending || !reference.trim()} className="gap-1.5">
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
          {pending ? 'Searching…' : 'Track Order'}
        </Button>
      </form>

      {error && (
        <p className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </p>
      )}

      {order && <OrderDetails order={order} />}
    </div>
  )
}

function OrderDetails({ order }: { order: TrackedOrder }) {
  const isResale = order.serviceType === 'resale'
  const status = STATUS_LABELS[order.status] ?? {
    label: order.status,
    className: 'bg-muted text-muted-foreground',
  }
  const memberships = order.memberships.filter((m) => m.trim().length > 0)
  const submitted = new Date(order.createdAt).toLocaleString('en-PH', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs text-muted-foreground">Order reference</p>
          <p className="text-2xl font-extrabold tracking-widest text-primary">{order.reference}</p>
          <p className="mt-1 text-xs text-muted-foreground">Submitted {submitted}</p>
        </div>
        <span className={`w-fit rounded-full px-3 py-1.5 text-sm font-bold ${status.className}`}>
          {status.label}
        </span>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <OrderProgress status={order.status} />
      </div>

      <Section icon={<CalendarDays className="size-4 text-primary" />} title="Event & Tickets">
        <Row label="Event" value={order.eventTitle} />
        <Row label="Service" value={isResale ? 'Resale' : 'Help to Buy'} />
        {order.country && <Row label="Country" value={order.country} />}
        <Row label="Date(s)" value={order.dates.length ? order.dates.join(', ') : '—'} />
        {order.dates.map((label) => {
          const sel = order.sections[label]
          if (!sel) return null
          const tier = sel.priority
            ? sel.backup
              ? `${sel.priority}  ·  backup: ${sel.backup}`
              : sel.priority
            : 'No sections'
          const qty = sel.quantity ?? order.quantityPerDate
          return <Row key={label} label={`${label}  ·  ${qty} qty`} value={tier} />
        })}
        <Row
          label="Total"
          value={order.totalAmount !== null ? pesos(order.totalAmount) : 'To be quoted'}
          highlight
        />
      </Section>

      {isResale ? (
        <Section icon={<User className="size-4 text-primary" />} title="Contact Information">
          <Row label="Full name" value={order.holderName || '—'} />
          <Row label="Email address" value={order.accountEmail || '—'} />
          <Row label="Contact number" value={order.contactNumber || '—'} />
          {order.telegram && <Row label="Telegram" value={order.telegram} />}
          {order.instagram && <Row label="Instagram" value={order.instagram} />}
        </Section>
      ) : (
        <>
          <Section icon={<Lock className="size-4 text-primary" />} title="Account Credentials">
            <Row label="Email" value={order.accountEmail || '—'} />
            <Row label="Password" value={order.hasPassword ? '••••••••' : '—'} />
            {memberships.length > 0 && <Row label="Membership(s)" value={memberships.join(', ')} />}
          </Section>

          <Section icon={<User className="size-4 text-primary" />} title="Account Holder">
            <Row label="Full Name" value={order.holderName || '—'} />
            <Row label="Date of Birth" value={order.holderDob || '—'} />
            <Row label="Contact" value={order.contactNumber || '—'} />
          </Section>
        </>
      )}

      <Section icon={<CreditCard className="size-4 text-primary" />} title="Payment">
        <Row label="Method" value={order.paymentMethod || 'QRPH'} />
        {order.paymentMerchant && <Row label="Merchant" value={order.paymentMerchant} />}
        <Row label="Reference" value={order.paymentReference || 'To follow'} />
        {order.datePaid && <Row label="Date paid" value={order.datePaid} />}
        {order.timePaid && <Row label="Time paid" value={order.timePaid} />}
        {order.amountSent !== null && <Row label="Amount sent" value={pesos(order.amountSent)} />}
        <Row
          label="Proof of payment"
          value={
            order.screenshots.length
              ? `${order.screenshots.length} screenshot${order.screenshots.length === 1 ? '' : 's'}`
              : '—'
          }
        />
        {order.screenshots.length > 0 && (
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {order.screenshots.map((src, i) => (
              <a
                key={i}
                href={src}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative aspect-[3/4] overflow-hidden rounded-lg border border-border bg-muted"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src || '/placeholder.svg'}
                  alt={`Proof of payment ${i + 1}`}
                  className="size-full object-cover transition-transform group-hover:scale-105"
                />
              </a>
            ))}
          </div>
        )}
      </Section>

      <p className="flex items-start gap-2 rounded-xl bg-primary/5 p-3 text-sm text-muted-foreground">
        <Ticket className="mt-0.5 size-4 shrink-0 text-primary" />
        Keep this reference number safe. Our team will reach out via your contact number as your order progresses.
      </p>
    </div>
  )
}

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="flex items-center gap-2 text-sm font-bold">
        {icon}
        {title}
      </p>
      <dl className="mt-3 flex flex-col gap-1.5">{children}</dl>
    </div>
  )
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={`text-right font-medium ${highlight ? 'text-base font-bold text-primary' : ''}`}>
        {value}
      </dd>
    </div>
  )
}
