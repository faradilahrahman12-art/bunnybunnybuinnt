import Link from 'next/link'
import { ArrowRight, Ticket, HandCoins, ShieldCheck, Clock, BadgeCheck } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { AdminTabGate } from '@/components/admin-tab-gate'
import { Button } from '@/components/ui/button'

export const metadata = {
  title: 'Our Services — Bunnyticket',
  description: 'Resale tickets available now and Help to Buy queueing for official on-sales.',
}

const SERVICES = [
  {
    icon: Ticket,
    name: 'Resale Tickets',
    tagline: 'Available now',
    description:
      'Browse verified tickets that are ready to book right now. All-in pricing with no hidden fees — pick your date and section and reserve instantly.',
    href: '/resale',
    cta: 'Browse Resale Tickets',
  },
  {
    icon: HandCoins,
    name: 'Help to Buy',
    tagline: 'We queue for you',
    description:
      'Sold-out or high-demand sale? We line up and buy tickets on your behalf during the official on-sale. No success, no service charge.',
    href: '/help-to-buy',
    cta: 'Request a Service',
  },
]

const PERKS = [
  { icon: ShieldCheck, title: 'All-in pricing', body: 'Prices already include ticket price plus our service fee.' },
  { icon: BadgeCheck, title: 'No success, no charge', body: 'We only charge our fee when we secure your tickets.' },
  { icon: Clock, title: 'On-sale ready', body: 'We prepare early so we are queued the moment sales open.' },
]

export default function ServicesPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 px-4 py-10">
        <div className="mx-auto max-w-3xl">
          <header className="mb-8 text-center">
            <h1 className="text-3xl font-medium tracking-tight text-balance sm:text-4xl">Our Services</h1>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground text-pretty">
              Two ways to get you into the show — buy resale tickets that are available now, or let us queue and
              buy on your behalf during the official sale.
            </p>
          </header>

          <div className="grid gap-4 sm:grid-cols-2">
            {SERVICES.map((s) => (
              <div key={s.name} className="flex flex-col rounded-2xl border border-border bg-card p-5">
                <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
                  <s.icon className="size-5" />
                </span>
                <p className="mt-4 text-[11px] font-semibold uppercase tracking-wide text-primary">{s.tagline}</p>
                <h2 className="mt-1 text-lg font-bold">{s.name}</h2>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{s.description}</p>
                <Button className="mt-4 w-full gap-1.5 rounded-full" render={<Link href={s.href} />}>
                  {s.cta}
                  <ArrowRight className="size-4" />
                </Button>
              </div>
            ))}
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {PERKS.map((p) => (
              <div key={p.title} className="rounded-xl border border-border bg-card p-4">
                <span className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary">
                  <p.icon className="size-4" />
                </span>
                <p className="mt-3 text-sm font-bold">{p.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{p.body}</p>
              </div>
            ))}
          </div>

          <p className="mt-8 text-center text-xs text-muted-foreground">
            By ordering you agree to our{' '}
            <Link href="/terms" className="font-medium text-primary hover:underline">
              Terms &amp; Conditions
            </Link>
            .
          </p>
        </div>
      </main>
      <SiteFooter />
      <AdminTabGate />
    </div>
  )
}
