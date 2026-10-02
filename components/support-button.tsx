'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Ticket } from 'lucide-react'

const INSTAGRAM_URL = 'https://www.instagram.com/bunnyticket.main?stkn=NHcwMjd4aTA2NGli'

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <rect width="20" height="20" x="2" y="2" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r=".75" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function SupportButton() {
  const pathname = usePathname()
  const [visible, setVisible] = useState(false)
  const [activeSection, setActiveSection] = useState<'resale' | 'help-to-buy' | 'reviews'>('resale')

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > 300)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const sections = [
      { id: 'resale', name: 'resale' as const },
      { id: 'help-to-buy', name: 'help-to-buy' as const },
      { id: 'reviews', name: 'reviews' as const },
    ]
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((entry) => entry.isIntersecting)
        if (visible) {
          const section = sections.find(({ id }) => id === visible.target.id)
          if (section) setActiveSection(section.name)
        }
      },
      { rootMargin: '-45% 0px -45% 0px' },
    )
    sections.forEach(({ id }) => {
      const target = document.getElementById(id)
      if (target) observer.observe(target)
    })
    return () => observer.disconnect()
  }, [])

  function openEventList() {
    window.location.href = activeSection === 'reviews' ? '/reviews' : activeSection === 'help-to-buy' ? '/help-to-buy' : '/resale'
  }

  const label = activeSection === 'reviews' ? 'View all reviews' : activeSection === 'help-to-buy' ? 'Order HTB' : 'Book resale'

  // The adaptive label only applies to the home page. Once a user leaves home
  // (e.g. chooses an event card), it stays hidden.
  if (pathname !== '/') return null

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-50 flex items-center gap-2 border-t border-border bg-background/95 px-3 py-1.5 backdrop-blur transition-all duration-300 md:hidden ${
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-full opacity-0'
      }`}
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.375rem)' }}
    >
      {activeSection === 'reviews' ? (
        <a
          href="/reviews"
          className="inline-flex min-h-8 flex-1 items-center justify-center gap-1 rounded-lg bg-primary px-2 py-1 text-xs font-medium text-primary-foreground shadow-lg shadow-primary/30 transition active:scale-[0.98]"
        >
          <Ticket className="size-4" />
          <span>View all reviews</span>
        </a>
      ) : (
      <button
        type="button"
        onClick={openEventList}
        className="inline-flex min-h-8 flex-1 items-center justify-center gap-1 rounded-lg bg-primary px-2 py-1 text-xs font-medium text-primary-foreground shadow-lg shadow-primary/30 transition active:scale-[0.98]"
      >
        <Ticket className="size-5" />
        <span key={label}>{label}</span>
      </button>
      )}
      <a
        href={INSTAGRAM_URL}
        target="_blank"
        rel="noreferrer"
        aria-label="Visit Bunnyticket Store"
        className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-primary shadow-sm transition active:scale-[0.98]"
      >
        <InstagramIcon className="size-5" />
      </a>
    </div>
  )
}
