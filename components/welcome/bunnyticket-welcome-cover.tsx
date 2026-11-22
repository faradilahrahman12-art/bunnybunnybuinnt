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

        <a
          href="https://wa.me/message/5OVVBQJKCQCOC1"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-[clamp(1rem,3vh,1.75rem)] inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-[#25D366] px-5 py-2.5 text-sm font-bold text-[#0B2E1A] shadow-[0_10px_30px_-10px_rgba(37,211,102,0.8)] transition-transform hover:scale-[1.03] active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white motion-reduce:transition-none"
        >
          <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden="true">
            <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.65.07-.3-.15-1.25-.46-2.38-1.47-.88-.79-1.47-1.76-1.65-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.09 1.75-.72 2-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35M12.05 21.5h-.01a9.43 9.43 0 0 1-4.8-1.32l-.35-.2-3.57.93.95-3.48-.22-.36a9.4 9.4 0 0 1-1.45-5.02c0-5.2 4.24-9.44 9.46-9.44 2.52 0 4.9.99 6.68 2.77a9.37 9.37 0 0 1 2.76 6.68c0 5.21-4.24 9.44-9.45 9.44M20.1 3.9A11.32 11.32 0 0 0 12.05.56C5.78.56.67 5.66.67 11.94c0 2 .53 3.96 1.52 5.69L.57 23.5l6.02-1.58a11.33 11.33 0 0 0 5.45 1.39h.01c6.27 0 11.38-5.1 11.38-11.38 0-3.04-1.18-5.9-3.33-8.04" />
          </svg>
          Message us on WhatsApp
        </a>

        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
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
