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
      <div className="relative mx-auto max-w-4xl px-4 pb-16 pt-14 text-center sm:pt-20">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          <Sparkles className="size-3.5" />
          Asia Concert Ticket Services
        </span>
        <h1
          className="mt-6 text-balance text-[30px] font-medium leading-[1.1] tracking-tight sm:text-[30px] md:text-[30px]"
          style={{ fontFamily: 'var(--font-poppins), sans-serif' }}
        >
          Buy Concert Tickets From a Trusted Source{' '}
          <span className="text-primary">K-pop &amp; Live Events Across Asia</span>
        </h1>
        <p
          className="mx-auto mt-5 max-w-2xl text-pretty text-[15px] text-muted-foreground"
          style={{ fontFamily: 'var(--font-poppins), sans-serif' }}
        >
          Resale tickets from verified sellers with flexible delivery — transfer, shipping, or meetup. Help-to-buy
          queuing for sold-out shows. Over 20,000 orders fulfilled across 9 countries.
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
          className="mt-8 flex flex-nowrap items-center justify-center gap-x-3 text-[11px] sm:flex-wrap sm:gap-x-6 sm:gap-y-3 sm:text-xs"
          style={{ fontFamily: 'var(--font-poppins), sans-serif' }}
        >
          <span className="flex shrink-0 items-center gap-1.5">
            <Users className="size-3.5 text-primary sm:size-4" />
            <strong className="font-semibold">20,000+</strong>
            <span className="text-muted-foreground">orders</span>
          </span>
          <span className="flex shrink-0 items-center gap-1.5">
            <ShieldCheck className="size-3.5 text-primary sm:size-4" />
            <strong className="font-semibold">99%</strong>
            <span className="text-muted-foreground">
              <span className="sm:hidden">success</span>
              <span className="hidden sm:inline">success rate</span>
            </span>
          </span>
          <span className="flex shrink-0 items-center gap-1.5">
            <Star className="size-3.5 fill-primary text-primary sm:size-4" />
            <strong className="font-semibold">4.9</strong>
            <span className="hidden whitespace-nowrap text-muted-foreground sm:inline">from 5,000+ reviews</span>
          </span>
          <Link
            href="https://t.me/Nabiupdates"
            target="_blank"
            rel="noreferrer"
            className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-primary/40 bg-transparent px-2.5 py-1 text-[11px] font-medium text-primary transition hover:bg-primary/5 sm:px-4 sm:py-2 sm:text-base"
          >
            <InstagramIcon className="size-3.5 sm:size-4" />
            <span className="sm:hidden">Instagram</span>
            <span className="hidden sm:inline">Follow on Instagram</span>
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
          <span className="flex items-center gap-2 text-xl font-medium tracking-tight sm:text-2xl">
            <ShieldCheck className="size-5 text-primary sm:size-6" />
            Active since 2020
          </span>
          <span className="text-sm text-muted-foreground sm:text-base">
            Interpark · Melon · Yes24 · Ticketmaster
          </span>
        </div>
      </div>
    </section>
  )
}
