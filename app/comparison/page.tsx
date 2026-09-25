import Link from 'next/link'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { AdminTabGate } from '@/components/admin-tab-gate'
import { Button } from '@/components/ui/button'
import { Ticket, Zap, CreditCard, ScanFace, Send, Search } from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: "What's the Difference? Resale vs Help to Buy — Bunnyticket",
  description:
    'Compare our resale ticket service and help-to-buy (HTB) queuing service, plus the delivery methods we use to get your concert tickets to you.',
}

export default function ComparisonPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="mx-auto max-w-5xl px-4 py-16">
          <div className="text-center">
            <h1 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
              Our Concert Ticket Services
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-pretty text-muted-foreground">
              Everything you need to get concert tickets across Asia — whether you want resale tickets or help
              queuing on sale day.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <div className="flex flex-col rounded-2xl bg-card p-6 ring-1 ring-foreground/10">
              <span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
                <Ticket className="size-5" />
              </span>
              <h2 className="mt-4 text-xl font-bold">Resale Tickets</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Buy resale concert tickets from our network of trusted sellers. We offer flexible delivery
                options — transfer, shipping, or meetup — depending on the event and venue. Over 20,000 orders
                fulfilled since 2020 with a 99% success rate.
              </p>
              <p className="mt-4 rounded-lg bg-muted/60 px-3 py-2 text-sm text-muted-foreground">
                <strong className="font-semibold text-foreground">Best for:</strong> Fans who missed the official
                sale and want a specific seat legally registered under their own name.
              </p>
              <Button
                size="lg"
                className="mt-6 w-full rounded-full"
                render={<Link href="/resale" />}
              >
                Browse Resale Tickets
              </Button>
            </div>

            <div className="flex flex-col rounded-2xl bg-card p-6 ring-1 ring-foreground/10">
              <span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
                <Zap className="size-5" />
              </span>
              <h2 className="mt-4 text-xl font-bold">Help to Buy (HTB)</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                We queue and buy tickets on your behalf during official sales. You submit your ticketing account
                details beforehand, and our team enters the queue for you on sale day using professional tools and
                multiple devices. You only pay the service fee if we successfully secure your tickets — no success,
                no charge.
              </p>
              <p className="mt-4 rounded-lg bg-muted/60 px-3 py-2 text-sm text-muted-foreground">
                <strong className="font-semibold text-foreground">Best for:</strong> Fans who can&apos;t be online
                during the sale window, are in a different timezone, or want professional help getting through
                competitive queues.
              </p>
              <Button
                size="lg"
                className="mt-6 w-full rounded-full"
                render={<Link href="/help-to-buy" />}
              >
                Browse HTB Events
              </Button>
            </div>
          </div>

          <div className="mt-16 text-center">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Delivery Methods</h2>
            <p className="mx-auto mt-3 max-w-2xl text-pretty text-muted-foreground">
              How we get your tickets to you. Methods 1–2 apply to Korea concerts. Other countries may vary.
            </p>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <div className="flex flex-col rounded-2xl bg-card p-6 ring-1 ring-foreground/10">
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary">
                  <CreditCard className="size-5" />
                </span>
                <h3 className="text-lg font-bold">Method 1: Digital Ticket Transfer</h3>
              </div>
              <p className="mt-4 text-sm font-semibold">Platforms: Interpark / Melon / Yes24</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Our automated bot cancels the ticket and repurchases the exact seat using your personal account
                within milliseconds. The ticket is legally registered under your name.
              </p>
              <p className="mt-4 text-sm text-muted-foreground">
                <strong className="font-semibold text-foreground">Best for:</strong> Clients who want the ticket
                legally registered under their own account.
              </p>
            </div>

            <div className="flex flex-col rounded-2xl bg-card p-6 ring-1 ring-foreground/10">
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary">
                  <ScanFace className="size-5" />
                </span>
                <h3 className="text-lg font-bold">Method 2: FacePass Account</h3>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                We provide a pre-loaded Interpark account. You register your facial biometrics and enter the venue
                via the FacePass lane.
              </p>
              <p className="mt-4 text-sm text-muted-foreground">
                <strong className="font-semibold text-foreground">Best for:</strong> Clients using FacePass for the
                very first time.
              </p>
              <p className="mt-4 rounded-lg bg-amber-500/15 px-3 py-2 text-sm text-amber-700 dark:text-amber-300">
                Only available to users who have NEVER registered for FacePass before.
              </p>
            </div>
          </div>

          <div className="mt-16 overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-primary/70 px-6 py-14 text-center text-primary-foreground">
            <h2 className="text-3xl font-bold tracking-tight">Ready to Get Your Tickets?</h2>
            <p className="mx-auto mt-3 max-w-xl text-pretty text-primary-foreground/90">
              Over 20,000 orders fulfilled since 2020. Create an account and submit your reservation in minutes.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button
                size="lg"
                variant="secondary"
                className="gap-2 rounded-full bg-background text-primary hover:bg-background/90"
                render={<Link href="/#resale" />}
              >
                <Send className="size-4" />
                Book Now
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="gap-2 rounded-full border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"
                render={<Link href="/resale" />}
              >
                <Search className="size-4" />
                Browse Events
              </Button>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
      <AdminTabGate />
    </div>
  )
}
