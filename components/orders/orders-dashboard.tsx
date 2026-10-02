'use client'

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import {
  Gift,
  Heart,
  Lock,
  Mail,
  MessageCircle,
  Package,
  Plus,
  RefreshCw,
  Search,
  Ticket,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { OrderCard } from '@/components/orders/order-card'
import { CustomerReviewForm } from '@/components/orders/customer-review-form'
import { ClaimOrderForm } from '@/components/orders/claim-order-form'
import { SignOutButton } from '@/components/auth/sign-out-button'
import { getMyOrders, type TrackedOrder } from '@/app/actions/orders'
import { isActive, isComplete } from '@/lib/order-status'

type MainTab = 'orders' | 'reviews'
type ServiceFilter = 'all' | 'resale' | 'help_to_buy'
type TimeFilter = 'upcoming' | 'past'

function greeting() {
  const h = new Date().getHours()
  if (h < 5) return 'Good night'
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

export function OrdersDashboard({
  initialOrders,
  user,
}: {
  initialOrders: TrackedOrder[]
  user: { name: string; email: string }
}) {
  const [orders, setOrders] = useState<TrackedOrder[]>(initialOrders)
  const [refreshedAt, setRefreshedAt] = useState<Date | null>(new Date())
  const [pending, startTransition] = useTransition()

  const [mainTab, setMainTab] = useState<MainTab>('orders')
  const [query, setQuery] = useState('')
  const [service, setService] = useState<ServiceFilter>('all')
  const [time, setTime] = useState<TimeFilter>('upcoming')

  function load() {
    startTransition(async () => {
      setOrders(await getMyOrders())
      setRefreshedAt(new Date())
    })
  }

  const firstName = user.name?.trim().split(/\s+/)[0] ?? ''
  const activeCount = orders.filter((o) => isActive(o.status)).length

  const serviceCounts = {
    all: orders.length,
    resale: orders.filter((o) => o.serviceType === 'resale').length,
    help_to_buy: orders.filter((o) => o.serviceType === 'help_to_buy').length,
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return orders.filter((o) => {
      if (service !== 'all' && o.serviceType !== service) return false
      const past = !isActive(o.status)
      if (time === 'upcoming' && past) return false
      if (time === 'past' && !past) return false
      if (q && !o.eventTitle.toLowerCase().includes(q) && !o.reference.toLowerCase().includes(q)) {
        return false
      }
      return true
    })
  }, [orders, service, time, query])

  const upcomingCount = orders.filter((o) => isActive(o.status)).length
  const pastCount = orders.length - upcomingCount

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Orders</h1>
            <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span>
                {greeting()}
                {firstName ? `, ${firstName}!` : '!'}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                <Heart className="size-3" />
                {orders.length} order{orders.length === 1 ? '' : 's'}
              </span>
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" className="gap-1.5" onClick={load} disabled={pending}>
                <RefreshCw className={`size-3.5 ${pending ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button size="sm" className="gap-1.5" render={<Link href="/resale" />}>
                <Plus className="size-3.5" />
                New Order
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {refreshedAt ? 'Updated just now' : 'Loading…'}
            </p>
          </div>
        </div>
      </div>

      {/* Main tabs */}
      <div className="grid grid-cols-2 gap-1 rounded-2xl border border-border bg-card p-1">
        <TabButton active={mainTab === 'orders'} onClick={() => setMainTab('orders')} icon={<Ticket className="size-4" />}>
          Orders
          {activeCount > 0 && (
            <span className="ml-1 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
              {activeCount} active
            </span>
          )}
        </TabButton>
        <TabButton active={mainTab === 'reviews'} onClick={() => setMainTab('reviews')} icon={<MessageCircle className="size-4" />}>
          Reviews
        </TabButton>

      </div>

      {mainTab === 'orders' && (
        <>
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by event name or order #…"
              className="pl-9"
            />
          </div>

          {/* Service filter chips */}
          <div className="flex flex-wrap gap-2">
            <Chip active={service === 'all'} onClick={() => setService('all')} count={serviceCounts.all}>
              All
            </Chip>
            <Chip active={service === 'resale'} onClick={() => setService('resale')} count={serviceCounts.resale}>
              Resale
            </Chip>
            <Chip active={service === 'help_to_buy'} onClick={() => setService('help_to_buy')} count={serviceCounts.help_to_buy}>
              HTB
            </Chip>
          </div>

          {/* Time sub-tabs */}
          <div className="grid grid-cols-2 gap-1 rounded-2xl border border-border bg-card p-1">
            <TabButton active={time === 'upcoming'} onClick={() => setTime('upcoming')}>
              Upcoming
              {upcomingCount > 0 && (
                <span className="ml-1 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
                  {upcomingCount}
                </span>
              )}
            </TabButton>
            <TabButton active={time === 'past'} onClick={() => setTime('past')}>
              Past
              {pastCount > 0 && (
                <span className="ml-1 rounded-full bg-muted-foreground/20 px-1.5 py-0.5 text-[10px] font-bold text-foreground">
                  {pastCount}
                </span>
              )}
            </TabButton>
          </div>

          {/* List */}
          {filtered.length === 0 ? (
            <EmptyState time={time} />
          ) : (
            <div className="flex flex-col gap-4">
              {filtered.map((order) => (
                <OrderCard key={order.reference} order={order} />
              ))}
            </div>
          )}

          <ClaimOrderForm onClaimed={load} />
        </>
      )}

      {mainTab === 'reviews' && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-6 text-center">
            <MessageCircle className="size-8 text-primary" />
            <p className="text-sm text-muted-foreground">
              Share your experience after your order has been completed.
            </p>
            <Button render={<Link href="/reviews" />}>Browse Reviews</Button>
          </div>
          {orders.filter((order) => isComplete(order.status)).length > 0 ? (
            orders.filter((order) => isComplete(order.status)).map((order) => (
              <CustomerReviewForm key={order.reference} order={order} />
            ))
          ) : (
            <div className="flex flex-col gap-4 rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-5">
              <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                  <Lock className="size-5" aria-hidden="true" />
                </span>
                <div className="flex flex-col gap-1">
                  <h3 className="font-semibold">Write a review</h3>
                  <p className="text-sm text-muted-foreground">
                    Complete your order first to leave a review and earn Bunny Bucks.
                  </p>
                </div>
              </div>
              <ol className="flex flex-col gap-2 text-sm">
                {[
                  'Place an order with BunnyTicket',
                  'Wait for your order to be marked Completed',
                  'Come back here to write your review',
                ].map((step, i) => (
                  <li key={step} className="flex items-center gap-2.5">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                      {i + 1}
                    </span>
                    <span className="text-muted-foreground">{step}</span>
                  </li>
                ))}
              </ol>
              <div className="flex items-center gap-2 rounded-xl bg-primary/10 px-3 py-2 text-sm font-medium text-primary">
                <Gift className="size-4 shrink-0" aria-hidden="true" />
                Earn Bunny Bucks for every review you share
              </div>
              <Button disabled className="w-full">
                <Lock className="size-4" aria-hidden="true" />
                Complete an order to unlock
              </Button>
            </div>
          )}
        </div>
      )}



      {/* Footer: account */}
      <div className="flex items-center justify-between gap-3 border-t border-border pt-4 text-sm">
        <span className="flex min-w-0 items-center gap-1.5 text-muted-foreground">
          <Mail className="size-3.5 shrink-0" />
          <span className="truncate">{user.email}</span>
        </span>
        <SignOutButton />
      </div>
    </div>
  )
}

function TabButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean
  onClick: () => void
  icon?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
        active ? 'bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20' : 'text-muted-foreground hover:text-foreground'
      }`}
    >
      {icon}
      {children}
    </button>
  )
}

function Chip({
  active,
  onClick,
  count,
  children,
}: {
  active: boolean
  onClick: () => void
  count: number
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition ${
        active
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border bg-card text-muted-foreground hover:text-foreground'
      }`}
    >
      {children}
      <span
        className={`rounded-full px-1.5 text-[10px] font-bold ${
          active ? 'bg-primary-foreground/20' : 'bg-muted'
        }`}
      >
        {count}
      </span>
    </button>
  )
}

function EmptyState({ time }: { time: TimeFilter }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border py-16 text-center">
      <Package className="size-8 text-muted-foreground" />
      <p className="text-sm font-medium">
        {time === 'upcoming' ? 'No upcoming orders' : 'No past orders'}
      </p>
      <p className="max-w-xs text-sm text-muted-foreground">
        {time === 'upcoming'
          ? 'When you place a new order it will show up here with live progress.'
          : 'Completed and cancelled orders will appear here.'}
      </p>
      <Button variant="outline" render={<Link href="/resale" />}>
        Browse Events
      </Button>
    </div>
  )
}
