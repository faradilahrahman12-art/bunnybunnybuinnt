'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { SignOutButton } from '@/components/auth/sign-out-button'
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
      <span
        className="whitespace-nowrap font-[family-name:var(--font-poppins)] text-base sm:text-lg"
        style={{ fontWeight: 600, letterSpacing: '-0.7px' }}
      >
        <span className="text-foreground" style={{ fontWeight: 600 }}>Bunny</span>
        <span className="text-primary" style={{ fontWeight: 600 }}>Ticket</span>
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
  <div className="mx-auto flex h-14 max-w-6xl items-center gap-1.5 px-3 sm:h-16 sm:gap-4 sm:px-4">
  <Logo className="shrink-0" />
  {!minimal && (
  <>
  <nav className="ml-auto flex min-w-0 items-center gap-0.5 min-[360px]:gap-1 sm:gap-2">
  <ThemeToggle className="size-8 sm:size-9" />
  <Button variant="ghost" size="sm" className="hidden text-muted-foreground md:inline-flex" render={<Link href="/help-to-buy" />}>
  Request a Service
  </Button>
  <Button variant="outline" size="sm" aria-label="My Orders" className="h-8 gap-1 rounded-full px-2.5 text-xs min-[440px]:px-3 sm:h-9 sm:gap-1.5 sm:text-sm" render={<Link href="/orders" />}>
  <Ticket className="size-3.5" />
  <span className="hidden min-[440px]:inline">My Orders</span>
  </Button>
  <SignOutButton />
  <Button size="sm" aria-label="Reviews" className="h-8 gap-1 rounded-full px-2.5 text-xs min-[440px]:px-3 sm:h-9 sm:gap-1.5 sm:text-sm" render={<Link href="/#reviews" />}>
  <Search className="size-3.5" />
  <span className="hidden min-[440px]:inline">Reviews</span>
  </Button>
            </nav>
          </>
        )}
      </div>
    </header>
  )
}
