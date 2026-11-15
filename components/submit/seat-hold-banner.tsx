'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Timer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { HoldSummary } from '@/lib/seat-map/inventory'
import { formatMoney, sectionName } from '@/components/seat-map/types'

function remainingMs(expiresAt: string) {
  return Math.max(0, new Date(expiresAt).getTime() - Date.now())
}

export function useHoldExpired(expiresAt: string | undefined) {
  const [left, setLeft] = useState(() => (expiresAt ? remainingMs(expiresAt) : Infinity))
  useEffect(() => {
    setLeft(expiresAt ? remainingMs(expiresAt) : Infinity)
    if (!expiresAt) return
    const id = window.setInterval(() => setLeft(remainingMs(expiresAt)), 1000)
    return () => window.clearInterval(id)
  }, [expiresAt])
  return left
}

export function SeatHoldBanner({
  hold,
  msLeft,
  onChooseAgain,
}: {
  hold: HoldSummary
  msLeft: number
  onChooseAgain?: () => void
}) {
  const expired = msLeft <= 0
  const minutes = Math.floor(msLeft / 60000)
  const seconds = Math.floor((msLeft % 60000) / 1000)

  return (
    <div
      role="status"
      className={`mb-4 flex flex-col gap-2 rounded-2xl border p-3 text-sm sm:flex-row sm:items-center sm:justify-between ${
        expired ? 'border-destructive/40 bg-destructive/10' : 'border-primary/30 bg-primary/5'
      }`}
    >
      <div className="flex min-w-0 items-start gap-2">
        <Timer className={`mt-0.5 size-4 shrink-0 ${expired ? 'text-destructive' : 'text-primary'}`} aria-hidden="true" />
        <div className="min-w-0">
          <p className="font-semibold">
            {hold.quantity} × {sectionName(hold.sectionCode)}
            {hold.rowLabel ? ` · Row ${hold.rowLabel}` : ''} · {hold.dateLabel}
          </p>
          <p className="text-xs text-muted-foreground">
            {expired
              ? 'Your hold expired and the tickets were released.'
              : `Held for you · ${minutes}:${String(seconds).padStart(2, '0')} left · Total ${formatMoney(hold.total, 'PHP')}`}
          </p>
        </div>
      </div>
      {expired &&
        (onChooseAgain ? (
          <Button size="sm" variant="outline" onClick={onChooseAgain}>
            Choose again
          </Button>
        ) : (
          <Button size="sm" variant="outline" render={<Link href={`/submit?event=${hold.eventId}`} />}>
            Choose again
          </Button>
        ))}
    </div>
  )
}
