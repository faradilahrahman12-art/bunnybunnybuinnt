import Link from 'next/link'
import { Logo } from '@/components/site-header'

const LINKS = [
  { label: 'Resale Tickets', href: '/resale' },
  { label: 'Help to Buy', href: '/help-to-buy' },
  { label: 'Reviews', href: '/reviews' },
  { label: 'Request a Service', href: '/help-to-buy' },
  { label: 'Submit an Order', href: '/help-to-buy' },
  { label: 'Our Services', href: '/services' },
  { label: 'Terms & Conditions', href: '/terms' },
]

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-12 text-center">
        <Logo />
        <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
          {LINKS.map((l) => (
            <Link key={l.label} href={l.href} className="transition hover:text-primary">
              {l.label}
            </Link>
          ))}
        </nav>
        <p className="text-xs text-muted-foreground">© 2026 Bunnyticket. All rights reserved.</p>
      </div>
    </footer>
  )
}
