'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Ticket, Send } from 'lucide-react'

const TELEGRAM_URL = 'https://t.me/Nabiupdates'

export function SupportButton() {
  const pathname = usePathname()
  const [visible, setVisible] = useState(false)
  const [inHelpToBuy, setInHelpToBuy] = useState(false)

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > 300)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const target = document.getElementById('help-to-buy')
    if (!target) return
    const observer = new IntersectionObserver(
      ([entry]) => setInHelpToBuy(entry.isIntersecting),
      // Trigger once the Help to Buy section reaches the middle of the viewport.
      { rootMargin: '-45% 0px -45% 0px' },
    )
    observer.observe(target)
    return () => observer.disconnect()
  }, [])

  function openEventList() {
    window.location.href = inHelpToBuy ? '/help-to-buy' : '/resale'
  }

  const label = inHelpToBuy ? 'Order HTB' : 'Book Resale'

  // The adaptive label only applies to the home page. Once a user leaves home
  // (e.g. chooses an event card), it stays hidden.
  if (pathname !== '/') return null

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-50 flex items-center gap-3 border-t border-border bg-background/95 px-4 py-3 backdrop-blur transition-all duration-300 md:hidden ${
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-full opacity-0'
      }`}
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.75rem)' }}
    >
      <button
        type="button"
        onClick={openEventList}
        className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3.5 text-base font-medium text-primary-foreground shadow-lg shadow-primary/30 transition active:scale-[0.98]"
      >
        <Ticket className="size-5" />
        <span key={label}>{label}</span>
      </button>
      <a
        href={TELEGRAM_URL}
        target="_blank"
        rel="noreferrer"
        aria-label="Contact us on Telegram"
        className="inline-flex size-[52px] shrink-0 items-center justify-center rounded-2xl border border-border bg-card text-primary shadow-sm transition active:scale-[0.98]"
      >
        <Send className="size-5" />
      </a>
    </div>
  )
}
