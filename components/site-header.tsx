'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Search, Ticket } from 'lucide-react'

function useHideOnScroll() {
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    let lastY = window.scrollY
    let ticking = false

    function update() {
      const y = window.scrollY
      // Ignore tiny movements to avoid flicker.
      if (Math.abs(y - lastY) > 6) {
        // Hide when scrolling down past the header height, reveal when scrolling up.
        setHidden(y > lastY && y > 64)
        lastY = y
      }
      ticking = false
    }

    function onScroll() {
      if (!ticking) {
        ticking = true
        window.requestAnimationFrame(update)
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return hidden
}

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={`flex items-center gap-2 ${className ?? ''}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/bunny-logo.jpg"
        alt="BunnyTicket logo"
        className="size-8 rounded-full object-cover"
      />
      <span
        className="font-[family-name:var(--font-plus-jakarta-sans)]"
        style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '-0.7px' }}
      >
        <span style={{ fontWeight: 800, color: '#171717' }}>Bunny</span>
        <span style={{ fontWeight: 800, color: '#7c3aed' }}>Ticket</span>
      </span>
    </Link>
  )
}

export function SiteHeader({ minimal = false }: { minimal?: boolean }) {
  const hidden = useHideOnScroll()

  return (
    <header
      className={`sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md transition-transform duration-300 ease-out md:!translate-y-0 ${
        hidden ? '-translate-y-full' : 'translate-y-0'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4">
        <Logo />
        {!minimal && (
          <>
            <nav className="ml-auto flex items-center gap-1 sm:gap-2">
              <Button variant="ghost" size="sm" className="hidden text-muted-foreground md:inline-flex" render={<Link href="/help-to-buy" />}>
                Request a Service
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5 rounded-full" render={<Link href="/orders" />}>
                <Ticket className="size-3.5" />
                My Orders
              </Button>
              <Button size="sm" className="gap-1.5 rounded-full" render={<Link href="/#reviews" />}>
                <Search className="size-3.5" />
                Reviews
              </Button>
            </nav>
          </>
        )}
      </div>
    </header>
  )
}
