import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { CountryBadge } from '@/components/country-badge'
import { HERO_COUNTRIES } from '@/lib/countries'
import { ChevronRight, HelpCircle, Search, Star, Ticket, Users, ShieldCheck, Zap } from 'lucide-react'

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <rect width="20" height="20" x="2" y="2" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r=".75" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function Hero() {
  return (
    <>
      <section className="border-b border-border bg-gradient-to-b from-secondary to-background">
        <div className="mx-auto flex max-w-4xl flex-col items-center px-4 pb-16 pt-14 text-center sm:pb-20 sm:pt-24">
          <span className="inline-flex items-center gap-1.5 rounded-md border border-primary/20 bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
            <Ticket className="size-3.5" aria-hidden="true" />
            BunnyTicket · Concert Ticket Services
          </span>

          <h1 className="mt-4 text-balance text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl sm:leading-none">
            <span className="sr-only">BunnyTicket: </span>
            Concert &amp; Event Ticket Assistance
            <span className="block text-primary sm:mt-1">Live Events Across Asia</span>
          </h1>

          <p className="mt-5 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
            Find resale concert tickets and get Help to Buy assistance for official on-sales across the
            Philippines and international events.
          </p>

          <div className="mt-8 flex w-full flex-row items-center justify-center gap-3 sm:w-auto">
            <Button
              className="h-12 flex-1 gap-2 rounded-[10px] px-6 shadow-[0_2px_12px_-1px_rgba(98,82,122,0.1)] sm:flex-none"
              render={<Link href="/resale" />}
            >
              <Search className="size-4" aria-hidden="true" />
              Browse Events
            </Button>
            <Button
              variant="outline"
              className="h-12 flex-1 gap-2 rounded-[10px] bg-background px-6 shadow-[0_2px_12px_-1px_rgba(98,82,122,0.1)] sm:flex-none"
              render={<Link href="/request-service" />}
            >
              <Ticket className="size-4" aria-hidden="true" />
              Request Service
            </Button>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Users className="size-4" aria-hidden="true" />
              20,000+ orders
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="size-4" aria-hidden="true" />
              99% success rate
            </span>
            <span className="flex items-center gap-1.5">
              <Star className="size-4" aria-hidden="true" />
              4.9 from 5,000+ reviews
            </span>
            <Link
              href="https://www.instagram.com/bunnyticket.main?stkn=NHcwMjd4aTA2NGli"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 px-3 py-1 font-medium text-primary transition-colors hover:bg-primary/5"
            >
              <InstagramIcon className="size-4" />
              Follow our Instagram
            </Link>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            {HERO_COUNTRIES.map((c) => (
              <span key={c} className="flex size-9 items-center justify-center rounded-full border border-border bg-background shadow-sm">
                <CountryBadge country={c} size={22} />
              </span>
            ))}
          </div>
        </div>
      </section>

      <div className="flex flex-col items-center gap-3 px-4 py-6">
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="#resale"
            className="inline-flex h-10 items-center gap-2 rounded-full border-2 border-primary/40 bg-secondary px-5 text-sm font-medium text-foreground transition-colors hover:bg-primary/10"
          >
            <Ticket className="size-4 text-primary" aria-hidden="true" />
            Resale Tickets
          </Link>
          <Link
            href="#help-to-buy"
            className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-background px-5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
          >
            <Zap className="size-4 text-primary" aria-hidden="true" />
            Help to Buy
          </Link>
        </div>
        <Link
          href="/comparison"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-primary"
        >
          <HelpCircle className="size-3.5" aria-hidden="true" />
          What&apos;s the difference?
          <ChevronRight className="size-3.5" aria-hidden="true" />
        </Link>
      </div>

      <div className="border-y border-border bg-secondary/60">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-center gap-1.5 px-4 py-3 text-center sm:flex-row sm:gap-6">
          <span className="flex items-center gap-2 text-sm font-medium text-foreground">
            <ShieldCheck className="size-4 text-primary" aria-hidden="true" />
            Active since 2020
          </span>
          <span className="hidden h-4 w-px bg-border sm:block" aria-hidden="true" />
          <span className="text-xs text-muted-foreground">
            Interpark · Melon · Yes24 · Ticketmaster · SM Tickets · Pulp · Ticketnet
          </span>
        </div>
      </div>
    </>
  )
}
