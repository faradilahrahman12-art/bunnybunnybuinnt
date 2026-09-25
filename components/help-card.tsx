import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import type { EventWithSchedule } from '@/lib/db/schema'
import { Clock, ShoppingBag, Ticket } from 'lucide-react'

export function HelpCard({ event }: { event: EventWithSchedule }) {
  const bookHref = `/submit?event=${event.id}`
  const subLabel = [event.country, event.platform].filter(Boolean).join(' · ')

  return (
    <article className="group flex w-[176px] shrink-0 flex-col gap-2 sm:w-[248px] sm:gap-3">
      <Link
        href={bookHref}
        className="relative block aspect-[3/4] w-full overflow-hidden rounded-2xl bg-muted shadow-sm ring-1 ring-black/5 transition group-hover:shadow-lg"
      >
        {event.imageUrl ? (
          <Image
            src={event.imageUrl || '/placeholder.svg'}
            alt={event.title}
            fill
            sizes="(max-width: 640px) 176px, 248px"
            className="object-cover transition duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="grid h-full place-items-center text-muted-foreground">
            <Ticket className="size-10" />
          </div>
        )}
      </Link>

      <div className="flex flex-col gap-1 px-0.5">
        <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-medium leading-snug tracking-tight sm:min-h-[2.75rem] sm:text-base">
          {event.title}
        </h3>
        {subLabel && <p className="line-clamp-1 text-xs text-muted-foreground sm:text-sm">{subLabel}</p>}
      </div>

      {event.saleInfo && (
        <p className="flex items-start gap-1.5 rounded-lg bg-primary/5 p-2 text-xs text-foreground">
          <Clock className="mt-0.5 size-3.5 shrink-0 text-primary" />
          <span className="line-clamp-2">{event.saleInfo}</span>
        </p>
      )}

      <Button
        className="mt-auto h-5 w-full gap-1 rounded-lg text-[10px] font-semibold sm:h-6"
        render={<Link href={bookHref} />}
      >
        <ShoppingBag className="size-3" />
        Order Now
      </Button>
    </article>
  )
}
