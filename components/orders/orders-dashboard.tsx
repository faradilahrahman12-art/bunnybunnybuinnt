'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import {
  Heart,
  Loader2,
  LogOut,
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
import { Label } from '@/components/ui/label'
import { OrderCard } from '@/components/orders/order-card'
import { getOrdersByEmail, type TrackedOrder } from '@/app/actions/orders'
import { isActive } from '@/lib/order-status'

const STORAGE_KEY = 'nabi_orders_email'
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

export function OrdersDashboard() {
  const [email, setEmail] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null
    if (saved) setEmail(saved)
    setReady(true)
  }, [])

  if (!ready) {
    return (
      <div className="grid min-h-[40vh] place-items-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!email) {
    return (
      <EmailGate
        onFound={(value) => {
          window.localStorage.setItem(STORAGE_KEY, value)
          setEmail(value)
        }}
      />
    )
  }

  return (
    <Dashboard
      email={email}
      onSignOut={() => {
        window.localStorage.removeItem(STORAGE_KEY)
        setEmail(null)
      }}
    />
  )
}

function EmailGate({ onFound }: { onFound: (email: string) => void }) {
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const res = await getOrdersByEmail(value)
      if (res.error) {
        setError(res.error)
        return
      }
      if (!res.orders || res.orders.length === 0) {
        setError('We couldn’t find any orders under that email. Double-check the address you used at checkout.')
        return
      }
      onFound(value.trim().toLowerCase())
    })
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 py-10">
      <div className="text-center">
        <div className="mx-auto mb-3 grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
          <Package className="size-6" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">My Orders</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter the email you used on your order to see all your orders and live progress.
        </p>
      </div>

      <form onSubmit={submit} className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="orders-email" className="text-sm">
            Email address
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="orders-email"
              type="email"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="you@email.com"
              className="pl-9"
              autoComplete="email"
              required
            />
          </div>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" disabled={pending} className="gap-1.5">
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
          {pending ? 'Finding your orders…' : 'View My Orders'}
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          Have a reference number instead?{' '}
          <Link href="/track" className="font-medium text-primary hover:underline">
            Track a single order
          </Link>
        </p>
      </form>
    </div>
  )
}

function Dashboard({ email, onSignOut }: { email: string; onSignOut: () => void }) {
  const [orders, setOrders] = useState<TrackedOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshedAt, setRefreshedAt] = useState<Date | null>(null)
  const [pending, startTransition] = useTransition()

  const [mainTab, setMainTab] = useState<MainTab>('orders')
  const [query, setQuery] = useState('')
  const [service, setService] = useState<ServiceFilter>('all')
  const [time, setTime] = useState<TimeFilter>('upcoming')

  function load() {
    startTransition(async () => {
      const res = await getOrdersByEmail(email)
      setOrders(res.orders ?? [])
      setRefreshedAt(new Date())
      setLoading(false)
    })
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email])

  const firstName = orders[0]?.holderName?.trim().split(/\s+/)[0] ?? ''
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
          {loading ? (
            <div className="grid place-items-center py-16">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState time={time} />
          ) : (
            <div className="flex flex-col gap-4">
              {filtered.map((order) => (
                <OrderCard key={order.reference} order={order} />
              ))}
            </div>
          )}
        </>
      )}

      {mainTab === 'reviews' && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-10 text-center">
          <MessageCircle className="size-8 text-primary" />
          <p className="text-sm text-muted-foreground">
            See what other concert-goers are saying and share your own experience.
          </p>
          <Button render={<Link href="/reviews" />}>Browse Reviews</Button>
        </div>
      )}



      {/* Footer: account */}
      <div className="flex items-center justify-between gap-3 border-t border-border pt-4 text-sm">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <Mail className="size-3.5" />
          {email}
        </span>
        <button
          onClick={onSignOut}
          className="inline-flex items-center gap-1.5 font-medium text-muted-foreground transition hover:text-foreground"
        >
          <LogOut className="size-3.5" />
          Use a different email
        </button>
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
