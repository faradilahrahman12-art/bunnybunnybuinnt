'use client'

import { useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { ResaleCard } from '@/components/resale-card'
import { HelpCard } from '@/components/help-card'
import { countryFlag } from '@/lib/countries'
import type { EventWithSchedule } from '@/lib/db/schema'
import { ArrowRight, ChevronLeft, ChevronRight, Ticket, Zap } from 'lucide-react'

type Props = {
  id: string
  variant: 'resale' | 'help_to_buy'
  title: string
  subtitle: string
  events: EventWithSchedule[]
}

export function EventsSection({ id, variant, title, subtitle, events }: Props) {
  const [active, setActive] = useState('All')
  const scroller = useRef<HTMLDivElement>(null)

  const countries = useMemo(() => {
    const set: string[] = []
    for (const e of events) if (!set.includes(e.country)) set.push(e.country)
    return set
  }, [events])

  const filtered = active === 'All' ? events : events.filter((e) => e.country === active)

  function scroll(dir: 'left' | 'right') {
    scroller.current?.scrollBy({ left: dir === 'left' ? -560 : 560, behavior: 'smooth' })
  }

  const Icon = variant === 'resale' ? Ticket : Zap
  const browseHref = variant === 'resale' ? '/resale' : '/help-to-buy'

  return (
    <section id={id} className="mx-auto max-w-6xl scroll-mt-20 px-4 py-14">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Icon className="size-5" />
          </span>
          <div>
            <h2 className="max-w-md text-[26px] font-light leading-tight tracking-tight sm:text-[26px]">{title}</h2>
            <p className="mt-1.5 text-sm text-muted-foreground sm:text-base">{subtitle}</p>
          </div>
        </div>
        <Link
          href={browseHref}
          className="flex shrink-0 items-center gap-1 text-sm font-semibold text-primary hover:underline"
        >
          Browse All <ArrowRight className="size-3.5" />
        </Link>
      </div>

      <div className="mt-7 flex flex-wrap gap-2.5">
        {['All', ...countries].map((c) => (
          <button
            key={c}
            onClick={() => setActive(c)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold transition ${
              active === c
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground'
            }`}
          >
            {c !== 'All' && <span className="text-base leading-none">{countryFlag(c)}</span>}
            {c}
          </button>
        ))}
      </div>

      <div className="relative mt-6">
        <div
          ref={scroller}
          className="flex gap-5 overflow-x-auto scroll-smooth pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {filtered.length === 0 ? (
            <p className="py-12 text-sm text-muted-foreground">No events in this category yet.</p>
          ) : (
            filtered.map((e) =>
              variant === 'resale' ? <ResaleCard key={e.id} event={e} /> : <HelpCard key={e.id} event={e} />,
            )
          )}
        </div>

        {filtered.length > 0 && (
          <>
            <button
              onClick={() => scroll('left')}
              aria-label="Scroll left"
              className="absolute -left-3 top-1/2 hidden size-9 -translate-y-1/2 place-items-center rounded-full border border-border bg-background shadow-md transition hover:bg-muted md:grid"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              onClick={() => scroll('right')}
              aria-label="Scroll right"
              className="absolute -right-3 top-1/2 hidden size-9 -translate-y-1/2 place-items-center rounded-full border border-border bg-background shadow-md transition hover:bg-muted md:grid"
            >
              <ChevronRight className="size-4" />
            </button>
          </>
        )}
      </div>

    </section>
  )
}
