import { Star } from 'lucide-react'
import { getReviews } from '@/lib/reviews'
import { ReviewCard, ReviewsCarousel } from '@/components/reviews-carousel'

export async function Reviews({ showAll = false }: { showAll?: boolean }) {
  const reviews = await getReviews()

  return (
    <section id="reviews" className="scroll-mt-20 bg-gradient-to-b from-primary/5 to-transparent pb-16 pt-0">
      <div className="mx-auto max-w-6xl px-4">
        <div className="text-center">

          <h2 className="mt-3 text-[30px] font-medium tracking-tight text-[#ea193f] sm:text-[30px]">Wall of Love</h2>
          <p className="mx-auto mt-3 max-w-xl text-pretty text-muted-foreground">
            Thousands of concert fans have made it to their dream concerts with Bunnyticket.
          </p>
          <div className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-4 py-0 text-sm font-semibold text-primary">
            <Star className="size-4 fill-primary" />
            5.0 · Verified customer reviews
          </div>
        </div>

        {reviews.length === 0 ? (
          <p className="mt-10 text-center text-sm text-muted-foreground">No reviews yet — check back soon!</p>
        ) : showAll ? (
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {reviews.map((r) => (
              <ReviewCard key={r.id} review={r} clamp={false} />
            ))}
          </div>
        ) : (
          <ReviewsCarousel reviews={reviews} />
        )}
      </div>
    </section>
  )
}
