'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { BunnyTicketWelcomeCover } from './bunnyticket-welcome-cover'
import { DtiPermitModal } from './dti-permit-modal'
import { readLastLocation, restoreScroll, saveLastLocation } from '@/lib/last-location'

const EXIT_MS = 450
const EXCLUDED_PREFIXES = ['/4dminstotor', '/api']

type Phase = 'cover' | 'leaving' | 'entered'

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// The cover greets every fresh visit (new tab, reopened site, external link). It is skipped
// on a plain reload or when arriving from another BunnyTicket page, so it never interrupts
// someone mid-task. Runs during HTML parsing so a skipped cover never flashes.
const preHideScript = `try{var n=performance.getEntriesByType('navigation')[0];var r=document.referrer;var same=false;try{same=!!r&&new URL(r).origin===location.origin}catch(e){}if((n&&n.type==='reload')||same)document.documentElement.setAttribute('data-bt-entered','')}catch(e){}`

function currentPath() {
  return window.location.pathname + window.location.search
}

export function WelcomeExperience() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [phase, setPhase] = useState<Phase>('cover')
  const [showDti, setShowDti] = useState(false)
  const pendingScroll = useRef<number | null>(null)

  const excluded = EXCLUDED_PREFIXES.some((prefix) => pathname?.startsWith(prefix))

  useEffect(() => {
    if (excluded || document.documentElement.hasAttribute('data-bt-entered')) setPhase('entered')
  }, [excluded])

  useEffect(() => {
    if (phase !== 'cover') return
    const root = document.documentElement
    const previous = root.style.overflow
    root.style.overflow = 'hidden'
    return () => {
      root.style.overflow = previous
    }
  }, [phase])

  // Remember where the visitor is so the next visit can bring them straight back.
  useEffect(() => {
    if (phase !== 'entered' || excluded) return
    if (pendingScroll.current !== null) {
      restoreScroll(pendingScroll.current)
      pendingScroll.current = null
    }
    // Pin the path this effect belongs to; window.location may already point at the next
    // document by the time pagehide fires.
    const query = searchParams?.toString()
    const path = `${pathname}${query ? `?${query}` : ''}`
    const save = () => saveLastLocation(path, window.scrollY)
    let timer: number | undefined
    const onScroll = () => {
      window.clearTimeout(timer)
      timer = window.setTimeout(save, 250)
    }
    const onHidden = () => {
      if (document.visibilityState === 'hidden') save()
    }
    save()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('pagehide', save)
    document.addEventListener('visibilitychange', onHidden)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('pagehide', save)
      document.removeEventListener('visibilitychange', onHidden)
    }
  }, [phase, excluded, pathname, searchParams])

  const dismissCover = useCallback((after?: () => void) => {
    document.documentElement.setAttribute('data-bt-entered', '')
    if (prefersReducedMotion()) {
      setPhase('entered')
      after?.()
      return
    }
    setPhase('leaving')
    window.setTimeout(() => {
      setPhase('entered')
      after?.()
    }, EXIT_MS)
  }, [])

  const returnToLastLocation = useCallback(() => {
    const last = readLastLocation()
    if (!last) return
    const here = currentPath()
    if (last.path === here) {
      restoreScroll(last.scrollY)
      return
    }
    // A shared or bookmarked deep link wins; only a visit to the home page resumes the last spot.
    if (window.location.pathname !== '/') return
    pendingScroll.current = last.scrollY
    router.push(last.path, { scroll: false })
  }, [router])

  const goToReviews = useCallback(() => {
    if (window.location.pathname !== '/reviews') router.push('/reviews')
  }, [router])

  const closeDti = useCallback(() => setShowDti(false), [])

  if (excluded) return null

  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: preHideScript }} />
      {phase !== 'entered' && (
        <BunnyTicketWelcomeCover
          leaving={phase === 'leaving'}
          onEnter={() => dismissCover(returnToLastLocation)}
          onReviews={() => dismissCover(goToReviews)}
          onDti={() => setShowDti(true)}
        />
      )}
      {showDti && <DtiPermitModal onClose={closeDti} />}
    </>
  )
}
