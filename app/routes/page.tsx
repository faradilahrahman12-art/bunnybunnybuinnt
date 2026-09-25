import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'

export const metadata = {
  title: 'All Routes — Bunnyticket',
  description: 'Quick access to every page in the app.',
}

type RouteEntry = { path: string; label: string; description: string }

const ROUTES: { group: string; items: RouteEntry[] }[] = [
  {
    group: 'Public',
    items: [
      { path: '/', label: 'Home', description: 'Landing page' },
      { path: '/resale', label: 'Resale Tickets', description: 'Available-now resale listings' },
      { path: '/help-to-buy', label: 'Help to Buy', description: 'Events we queue for you' },
      { path: '/services', label: 'Our Services', description: 'Overview of both offerings' },
      { path: '/comparison', label: 'Comparison', description: 'Compare service options' },
      { path: '/reviews', label: 'Reviews', description: 'Client reviews' },
      { path: '/terms', label: 'Terms & Conditions', description: 'Full terms of service' },
    ],
  },
  {
    group: 'Booking',
    items: [{ path: '/submit', label: 'Request a Service', description: '5-step booking wizard' }],
  },
  {
    group: 'Shortcuts',
    items: [{ path: '/htb', label: '/htb → Help to Buy', description: 'Redirects to /help-to-buy' }],
  },
]

export default function RoutesPage() {
  return (
    <main className="mx-auto min-h-screen max-w-2xl px-4 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">All Routes</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Quick access to every page in the app.
        </p>
      </header>

      <div className="flex flex-col gap-8">
        {ROUTES.map((section) => (
          <section key={section.group}>
            <h2 className="mb-3 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
              {section.group}
            </h2>
            <ul className="flex flex-col gap-2">
              {section.items.map((r) => (
                <li key={r.path}>
                  <Link
                    href={r.path}
                    className="group flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary hover:bg-primary/5"
                  >
                    <span className="min-w-0">
                      <span className="flex items-center gap-2">
                        <span className="text-sm font-bold">{r.label}</span>
                        <code className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                          {r.path}
                        </code>
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                        {r.description}
                      </span>
                    </span>
                    <ArrowUpRight className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </main>
  )
}
