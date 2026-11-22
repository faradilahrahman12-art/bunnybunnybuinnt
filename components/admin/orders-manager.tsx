'use client'

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { CalendarDays, ExternalLink, Loader2, Mail, Phone, Search } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { OrderProgress } from '@/components/orders/order-progress'
import { updateOrderDelivery, updateOrderStatus, type TrackedOrder } from '@/app/actions/orders'
import { ADMIN_STATUS_OPTIONS } from '@/lib/order-status'
import { pesos } from '@/components/submit/types'

export function OrdersManager({ orders }: { orders: TrackedOrder[] }) {
  const [list, setList] = useState(orders)
  const [query, setQuery] = useState('')
  const [pendingRef, setPendingRef] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return list
    return list.filter(
      (o) =>
        o.reference.toLowerCase().includes(q) ||
        o.eventTitle.toLowerCase().includes(q) ||
        o.accountEmail.toLowerCase().includes(q),
    )
  }, [list, query])

  function changeDelivery(reference: string, actualDeliveryMethod: string | null) {
    setPendingRef(reference)
    startTransition(async () => {
      const res = await updateOrderDelivery(reference, actualDeliveryMethod)
      if (res?.error) {
        toast.error(res.error)
      } else {
        setList((prev) => prev.map((o) => (o.reference === reference ? { ...o, actualDeliveryMethod } : o)))
        toast.success('Final delivery method updated')
      }
      setPendingRef(null)
    })
  }

  function changeStatus(reference: string, status: string) {
    setPendingRef(reference)
    startTransition(async () => {
      const res = await updateOrderStatus(reference, status)
      if (res?.error) {
        toast.error(res.error)
      } else {
        setList((prev) => prev.map((o) => (o.reference === reference ? { ...o, status } : o)))
        toast.success('Order status updated')
      }
      setPendingRef(null)
    })
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Manage Orders</h1>
          <p className="text-sm text-muted-foreground">
            Update each order&apos;s progress. Customers see these stages live on their dashboard.
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search ref, event, or email…"
            className="pl-9"
          />
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {filtered.length === 0 && (
          <p className="rounded-xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
            No orders found.
          </p>
        )}

        {filtered.map((order) => {
          const created = new Date(order.createdAt).toLocaleString('en-PH', {
            dateStyle: 'medium',
            timeStyle: 'short',
          })
          const busy = pendingRef === order.reference
          return (
            <div key={order.reference} className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm font-bold text-primary">{order.reference}</span>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {order.serviceType === 'resale' ? 'Resale' : 'Help to Buy'}
                    </span>
                    <span className="text-xs text-muted-foreground">{created}</span>
                  </div>
                  <p className="mt-1 truncate text-sm font-semibold">{order.eventTitle}</p>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Mail className="size-3" />
                      {order.accountEmail}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Phone className="size-3" />
                      {order.contactNumber}
                    </span>
                    {order.dates.length > 0 && (
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays className="size-3" />
                        {order.dates.join(', ')}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-extrabold text-primary">
                    {order.totalAmount !== null ? pesos(order.totalAmount) : 'TBQ'}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-1 gap-1 text-xs"
                    render={<Link href={`/track?ref=${order.reference}`} target="_blank" />}
                  >
                    <ExternalLink className="size-3" />
                    Details
                  </Button>
                </div>
              </div>

              <div className="mt-4">
                <OrderProgress status={order.status} />
              </div>

              {order.deliveryMethod === 'flexible' && (
                <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-primary/25 bg-primary/5 p-3">
                  <div className="min-w-48">
                    <p className="text-xs font-bold text-foreground">Flexible Ticket Delivery</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      Customer priority: Change Account Details to Your Own Name
                    </p>
                  </div>
                  <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    Final method
                    <select
                      value={order.actualDeliveryMethod ?? ''}
                      disabled={busy}
                      onChange={(event) => changeDelivery(order.reference, event.target.value || null)}
                      className="rounded-lg border border-border bg-background px-2 py-1.5 text-xs text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      <option value="">Not assigned</option>
                      <option value="change_account_details">Change Account Details</option>
                      <option value="enter_together">Enter Together at Venue</option>
                      <option value="wristband_transfer">Wristband Transfer</option>
                      <option value="eticket_transfer">E-Ticket Transfer</option>
                    </select>
                  </label>
                </div>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">Set stage:</span>
                {ADMIN_STATUS_OPTIONS.map((opt) => {
                  const active = order.status === opt.value
                  const isCancel = opt.value === 'cancelled'
                  return (
                    <button
                      key={opt.value}
                      disabled={busy}
                      onClick={() => changeStatus(order.reference, opt.value)}
                      className={`rounded-full border px-3 py-1 text-xs font-medium transition disabled:opacity-50 ${
                        active
                          ? isCancel
                            ? 'border-destructive bg-destructive text-destructive-foreground'
                            : 'border-primary bg-primary text-primary-foreground'
                          : 'border-border bg-background text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {opt.label}
                    </button>
                  )
                })}
                {busy && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
