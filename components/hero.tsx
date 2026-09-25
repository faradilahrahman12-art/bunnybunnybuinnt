import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { CountryBadge } from '@/components/country-badge'
import { HERO_COUNTRIES } from '@/lib/countries'
import { ArrowRight, Search, Send, Sparkles, Star, Ticket, Users, ShieldCheck, Zap } from 'lucide-react'

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
          className="mt-6 text-balance text-4xl font-medium leading-[1.1] tracking-tight sm:text-5xl md:text-5xl"
          style={{ fontFamily: 'var(--font-poppins), sans-serif' }}
        >
          Buy Concert Tickets From a Trusted Source{' '}
          <span className="text-primary">K-pop &amp; Live Events Across Asia</span>
        </h1>
        <p
          className="mx-auto mt-5 max-w-2xl text-pretty text-base text-muted-foreground"
          style={{ fontFamily: 'var(--font-poppins), sans-serif' }}
        >
          Resale tickets from verified sellers with flexible delivery — transfer, shipping, or meetup. Help-to-buy
          queuing for sold-out shows. Over 20,000 orders fulfilled across 9 countries.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 text-sm sm:flex-row">
          <Button size="lg" className="gap-2 rounded-full" render={<Link href="/resale" />}>
            <Search className="size-4" />
            Browse Events
          </Button>
          <Button size="lg" variant="outline" className="gap-2 rounded-full" render={<Link href="/orders" />}>
            <Ticket className="size-4" />
            My Orders
          </Button>
        </div>

        <div
          className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-xs"
          style={{ fontFamily: 'var(--font-poppins), sans-serif' }}
        >
          <span className="flex items-center gap-1.5">
            <Users className="size-4 text-primary" />
            <strong className="font-semibold">20,000+</strong>
            <span className="text-muted-foreground">orders</span>
          </span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="size-4 text-primary" />
            <strong className="font-semibold">99%</strong>
            <span className="text-muted-foreground">success rate</span>
          </span>
          <span className="flex items-center gap-1.5">
            <Star className="size-4 fill-primary text-primary" />
            <strong className="font-semibold">4.9</strong>
            <span className="text-muted-foreground">from 5,000+ reviews</span>
          </span>
          <Link
            href="https://t.me/Nabiupdates"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-transparent px-4 py-2 text-base font-medium text-primary transition hover:bg-primary/5"
          >
            <Send className="size-4" />
            Join our Telegram
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
      </div>
    </section>
  )
}
