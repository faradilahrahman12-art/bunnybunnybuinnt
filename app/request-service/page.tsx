import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { RequestServiceForm } from '@/components/request-service/request-service-form'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Request a Service — Bunnyticket',
  description:
    "Can't find what you're looking for? Tell us what you need and our team will get back to you — usually within a few hours on Telegram.",
}

export default function RequestServicePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 px-4 py-10">
        <div className="mx-auto mb-8 max-w-2xl text-center">
          <h1 className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
            Can&apos;t find what you&apos;re looking for?
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-pretty text-sm text-muted-foreground">
            Tell us what you need and our team will get back to you — usually within a few hours on
            Telegram.
          </p>
        </div>
        <RequestServiceForm />
      </main>
      <SiteFooter />
    </div>
  )
}
