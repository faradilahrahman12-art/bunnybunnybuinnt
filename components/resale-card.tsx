import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import type { EventWithSchedule } from '@/lib/db/schema'
import { ShoppingBag, Ticket } from 'lucide-react'

export function ResaleCard({ event }: { event: EventWithSchedule }) {
  const totalTickets = event.schedule.reduce(
    (sum, d) => sum + d.sections.reduce((s, sec) => s + sec.quantity, 0),
    0,
  )
  const soldOut = event.schedule.length > 0 && totalTickets === 0
  const dateLabels = event.schedule.map((d) => d.label)
  const datesText = dateLabels.length ? dateLabels.join(' · ') : event.dates
  const bookHref = `/submit?event=${event.id}`

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
        {event.schedule.length > 0 && (
          <span
            className={`absolute right-2.5 top-2.5 rounded-full px-2.5 py-1 text-[11px] font-bold shadow ${
              soldOut ? 'bg-foreground/80 text-background' : 'bg-primary text-primary-foreground'
            }`}
          >
            {soldOut ? 'Sold Out' : `${totalTickets} left`}
          </span>
        )}
      </Link>

      <div className="flex flex-col gap-1 px-0.5">
        <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-medium leading-snug tracking-tight sm:min-h-[2.75rem] sm:text-base">
          {event.title}
        </h3>
        {datesText && <p className="line-clamp-1 text-xs text-muted-foreground sm:text-sm">{datesText}</p>}
      </div>

      <div className="flex flex-col gap-2">
        {soldOut ? (
          <Button className="h-5 w-full gap-1 rounded-lg text-[10px] font-semibold sm:h-6" disabled>
            <ShoppingBag className="size-3" />
            Sold Out
          </Button>
        ) : (
          <Button
            className="h-5 w-full gap-1 rounded-lg text-[10px] font-semibold sm:h-6"
            render={<Link href={bookHref} />}
          >
            <ShoppingBag className="size-3" />
            Book a Ticket
          </Button>
        )}
      </div>
    </article>
  )
}
