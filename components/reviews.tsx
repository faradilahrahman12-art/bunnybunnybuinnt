import { BadgeCheck, Heart, Star } from 'lucide-react'
import { getReviews } from '@/lib/reviews'
import type { Review } from '@/lib/db/schema'

function ReviewCard({ review }: { review: Review }) {
  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
      <header className="flex items-center gap-2">
        <p className="flex items-center gap-1 font-semibold">
          {review.name}
          <BadgeCheck className="size-4 text-primary" />
        </p>
      </header>

      {review.event && <p className="-mt-3 text-sm text-muted-foreground">{review.event}</p>}

      {review.images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {review.images.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={src || '/placeholder.svg'}
              alt={`Photo from ${review.name}'s review`}
              className="size-24 rounded-lg border border-border object-cover"
            />
          ))}
        </div>
      )}

      <p className="text-pretty text-sm leading-relaxed text-primary">{review.text}</p>
    </article>
  )
}

export async function Reviews() {
  const reviews = await getReviews()

  return (
    <section id="reviews" className="scroll-mt-20 bg-gradient-to-b from-primary/5 to-transparent pb-16 pt-0">
      <div className="mx-auto max-w-6xl px-4">
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
            <Heart className="size-3.5 fill-primary" />
            Happy Concert-Goers
          </span>
          <h2 className="mt-3 text-[30px] font-medium tracking-tight text-[#ea193f] sm:text-[30px]">Wall of Love</h2>
          <p className="mx-auto mt-3 max-w-xl text-pretty text-muted-foreground">
            Thousands of concert fans have made it to their dream concerts with Bunnyticket.
          </p>
          <div className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-4 py-0 text-sm font-semibold text-primary">
            <Star className="size-4 fill-primary" />
            5.0 · Verified customer reviews
          </div>
        </div>

        {reviews.length > 0 ? (
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {reviews.map((r) => (
              <ReviewCard key={r.id} review={r} />
            ))}
          </div>
        ) : (
          <p className="mt-10 text-center text-sm text-muted-foreground">No reviews yet — check back soon!</p>
        )}
      </div>
    </section>
  )
}
