'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { reserveSeatsAction } from '@/app/actions/seat-map'
import { SeatMapExplorer } from './seat-map-explorer'
import type { Listing, VenueMap } from './types'

export function SeatCheckoutExplorer({ eventId, map, listings }: { eventId: number; map: VenueMap; listings: Listing[] }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function reserve(listing: Listing, quantity: number) {
    setError(null)
    startTransition(async () => {
      const result = await reserveSeatsAction({ listingId: Number(listing.id), quantity })
      if (!result.ok) {
        if (result.error.startsWith('Please sign in')) {
          router.push(`/sign-in?redirect=${encodeURIComponent(`/resale/${eventId}/seats`)}`)
          return
        }
        setError(result.error)
        toast.error(result.error)
        router.refresh()
        return
      }
      router.push(`/submit?event=${eventId}&hold=${encodeURIComponent(result.data.token)}`)
    })
  }

  return (
    <div className="flex flex-col gap-3">
      {error && (
        <p role="alert" className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      )}
      <SeatMapExplorer map={map} listings={listings} onContinue={reserve} continuing={pending} />
    </div>
  )
}
