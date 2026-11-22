'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import { ArrowRight, ShieldCheck, Sparkles, Star } from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = {
  leaving: boolean
  onEnter: () => void
  onReviews: () => void
  onDti: () => void
}

const SPARKLES = [
  { top: '8%', left: '12%', size: 10, delay: '0s' },
  { top: '16%', left: '82%', size: 14, delay: '1.2s' },
  { top: '30%', left: '6%', size: 8, delay: '2.1s' },
  { top: '44%', left: '90%', size: 10, delay: '0.6s' },
  { top: '70%', left: '10%', size: 12, delay: '1.8s' },
  { top: '82%', left: '78%', size: 9, delay: '2.6s' },
  { top: '90%', left: '30%', size: 7, delay: '0.9s' },
  { top: '24%', left: '60%', size: 6, delay: '3s' },
]

export function BunnyTicketWelcomeCover({ leaving, onEnter, onReviews, onDti }: Props) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const enterRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    enterRef.current?.focus({ preventScroll: true })
  }, [])

  function trapFocus(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key !== 'Tab' || !dialogRef.current) return
    const focusable = dialogRef.current.querySelectorAll<HTMLElement>('button, a[href]')
    if (!focusable.length) return
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  return (
    <div
      id="bt-welcome-cover"
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="bt-welcome-title"
      aria-describedby="bt-welcome-desc"
      onKeyDown={trapFocus}
      className={cn(
        'fixed inset-0 z-[100] flex h-dvh w-full flex-col items-center justify-center overflow-hidden',
        'bg-[radial-gradient(120%_80%_at_50%_0%,#5B3A94_0%,#2A1545_55%,#160A28_100%)]',
        'px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1.5rem,env(safe-area-inset-top))]',
        'transition-[opacity,transform,filter] duration-[550ms] ease-out motion-reduce:transition-none',
        leaving ? 'pointer-events-none scale-[1.04] opacity-0 blur-sm' : 'scale-100 opacity-100',
      )}
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="bt-aurora absolute -left-[20%] -top-[15%] size-[70vmax] rounded-full bg-[#C9A7FF]/30 blur-[90px]" />
        <div className="bt-aurora bt-aurora-delay absolute -bottom-[25%] -right-[20%] size-[65vmax] rounded-full bg-[#FF9FD4]/25 blur-[100px]" />
        <div className="bt-aurora bt-aurora-slow absolute left-1/2 top-1/2 size-[45vmax] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#8B6CFF]/20 blur-[80px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_40%,rgba(10,4,20,0.55)_100%)]" />
        <div className="absolute inset-0 opacity-[0.35] [background-image:radial-gradient(rgba(255,255,255,0.18)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_75%)]" />
        {SPARKLES.map((s, i) => (
          <Sparkles
            key={i}
            className="bt-twinkle absolute text-white/80"
            style={{ top: s.top, left: s.left, width: s.size, height: s.size, animationDelay: s.delay }}
          />
        ))}
      </div>

      <div className="relative flex w-full max-w-md flex-col items-center text-center animate-in fade-in slide-in-from-bottom-4 duration-700 motion-reduce:animate-none">
        <div className="relative">
          <div aria-hidden="true" className="bt-glow absolute -inset-6 rounded-[44px] bg-[conic-gradient(from_0deg,#FF9FD4,#C9A7FF,#8B6CFF,#FF9FD4)] opacity-60 blur-2xl" />
          <div className="relative size-[clamp(7rem,30vmin,11.5rem)] overflow-hidden rounded-[32px] ring-1 ring-white/40 shadow-[0_24px_60px_-18px_rgba(255,159,212,0.6)]">
            <Image
              src="/bunny-logo.jpg"
              alt="BunnyTicket bunny mascot holding a concert ticket"
              fill
              sizes="184px"
              priority
              className="bt-float object-cover"
            />
          </div>
        </div>

        <h2
          id="bt-welcome-title"
          className="mt-[clamp(1.25rem,4vh,2.25rem)] text-[clamp(2.25rem,9vw,3.75rem)] font-extrabold leading-none tracking-tight"
        >
          <span className="text-white">Bunny</span>
          <span className="bg-gradient-to-r from-[#FFB3DE] via-[#E3C8FF] to-[#B99AF0] bg-clip-text text-transparent">Ticket</span>
        </h2>
        <p className="mt-3 text-xs font-semibold uppercase tracking-[0.28em] text-[#E3C8FF]">
          Your Gateway to Live Events
        </p>
        <p
          id="bt-welcome-desc"
          className="mt-4 max-w-sm text-pretty text-[clamp(0.875rem,2.2vw,1rem)] leading-relaxed text-white/75"
        >
          Resale concert tickets and Help to Buy assistance for your favorite live events across Asia.
        </p>

        <div className="mt-[clamp(1rem,3vh,1.75rem)] flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={onReviews}
            className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-white/20 bg-white/10 px-3.5 py-2 text-xs font-semibold text-white backdrop-blur-md transition-colors hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <Star className="size-3.5 fill-[#FFD36E] text-[#FFD36E]" aria-hidden="true" />
            Customer Reviews
          </button>
          <button
            type="button"
            onClick={onDti}
            className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-white/20 bg-white/10 px-3.5 py-2 text-xs font-semibold text-white backdrop-blur-md transition-colors hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <ShieldCheck className="size-3.5 text-[#C9A7FF]" aria-hidden="true" />
            DTI Registration
          </button>
        </div>

        <button
          ref={enterRef}
          type="button"
          onClick={onEnter}
          className={cn(
            'group relative mt-[clamp(1.5rem,5vh,2.75rem)] inline-flex items-center gap-3 overflow-hidden rounded-full p-[2px]',
            'bg-[linear-gradient(120deg,#FFB3DE,#C9A7FF,#8B6CFF,#FFB3DE)] bg-[length:200%_100%] bt-border-flow',
            'shadow-[0_18px_45px_-12px_rgba(255,159,212,0.7)] transition-transform duration-300 hover:scale-[1.04] active:scale-[0.97] motion-reduce:transition-none',
            'focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white',
          )}
        >
          <span className="relative inline-flex items-center gap-3 rounded-full bg-[linear-gradient(135deg,#F472B6_0%,#A855F7_55%,#7C3AED_100%)] py-2 pl-7 pr-2 text-base font-bold tracking-wide text-white">
            <span aria-hidden="true" className="bt-shimmer pointer-events-none absolute inset-0 rounded-full" />
            <span className="relative">Enter Website</span>
            <span className="relative grid size-10 place-items-center rounded-full bg-white text-[#7C3AED] shadow-md transition-transform duration-300 group-hover:translate-x-1">
              <ArrowRight className="size-5" aria-hidden="true" />
            </span>
          </span>
        </button>
      </div>
    </div>
  )
}
