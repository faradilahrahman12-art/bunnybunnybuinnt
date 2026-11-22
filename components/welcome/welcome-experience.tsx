'use client'

import { useCallback, useEffect, useState } from 'react'
import { BunnyTicketWelcomeCover } from './bunnyticket-welcome-cover'
import { BunnyTicketOrderNowPopup } from './bunnyticket-order-now-popup'
import { DtiPermitModal } from './dti-permit-modal'

const WELCOME_KEY = 'bunnyticket_welcome_entered'
const POPUP_KEY = 'bunnyticket_order_popup_seen'
const EXIT_MS = 450
const POPUP_SCROLL_RATIO = 0.35

type Phase = 'cover' | 'leaving' | 'entered'

function readSession(key: string) {
  try {
    return window.sessionStorage.getItem(key) === '1'
  } catch {
    return false
  }
}

function writeSession(key: string) {
  try {
    window.sessionStorage.setItem(key, '1')
  } catch {}
}

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// Runs during HTML parsing, before the cover paints, so returning visitors never see it flash.
const preHideScript = `try{if(sessionStorage.getItem('${WELCOME_KEY}')==='1')document.documentElement.setAttribute('data-bt-entered','')}catch(e){}`

export function WelcomeExperience() {
  const [phase, setPhase] = useState<Phase>('cover')
  const [showDti, setShowDti] = useState(false)
  const [showPopup, setShowPopup] = useState(false)

  useEffect(() => {
    if (readSession(WELCOME_KEY)) setPhase('entered')
  }, [])

  useEffect(() => {
    if (phase !== 'cover') return
    const root = document.documentElement
    const previous = root.style.overflow
    root.style.overflow = 'hidden'
    return () => {
      root.style.overflow = previous
    }
  }, [phase])

  useEffect(() => {
    if (phase !== 'entered' || readSession(POPUP_KEY)) return
    function onScroll() {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight
      if (scrollable <= 0 || window.scrollY / scrollable < POPUP_SCROLL_RATIO) return
      writeSession(POPUP_KEY)
      setShowPopup(true)
      window.removeEventListener('scroll', onScroll)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [phase])

  const dismissCover = useCallback((after?: () => void) => {
    writeSession(WELCOME_KEY)
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

  const scrollToSection = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' })
  }, [])

  const closeDti = useCallback(() => setShowDti(false), [])

  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: preHideScript }} />
      {phase !== 'entered' && (
        <BunnyTicketWelcomeCover
          leaving={phase === 'leaving'}
          onEnter={() => dismissCover()}
          onReviews={() => dismissCover(() => scrollToSection('reviews'))}
          onDti={() => dismissCover(() => setShowDti(true))}
        />
      )}
      {showDti && <DtiPermitModal onClose={closeDti} />}
      {showPopup && !showDti && (
        <BunnyTicketOrderNowPopup
          onClose={() => setShowPopup(false)}
          onSelect={(id) => {
            setShowPopup(false)
            scrollToSection(id)
          }}
        />
      )}
    </>
  )
}
