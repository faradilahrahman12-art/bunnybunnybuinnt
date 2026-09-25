import Link from 'next/link'
import { ArrowLeft, ShieldAlert } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { AdminTabGate } from '@/components/admin-tab-gate'
import { Button } from '@/components/ui/button'
import { getSubmitContent } from '@/lib/settings'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Terms & Conditions — Bunnyticket',
  description: 'Terms & Conditions for our Ticket Purchase Assistance Service.',
}

export default async function TermsPage() {
  const { terms } = await getSubmitContent()
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 px-4 py-10">
        <div className="mx-auto max-w-2xl">
          <Button
            variant="ghost"
            size="sm"
            className="mb-6 gap-1.5 text-muted-foreground"
            render={<Link href="/" />}
          >
            <ArrowLeft className="size-4" />
            Back to home
          </Button>

          <header className="mb-8">
            <h1 className="text-3xl font-medium tracking-tight text-balance sm:text-4xl">
              Terms &amp; Conditions
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Please read these terms carefully. Submitting an order confirms that you have read, understood, and
              agreed to all of the sections below.
            </p>
          </header>

          <div className="flex flex-col gap-6">
            {terms.sections.map((t) => (
              <section key={t.heading}>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">{t.heading}</h2>
                {t.body.map((line, i) => (
                  <p key={i} className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                    {line}
                  </p>
                ))}
              </section>
            ))}
          </div>

          <div className="mt-8 flex items-start gap-3 rounded-xl border border-red-300/70 bg-red-50 p-4 dark:border-red-500/30 dark:bg-red-500/10">
            <ShieldAlert className="mt-0.5 size-5 shrink-0 text-red-600 dark:text-red-400" />
            <div className="text-sm leading-relaxed text-red-700 dark:text-red-300">
              <p className="font-bold">{terms.finalWarningTitle}</p>
              <p className="mt-1 whitespace-pre-line">{terms.finalWarningBody}</p>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button className="rounded-full" render={<Link href="/help-to-buy" />}>
              Request a Service
            </Button>
            <Button variant="outline" className="rounded-full" render={<Link href="/resale" />}>
              Browse Resale Tickets
            </Button>
          </div>
        </div>
      </main>
      <SiteFooter />
      <AdminTabGate />
    </div>
  )
}
