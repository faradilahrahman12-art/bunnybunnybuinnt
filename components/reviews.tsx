import { createHash } from 'node:crypto'
import { Heart } from 'lucide-react'
import { getReviews } from '@/lib/reviews'
import { ReviewsGrid } from '@/components/reviews-grid'

const HOME_REVIEW_LIMIT = 6

export async function Reviews({ showAll = false }: { showAll?: boolean }) {
  const reviews = (await getReviews()).map((review) => ({
    ...review,
    images: review.images.map((src, i) =>
      src.startsWith('data:')
        ? `/api/review-images/${review.id}/${i}?v=${createHash('sha1').update(src).digest('hex').slice(0, 12)}`
        : src,
    ),
  }))

  return (
    <section id="reviews" className="scroll-mt-20 pb-16 pt-12">
      <div className="mx-auto max-w-6xl px-4">
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            <Heart className="size-4 fill-pink-500 text-pink-500" aria-hidden="true" />
            Happy Concert-Goers
          </span>
          <h2 className="mt-5 text-balance text-3xl font-bold tracking-tight sm:text-4xl">Real reviews from real fans</h2>
          <p className="mx-auto mt-3 max-w-md text-pretty text-muted-foreground">
            Thousands of concert fans have made it to their dream concerts with BunnyTicket.
          </p>
          <p className="mt-5 text-sm text-muted-foreground">
            <span className="text-lg font-semibold text-foreground">5.0</span> · Verified customer reviews
          </p>
        </div>

        {reviews.length === 0 ? (
          <p className="mt-10 text-center text-sm text-muted-foreground">No reviews yet — check back soon!</p>
        ) : (
          <ReviewsGrid reviews={reviews} limit={showAll ? undefined : HOME_REVIEW_LIMIT} />
        )}
      </div>
    </section>
  )
}
