'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, ChevronLeft, ChevronRight, Star } from 'lucide-react'
import type { Review } from '@/lib/db/schema'
import { cn } from '@/lib/utils'

const LONG_REVIEW_CHARS = 140
const MIN_CARDS_PER_SET = 6
const AUTO_SPEED_PX_PER_MS = 0.025
const RESUME_DELAY_MS = 3000
const INITIAL_DELAY_MS = 1500

function VerifiedBadge({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      role="img"
      aria-label="Verified"
      fill="none"
    >
      <path
        d="M12 1.75l2.02 1.1 2.3-.18 1.28 1.92 2.1.97-.18 2.3 1.1 2.02-1.1 2.02.18 2.3-2.1.97-1.28 1.92-2.3-.18-2.02 1.1-2.02-1.1-2.3.18-1.28-1.92-2.1-.97.18-2.3-1.1-2.02 1.1-2.02-.18-2.3 2.1-.97 1.28-1.92 2.3.18L12 1.75Z"
        fill="#2490ff"
      />
      <path d="m7.8 12.15 2.65 2.65 5.8-5.8" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

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
        draggable={false}
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
            draggable={false}
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
          draggable={false}
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
    <article className="flex h-fit flex-col rounded-2xl border border-primary/30 bg-card px-4 pb-5 pt-4 shadow-[0_0_28px_-12px_var(--primary)] sm:px-5 sm:pb-6 sm:pt-5">
      <header className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1 truncate font-semibold">
            <span className="truncate">{review.name}</span>
            <VerifiedBadge className="size-4 shrink-0" />
          </p>
          <span className="mt-1 flex items-center gap-0.5" aria-label="Rated 5 out of 5 stars">
            {Array.from({ length: 5 }, (_, i) => (
              <Star key={i} className="size-3 fill-primary text-primary" aria-hidden="true" />
            ))}
          </span>
        </div>
      </header>

      {review.event && <p className="mt-2 text-sm text-muted-foreground">{review.event}</p>}

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

      <p className="mt-4 flex items-center gap-1 text-xs font-medium text-muted-foreground">
        <VerifiedBadge className="size-3.5" />
        Verified Customer
      </p>
    </article>
  )
}

export function ReviewsCarousel({ reviews }: { reviews: Review[] }) {
  const count = reviews.length
  const repeat = Math.max(1, Math.ceil(MIN_CARDS_PER_SET / count))
  const setLength = count * repeat
  const slides = Array.from({ length: setLength * 3 }, (_, i) => reviews[i % count])

  const trackRef = useRef<HTMLDivElement>(null)
  const autoRef = useRef(false)
  const positionRef = useRef(0)
  const hoveringRef = useRef(false)
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [autoPlaying, setAutoPlaying] = useState(false)
  const [active, setActive] = useState(0)

  const metrics = useCallback(() => {
    const track = trackRef.current
    if (!track || track.children.length < setLength + 1) return null
    const first = track.children[0] as HTMLElement
    const second = track.children[1] as HTMLElement
    const middle = track.children[setLength] as HTMLElement
    return {
      track,
      step: second.offsetLeft - first.offsetLeft,
      setWidth: middle.offsetLeft - first.offsetLeft,
    }
  }, [setLength])

  const normalize = useCallback(() => {
    const m = metrics()
    if (!m || !m.setWidth) return
    const { track, setWidth } = m
    let delta = 0
    if (track.scrollLeft < setWidth) delta = setWidth
    else if (track.scrollLeft >= setWidth * 2) delta = -setWidth
    if (delta) {
      track.scrollLeft += delta
      positionRef.current += delta
    }
  }, [metrics])

  const updateActive = useCallback(() => {
    const m = metrics()
    if (!m || !m.step) return
    const raw = Math.round(m.track.scrollLeft / m.step)
    setActive(((raw % count) + count) % count)
  }, [metrics, count])

  useLayoutEffect(() => {
    const m = metrics()
    if (!m) return
    m.track.scrollLeft = m.setWidth
    positionRef.current = m.setWidth
  }, [metrics])

  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    const onScroll = () => {
      updateActive()
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
      idleTimerRef.current = setTimeout(() => {
        if (!autoRef.current) normalize()
      }, 150)
    }
    const onResize = () => normalize()
    track.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize)
    return () => {
      track.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
    }
  }, [normalize, updateActive])

  const pause = useCallback(() => {
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current)
    autoRef.current = false
    setAutoPlaying(false)
  }, [])

  const scheduleResume = useCallback(
    (delay = RESUME_DELAY_MS) => {
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current)
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
      resumeTimerRef.current = setTimeout(() => {
        const track = trackRef.current
        if (!track || hoveringRef.current) return
        positionRef.current = track.scrollLeft
        autoRef.current = true
        setAutoPlaying(true)
      }, delay)
    },
    [],
  )

  useEffect(() => {
    scheduleResume(INITIAL_DELAY_MS)
    let frame = 0
    let last: number | null = null
    const tick = (time: number) => {
      const track = trackRef.current
      if (track && autoRef.current && last !== null) {
        positionRef.current += AUTO_SPEED_PX_PER_MS * Math.min(64, time - last)
        track.scrollLeft = positionRef.current
        normalize()
      }
      last = time
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(frame)
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current)
    }
  }, [normalize, scheduleResume])

  const interact = () => {
    pause()
    scheduleResume()
  }

  const scrollByCards = (direction: 1 | -1) => {
    interact()
    normalize()
    const m = metrics()
    if (!m) return
    m.track.scrollBy({ left: direction * m.step, behavior: 'smooth' })
  }

  const goTo = (index: number) => {
    interact()
    normalize()
    const m = metrics()
    if (!m || !m.step) return
    const current = Math.round(m.track.scrollLeft / m.step)
    const base = current - (((current % count) + count) % count)
    const target = [base + index - count, base + index, base + index + count].reduce((best, c) =>
      Math.abs(c - current) < Math.abs(best - current) ? c : best,
    )
    m.track.scrollTo({ left: target * m.step, behavior: 'smooth' })
  }

  return (
    <div className="mt-8">
      <div
        className="relative"
        onPointerEnter={(e) => {
          if (e.pointerType !== 'mouse') return
          hoveringRef.current = true
          pause()
        }}
        onPointerLeave={(e) => {
          if (e.pointerType !== 'mouse') return
          hoveringRef.current = false
          scheduleResume()
        }}
        onPointerDown={pause}
        onPointerUp={() => scheduleResume()}
        onTouchStart={pause}
        onTouchEnd={() => scheduleResume()}
        onWheel={interact}
        onFocus={pause}
        onBlur={() => scheduleResume()}
      >
        <div
          ref={trackRef}
          role="region"
          aria-roledescription="carousel"
          aria-label="Customer reviews"
          className={cn(
            '-mx-4 flex items-start gap-3 overflow-x-auto overflow-y-hidden overscroll-x-contain scroll-px-4 px-4 py-2 [scrollbar-width:none] [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:scroll-px-0 sm:gap-4 sm:px-0',
            autoPlaying ? 'snap-none' : 'snap-x snap-mandatory',
          )}
        >
          {slides.map((r, i) => (
            <div
              key={`${r.id}-${i}`}
              role="group"
              aria-roledescription="slide"
              aria-label={`Review ${(i % count) + 1} of ${count}`}
              className="w-[84%] shrink-0 snap-start sm:w-[calc(50%-0.5rem)] lg:w-[calc((100%-2rem)/3)]"
            >
              <ReviewCard review={r} />
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => scrollByCards(-1)}
          aria-label="Previous review"
          className="absolute -left-4 top-1/2 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card shadow-md transition hover:bg-muted sm:flex"
        >
          <ChevronLeft className="size-5" />
        </button>
        <button
          type="button"
          onClick={() => scrollByCards(1)}
          aria-label="Next review"
          className="absolute -right-4 top-1/2 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card shadow-md transition hover:bg-muted sm:flex"
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
