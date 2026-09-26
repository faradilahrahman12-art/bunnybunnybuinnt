import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { CountryBadge } from '@/components/country-badge'
import { HERO_COUNTRIES } from '@/lib/countries'
import { ArrowRight, Search, Sparkles, Star, Ticket, Users, ShieldCheck, Zap } from 'lucide-react'

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
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-gradient-to-b from-primary/10 via-primary/5 to-transparent" />
      <div className="pointer-events-none absolute left-1/2 top-[-120px] size-[480px] -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
      <div className="relative mx-auto max-w-4xl px-4 pb-0 pt-14 text-center sm:pt-20">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          <Sparkles className="size-3.5" />
         BunnyTicket • Concert Ticket Services
        </span>
        <h1
          className="mt-6 text-balance text-[30px] font-medium leading-[1.1] tracking-tight sm:text-[30px] md:text-[30px]"
          style={{ fontFamily: 'var(--font-poppins), sans-serif' }}
        >
          Concert & Event Ticket Assistance{" "}
<span className="text-primary">— Live Events Across Asia</span>
        </h1>
        <p
          className="mx-auto mt-5 max-w-2xl text-pretty text-[15px] text-muted-foreground"
          style={{ fontFamily: 'var(--font-poppins), sans-serif' }}
        >
         Find resale concert tickets and get Help to Buy assistance for official
on-sales across the Philippines and international events.
        </p>

        <div className="mt-8 flex flex-row flex-nowrap items-center justify-center gap-2 text-sm sm:gap-3">
          <Button className="gap-2 rounded-full sm:h-11 sm:px-8" render={<Link href="/resale" />}>
            <Search className="size-4" />
            Browse Events
          </Button>
          <Button variant="outline" className="gap-2 rounded-full sm:h-11 sm:px-8" render={<Link href="/orders" />}>
            <Ticket className="size-4" />
            My Orders
          </Button>
        </div>

        <div
          className="mt-8 flex max-w-full flex-wrap items-center justify-center gap-x-3 gap-y-2 text-sm sm:gap-x-6 sm:gap-y-3"
          style={{ fontFamily: 'var(--font-poppins), sans-serif' }}
        >
          <span className="flex shrink-0 items-center gap-1.5 text-sm">
            <Users className="size-3.5 text-primary sm:size-4" />
            <strong className="font-semibold">20,000+</strong>
            <span className="text-muted-foreground">orders</span>
          </span>
          <span className="flex shrink-0 items-center gap-1.5 text-sm">
            <ShieldCheck className="size-3.5 text-primary sm:size-4" />
            <strong className="font-semibold">99%</strong>
            <span className="text-muted-foreground">success rate</span>
          </span>
          <span className="flex shrink-0 items-center gap-1.5 text-sm">
            <Star className="size-3.5 fill-primary text-primary sm:size-4" />
            <strong className="font-semibold">4.9</strong>
            <span className="whitespace-nowrap text-muted-foreground">from 5,000+ reviews</span>
          </span>
          <Link
            href="https://www.instagram.com/bunnyticket.main?stkn=NHcwMjd4aTA2NGli"
            target="_blank"
            rel="noreferrer"
            className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-primary/40 bg-transparent px-2.5 py-1 text-[11px] font-medium text-primary transition hover:bg-primary/5 sm:px-4 sm:py-2 sm:text-base"
          >
            <InstagramIcon className="size-3.5 sm:size-4" />
            <span>Follow our Instagram</span>
          </Link>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-2 text-[10px]">
          {HERO_COUNTRIES.map((c) => (
            <CountryBadge key={c} country={c} size={28} />
          ))}
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="#resale"
            className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-background px-4 py-2 text-sm font-semibold text-primary shadow-sm transition hover:bg-primary/5"
          >
            <Ticket className="size-4" />
            Resale Tickets
          </Link>
          <Link
            href="#help-to-buy"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground shadow-sm transition hover:bg-muted"
          >
            <Zap className="size-4 text-primary" />
            Help to Buy
          </Link>
        </div>
        <Link
          href="/comparison"
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-primary"
        >
          What&apos;s the difference? <ArrowRight className="size-3.5" />
        </Link>

        <div
          className="mt-8 flex flex-col items-center gap-1.5"
          style={{ fontFamily: 'var(--font-poppins), sans-serif' }}
        >
          <span className="flex items-center gap-2 text-sm font-medium tracking-tight">
            <ShieldCheck className="size-5 text-primary sm:size-6" />
            Active since 2020
          </span>
          <span className="text-xs text-muted-foreground">
            Interpark · Melon · Yes24 · Ticketmaster · Sm Tickets · Pulp · Ticketnet
          </span>
        </div>
      </div>
    </section>
  )
}
