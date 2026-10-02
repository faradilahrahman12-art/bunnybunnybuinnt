'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, BadgeCheck, ChevronLeft, ChevronRight } from 'lucide-react'
import type { Review } from '@/lib/db/schema'
import { cn } from '@/lib/utils'

const LONG_REVIEW_CHARS = 140

export function ReviewCard({ review, clamp = true }: { review: Review; clamp?: boolean }) {
  const [expanded, setExpanded] = useState(false)
  const isLong = review.text.length > LONG_REVIEW_CHARS

  return (
    <article className="flex h-full flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
      <header className="flex flex-col gap-0.5">
        <p className="flex items-center gap-1 font-semibold">
          {review.name}
          <BadgeCheck className="size-4 text-primary" aria-label="Verified customer" />
        </p>
        {review.event && <p className="text-sm text-muted-foreground">{review.event}</p>}
      </header>

      {review.images.length > 0 && (
        <div className="flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {review.images.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={src || '/placeholder.svg'}
              alt={`Photo from ${review.name}'s review`}
              loading="lazy"
              className="size-20 shrink-0 rounded-lg border border-border object-cover sm:size-24"
            />
          ))}
        </div>
      )}

      <div className="mt-auto flex flex-col items-start gap-1">
        <p
          className={cn(
            'text-pretty text-sm leading-relaxed text-primary',
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
            className="text-xs font-semibold text-foreground underline-offset-4 hover:underline"
          >
            {expanded ? 'Show less' : 'Read more'}
          </button>
        )}
      </div>
    </article>
  )
}

export function ReviewsCarousel({ reviews }: { reviews: Review[] }) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)

  const handleScroll = useCallback(() => {
    const track = trackRef.current
    if (!track) return
    const slides = Array.from(track.children) as HTMLElement[]
    const left = track.scrollLeft + track.offsetLeft
    let closest = 0
    let min = Infinity
    slides.forEach((slide, i) => {
      const d = Math.abs(slide.offsetLeft - left)
      if (d < min) {
        min = d
        closest = i
      }
    })
    setActive(closest)
  }, [])

  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    track.addEventListener('scroll', handleScroll, { passive: true })
    return () => track.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

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
          className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto scroll-smooth px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:scroll-px-0 sm:gap-4 sm:px-0"
        >
          {reviews.map((r, i) => (
            <div
              key={r.id}
              role="group"
              aria-roledescription="slide"
              aria-label={`Review ${i + 1} of ${reviews.length}`}
              className="w-[86%] shrink-0 snap-start sm:w-[calc(50%-0.5rem)] lg:w-[calc((100%-2rem)/3)]"
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
