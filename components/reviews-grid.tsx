'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Clock, Flame, Quote, Sparkles } from 'lucide-react'
import type { Review } from '@/lib/db/schema'
import { cn } from '@/lib/utils'

type SortMode = 'popular' | 'latest'

const LONG_REVIEW_CHARS = 160

function Avatar({ name, className }: { name: string; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground ring-2 ring-background',
        className,
      )}
    >
      {name.trim().charAt(0).toUpperCase() || '?'}
    </span>
  )
}

export function ReviewCard({ review, clamp = true }: { review: Review; clamp?: boolean }) {
  const [activeImage, setActiveImage] = useState(0)
  const [expanded, setExpanded] = useState(false)
  const hasImages = review.images.length > 0
  const isLong = review.text.length > LONG_REVIEW_CHARS
  const cover = review.images[activeImage] ?? review.images[0]

  return (
    <article className="mb-5 flex break-inside-avoid flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md">
      {hasImages ? (
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={cover || '/placeholder.svg'}
            alt={`Photo from ${review.name}'s review`}
            loading="lazy"
            className="size-full object-cover"
          />
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-background/80 px-2.5 py-1 text-[11px] font-semibold text-primary backdrop-blur">
            <Sparkles className="size-3" aria-hidden="true" />
            Concert Experience
          </span>
          {review.images.length > 1 && (
            <div className="absolute inset-x-0 bottom-16 flex justify-center gap-1" aria-hidden="true">
              {review.images.map((_, i) => (
                <span
                  key={i}
                  className={cn('size-1.5 rounded-full', i === activeImage ? 'bg-white' : 'bg-white/50')}
                />
              ))}
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 flex items-center gap-2.5 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-4 pb-3 pt-10">
            <Avatar name={review.name} />
            <div className="min-w-0">
              <p className="truncate font-semibold leading-tight text-white">{review.name}</p>
              {review.event && <p className="truncate text-sm leading-tight text-white/80">{review.event}</p>}
            </div>
          </div>
        </div>
      ) : (
        <header className="flex items-center gap-2.5 px-5 pt-5">
          <Avatar name={review.name} />
          <div className="min-w-0">
            <p className="truncate font-semibold leading-tight">{review.name}</p>
            {review.event && <p className="truncate text-sm leading-tight text-muted-foreground">{review.event}</p>}
          </div>
        </header>
      )}

      {review.images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto px-4 pt-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {review.images.map((src, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActiveImage(i)}
              aria-label={`Show photo ${i + 1} of ${review.images.length}`}
              aria-pressed={i === activeImage}
              className={cn(
                'size-14 shrink-0 overflow-hidden rounded-xl border-2 transition',
                i === activeImage ? 'border-primary' : 'border-transparent opacity-80 hover:opacity-100',
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src || '/placeholder.svg'} alt="" loading="lazy" className="size-full object-cover" />
            </button>
          ))}
        </div>
      )}

      <div className="flex gap-2 px-5 pb-5 pt-4">
        <Quote className="mt-0.5 size-5 shrink-0 rotate-180 fill-primary/20 text-primary/30" aria-hidden="true" />
        <div className="min-w-0">
          <p
            className={cn(
              'text-pretty leading-relaxed text-foreground/80',
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
              className="mt-1 text-sm font-semibold text-primary underline-offset-4 hover:underline"
            >
              {expanded ? 'Show less' : 'Read more'}
            </button>
          )}
        </div>
      </div>
    </article>
  )
}

export function ReviewsGrid({ reviews, limit }: { reviews: Review[]; limit?: number }) {
  const [mode, setMode] = useState<SortMode>('latest')

  const sorted = useMemo(() => {
    if (mode === 'popular') return reviews.filter((r) => r.popular)
    return [...reviews].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [reviews, mode])

  const visible = limit ? sorted.slice(0, limit) : sorted
  const hasMore = limit !== undefined && sorted.length > limit

  return (
    <div className="mt-10">
      <div className="flex justify-center">
        <div role="tablist" aria-label="Sort reviews" className="inline-flex rounded-full bg-muted p-1">
          {(
            [
              { id: 'popular', label: 'Popular', Icon: Flame },
              { id: 'latest', label: 'Latest', Icon: Clock },
            ] as const
          ).map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={mode === id}
              onClick={() => setMode(id)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-5 py-2 text-sm font-medium transition',
                mode === id ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon className={cn('size-4', id === 'popular' && mode === id && 'text-orange-500')} aria-hidden="true" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 && (
        <p className="mt-10 text-center text-sm text-muted-foreground">No popular reviews yet.</p>
      )}

      <div className="mt-8 columns-1 gap-5 sm:columns-2 lg:columns-3">
        {visible.map((r) => (
          <ReviewCard key={r.id} review={r} clamp={limit !== undefined} />
        ))}
      </div>

      {hasMore && (
        <div className="mt-6 flex justify-center">
          <Link
            href="/reviews"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
          >
            View all {reviews.length} reviews
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      )}
    </div>
  )
}
