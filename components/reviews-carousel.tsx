'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, BadgeCheck, ChevronLeft, ChevronRight } from 'lucide-react'
import type { Review } from '@/lib/db/schema'
import { cn } from '@/lib/utils'

const LONG_REVIEW_CHARS = 140

function ReviewPhotos({ images, name }: { images: string[]; name: string }) {
  if (images.length === 0) return null
  const alt = `Photo from ${name}'s review`

  if (images.length === 1) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={images[0] || '/placeholder.svg'}
        alt={alt}
        loading="lazy"
        className="aspect-[4/5] w-60 max-w-full rounded-xl border border-border object-cover"
      />
    )
  }

  if (images.length === 2) {
    return (
      <div className="grid grid-cols-2 gap-2">
        {images.map((src, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={i}
            src={src || '/placeholder.svg'}
            alt={alt}
            loading="lazy"
            className="aspect-[4/5] w-full rounded-xl border border-border object-cover"
          />
        ))}
      </div>
    )
  }

  return (
    <div className="-mx-4 flex snap-x gap-2 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:-mx-5 sm:px-5">
      {images.map((src, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={i}
          src={src || '/placeholder.svg'}
          alt={alt}
          loading="lazy"
          className="aspect-[4/5] w-[46%] shrink-0 snap-start rounded-xl border border-border object-cover"
        />
      ))}
    </div>
  )
}

export function ReviewCard({ review, clamp = true }: { review: Review; clamp?: boolean }) {
  const [expanded, setExpanded] = useState(false)
  const isLong = review.text.length > LONG_REVIEW_CHARS

  return (
    <article className="flex h-auto flex-col rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
      <header className="flex flex-col gap-0.5">
        <p className="flex items-center gap-1 font-semibold">
          {review.name}
          <BadgeCheck className="size-4 text-primary" aria-hidden="true" />
        </p>
        {review.event && <p className="text-sm text-muted-foreground">{review.event}</p>}
      </header>

      {review.images.length > 0 && (
        <div className="mt-3">
          <ReviewPhotos images={review.images} name={review.name} />
        </div>
      )}

      <p
        className={cn(
          'text-pretty text-sm leading-relaxed text-primary',
          review.images.length > 0 ? 'mt-4' : 'mt-3',
          clamp && !expanded && 'line-clamp-4',
        )}
      >
        {review.text}
      </p>
      {clamp && isLong && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="mt-1 self-start text-xs font-semibold text-foreground underline-offset-4 hover:underline"
        >
          {expanded ? 'Show less' : 'Read more'}
        </button>
      )}

      <p className="mt-3 flex items-center gap-1 text-xs font-medium text-muted-foreground">
        <BadgeCheck className="size-3.5 text-primary" aria-hidden="true" />
        Verified Customer
      </p>
    </article>
  )
}

export function ReviewsCarousel({ reviews }: { reviews: Review[] }) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)
  const [height, setHeight] = useState<number | undefined>(undefined)

  const measure = useCallback(() => {
    const track = trackRef.current
    if (!track) return
    const slides = Array.from(track.children) as HTMLElement[]
    const viewLeft = track.scrollLeft
    const viewRight = viewLeft + track.clientWidth
    let closest = 0
    let min = Infinity
    let tallest = 0
    slides.forEach((slide, i) => {
      const slideLeft = slide.offsetLeft - track.offsetLeft
      const d = Math.abs(slideLeft - viewLeft)
      if (d < min) {
        min = d
        closest = i
      }
      const fullyVisible = slideLeft >= viewLeft - 4 && slideLeft + slide.offsetWidth <= viewRight + 4
      if (fullyVisible) tallest = Math.max(tallest, slide.offsetHeight)
    })
    if (!tallest && slides[closest]) tallest = slides[closest].offsetHeight
    setActive(closest)
    setHeight(tallest || undefined)
  }, [])

  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    measure()
    track.addEventListener('scroll', measure, { passive: true })
    const observer = new ResizeObserver(measure)
    observer.observe(track)
    Array.from(track.children).forEach((child) => observer.observe(child))
    return () => {
      track.removeEventListener('scroll', measure)
      observer.disconnect()
    }
  }, [measure])

  const goTo = (index: number) => {
    const track = trackRef.current
    const slide = track?.children[index] as HTMLElement | undefined
    if (!track || !slide) return
    track.scrollTo({ left: slide.offsetLeft - track.offsetLeft, behavior: 'smooth' })
  }

  return (
    <div className="mt-8">
      <div className="relative">
        <div
          ref={trackRef}
          role="region"
          aria-roledescription="carousel"
          aria-label="Customer reviews"
          style={{ height }}
          className="-mx-4 flex snap-x snap-mandatory scroll-px-4 items-start gap-3 overflow-x-auto overflow-y-hidden scroll-smooth px-4 transition-[height] duration-300 ease-out [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:scroll-px-0 sm:gap-4 sm:px-0"
        >
          {reviews.map((r, i) => (
            <div
              key={r.id}
              role="group"
              aria-roledescription="slide"
              aria-label={`Review ${i + 1} of ${reviews.length}`}
              className="w-[84%] shrink-0 snap-start sm:w-[calc(50%-0.5rem)] lg:w-[calc((100%-2rem)/3)]"
            >
              <ReviewCard review={r} />
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => goTo(Math.max(0, active - 1))}
          disabled={active === 0}
          aria-label="Previous review"
          className="absolute -left-4 top-1/2 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card shadow-md transition hover:bg-muted disabled:opacity-0 sm:flex"
        >
          <ChevronLeft className="size-5" />
        </button>
        <button
          type="button"
          onClick={() => goTo(Math.min(reviews.length - 1, active + 1))}
          disabled={active === reviews.length - 1}
          aria-label="Next review"
          className="absolute -right-4 top-1/2 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card shadow-md transition hover:bg-muted disabled:opacity-0 sm:flex"
        >
          <ChevronRight className="size-5" />
        </button>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-center gap-1.5" aria-label="Choose review">
        {reviews.map((r, i) => (
          <button
            key={r.id}
            type="button"
            onClick={() => goTo(i)}
            aria-label={`Go to review ${i + 1}`}
            aria-current={i === active}
            className={cn(
              'h-1.5 rounded-full transition-all',
              i === active ? 'w-5 bg-primary' : 'w-1.5 bg-primary/25 hover:bg-primary/50',
            )}
          />
        ))}
      </div>

      <div className="mt-6 flex justify-center">
        <Link
          href="/reviews"
          className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-5 py-2.5 text-sm font-semibold text-primary transition hover:bg-primary hover:text-primary-foreground"
        >
          View all reviews
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </div>
  )
}
