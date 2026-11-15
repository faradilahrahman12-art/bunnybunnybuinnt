'use client'

import { useTransition } from 'react'
import { RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import type { AdminHoldRecord } from '@/lib/seat-map/catalog'
import { restockHoldAction } from '@/app/actions/seat-map'
import { formatMoney, sectionName } from '@/components/seat-map/types'

const STATE_LABELS: Record<string, string> = {
  checkout: 'In checkout',
  review: 'Awaiting review',
  confirmed: 'Sold',
  released: 'Released',
}

function canRestock(hold: AdminHoldRecord) {
  return hold.state === 'confirmed' || (hold.state === 'review' && hold.reviewExpiredAt !== null)
}

export function HoldsPanel({ holds, onChanged }: { holds: AdminHoldRecord[]; onChanged: () => void }) {
  const [pending, startTransition] = useTransition()

  function restock(hold: AdminHoldRecord) {
    const note = window.prompt(`Restock ${hold.quantity} ticket(s) from ${hold.orderReference ?? `hold #${hold.id}`}? Optional note:`)
    if (note === null) return
    startTransition(async () => {
      const result = await restockHoldAction({ holdId: hold.id, note: note.trim() || null })
      if (!result.ok) return void toast.error(result.error)
      toast.success('Tickets returned to inventory.')
      onChanged()
    })
  }

  return (
    <section className="flex flex-col gap-3 rounded-2xl border bg-card p-4" aria-labelledby="holds-heading">
      <div>
        <h2 id="holds-heading" className="font-semibold">Reservations and orders</h2>
        <p className="text-sm text-muted-foreground">
          Checkout holds last 15 minutes. Submitted orders keep tickets on hold until you confirm or cancel the order.
        </p>
      </div>
      {holds.length === 0 ? (
        <p className="rounded-xl border border-dashed p-4 text-center text-sm text-muted-foreground">No reservations yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-muted-foreground">
              <tr>
                <th className="py-2 pr-3 font-medium">Order</th>
                <th className="py-2 pr-3 font-medium">Section</th>
                <th className="py-2 pr-3 font-medium">Qty</th>
                <th className="py-2 pr-3 font-medium">Total</th>
                <th className="py-2 pr-3 font-medium">State</th>
                <th className="py-2 font-medium"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {holds.map((hold) => (
                <tr key={hold.id} className="border-t">
                  <td className="py-2 pr-3">
                    <div className="font-medium">{hold.orderReference ?? `Hold #${hold.id}`}</div>
                    {hold.holderName && <div className="text-xs text-muted-foreground">{hold.holderName}</div>}
                  </td>
                  <td className="py-2 pr-3">
                    {sectionName(hold.sectionCode)}
                    {hold.rowLabel ? ` · Row ${hold.rowLabel}` : ''}
                  </td>
                  <td className="py-2 pr-3">{hold.quantity}</td>
                  <td className="py-2 pr-3">{formatMoney(hold.total, 'PHP')}</td>
                  <td className="py-2 pr-3">
                    {STATE_LABELS[hold.state] ?? hold.state}
                    {hold.reviewExpiredAt && hold.state === 'review' ? ' (review window passed)' : ''}
                    {hold.orderStatus ? <div className="text-xs text-muted-foreground">Order: {hold.orderStatus}</div> : null}
                  </td>
                  <td className="py-2 text-right">
                    {canRestock(hold) && (
                      <Button size="sm" variant="outline" disabled={pending} onClick={() => restock(hold)}>
                        <RotateCcw className="size-3.5" aria-hidden="true" />
                        Restock
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
