'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import { ArrowRight, ShieldCheck, Star } from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = {
  leaving: boolean
  onEnter: () => void
  onReviews: () => void
  onDti: () => void
}

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
        'fixed inset-0 z-[100] flex h-dvh w-full items-center justify-center overflow-y-auto overscroll-contain',
        'bg-[linear-gradient(160deg,#2D1748_0%,#4A2A78_55%,#6840A8_100%)]',
        'px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-[max(1.25rem,env(safe-area-inset-top))]',
        'transition-[opacity,transform] duration-[450ms] ease-out motion-reduce:transition-none',
        leaving ? 'pointer-events-none -translate-y-4 opacity-0' : 'translate-y-0 opacity-100',
      )}
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 -top-24 size-80 rounded-full bg-[#B99AF0]/25 blur-3xl" />
        <div className="absolute -bottom-32 -right-16 size-96 rounded-full bg-[#D9C6FF]/20 blur-3xl" />
      </div>

      <div
        className={cn(
          'relative my-auto flex w-[88vw] max-w-[360px] flex-col items-center rounded-[24px] bg-white px-6 pb-7 pt-8 text-center',
          'shadow-[0_30px_80px_-20px_rgba(45,23,72,0.6)]',
          'animate-in fade-in zoom-in-95 duration-500 motion-reduce:animate-none',
        )}
      >
        <div className="relative size-40 overflow-hidden rounded-[28px] shadow-[0_14px_30px_-12px_rgba(104,64,168,0.55)] sm:size-44 [@media(max-height:560px)]:size-28">
          <Image
            src="/bunny-logo.jpg"
            alt="BunnyTicket bunny mascot holding a concert ticket"
            fill
            sizes="176px"
            priority
            className="bt-float object-cover"
          />
        </div>

        <h2 id="bt-welcome-title" className="mt-6 text-3xl font-extrabold tracking-tight">
          <span className="text-[#2D1748]">Bunny</span>
          <span className="text-[#7B4FD1]">Ticket</span>
        </h2>
        <p className="mt-1.5 text-sm font-semibold text-[#6840A8]">Your Gateway to Live Events</p>
        <p id="bt-welcome-desc" className="mt-3 text-pretty text-sm leading-relaxed text-[#5B5070]">
          Resale concert tickets and Help to Buy assistance for your favorite live events across Asia.
        </p>

        <div className="mt-5 flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={onReviews}
            className="inline-flex items-center gap-1 whitespace-nowrap rounded-full border border-[#E6DBFA] px-2.5 py-1.5 text-[11px] font-semibold text-[#4A2A78] transition-colors hover:bg-[#F4EEFF] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7B4FD1]"
          >
            <Star className="size-3.5 fill-[#F5B53F] text-[#F5B53F]" aria-hidden="true" />
            Customer Reviews
          </button>
          <button
            type="button"
            onClick={onDti}
            className="inline-flex items-center gap-1 whitespace-nowrap rounded-full border border-[#E6DBFA] px-2.5 py-1.5 text-[11px] font-semibold text-[#4A2A78] transition-colors hover:bg-[#F4EEFF] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7B4FD1]"
          >
            <ShieldCheck className="size-3.5 text-[#7B4FD1]" aria-hidden="true" />
            DTI Registration
          </button>
        </div>

        <button
          ref={enterRef}
          type="button"
          onClick={onEnter}
          className="group mt-7 flex flex-col items-center gap-2 rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#7B4FD1]"
        >
          <span className="grid size-14 place-items-center rounded-full bg-[#6840A8] text-white shadow-[0_10px_28px_-6px_rgba(123,79,209,0.75)] transition-transform duration-200 group-hover:scale-105 group-active:scale-95 motion-reduce:transition-none">
            <ArrowRight className="size-6 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
          </span>
          <span className="text-sm font-semibold text-[#2D1748]">Enter Website</span>
        </button>
      </div>
    </div>
  )
}
