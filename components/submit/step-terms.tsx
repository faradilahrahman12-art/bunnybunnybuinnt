'use client'

import { useRef, useState } from 'react'
import { BookOpenCheck, Check, ShieldAlert } from 'lucide-react'
import { Label } from '@/components/ui/label'
import type { DeliveryOption, StepProps } from './types'

const DELIVERY_OPTIONS: {
  value: Exclude<DeliveryOption, ''>
  title: string
  description: string
}[] = [
  {
    value: 'enter_together',
    title: '📍ENTER THE VENUE TOGTHER WITH ACCOUNT HOLDER',
    description:
      'You will enter the venue together with the original Ticketmaster account holder. You will have access to the Ticketmaster account until the event day so you can view your tickets in advance.',
  },
  {
    value: 'change_details',
    title: '📝CHANGE ACCOUNT DETAILS TO YOUR OWN NAME',
    description:
      'The Ticketmaster account details will be changed to your name and contact information. You will have access to the account during the process so you can view your tickets and check the updated details. This process typically takes 1–7 days.',
  },
]

export function StepTerms({ event, form, update, content }: StepProps) {
  const { steps, terms } = content
  const isResale = event.type !== 'help_to_buy'
  const isTicketmasterSg = event.platform?.trim().toLowerCase() === 'ticketmaster sg'
  const [progress, setProgress] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)
  const unlocked = progress >= 99

  if (isResale) {
    return (
      <div className="flex flex-col gap-5">
        <div className="text-left">
          <h1 className="text-3xl font-medium tracking-tight sm:text-4xl">📦Ticket Delivery</h1>
          <p className="mt-1 text-sm text-muted-foreground">Choose how you&apos;d like to receive your tickets</p>
        </div>

        <div className="flex flex-col gap-4">
          {(isTicketmasterSg
            ? [
                {
                  value: 'electronic_ticket' as const,
                  title: '🎫Electronic Ticket',
                  description: 'Your ticket will be sent to you through email.',
                },
              ]
            : DELIVERY_OPTIONS
          ).map((opt) => {
            const selected = form.deliveryOption === opt.value
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => update({ deliveryOption: opt.value })}
                aria-pressed={selected}
                className={`relative flex flex-col gap-3 rounded-2xl border p-5 text-left transition ${
                  selected
                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                    : 'border-border bg-card hover:border-primary/50'
                }`}
              >
                <span
                  className={`absolute right-4 top-4 grid size-6 place-items-center rounded-full transition ${
                    selected ? 'bg-primary text-primary-foreground' : 'border border-border bg-background'
                  }`}
                >
                  {selected && <Check className="size-3.5" />}
                </span>
                <span className="pr-8 text-base font-medium tracking-tight text-foreground">{opt.title}</span>
                <span className="text-sm leading-relaxed text-muted-foreground">{opt.description}</span>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  function onScroll() {
    const el = scrollRef.current
    if (!el) return
    const max = el.scrollHeight - el.clientHeight
    const pct = max <= 0 ? 100 : Math.min(100, Math.round((el.scrollTop / max) * 100))
    setProgress((p) => (pct > p ? pct : p))
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="text-center">
        <h1 className="text-3xl font-medium tracking-tight sm:text-4xl">{steps.terms.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{steps.terms.subtitle}</p>
      </div>

      <div className="rounded-xl border border-amber-300/60 bg-amber-50 p-4 dark:border-amber-500/30 dark:bg-amber-500/10">
        <p className="flex items-center gap-2 text-sm font-medium text-amber-700 dark:text-amber-300">
          <BookOpenCheck className="size-4 shrink-0" />
          {terms.scrollHint}
        </p>
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-amber-200/70 dark:bg-amber-500/20">
          <div
            className="h-full rounded-full bg-amber-500 transition-[width] duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-1.5 text-xs font-semibold text-amber-700 dark:text-amber-300">{progress}% read</p>
      </div>

      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="h-72 overflow-y-auto rounded-xl border border-border bg-card p-5 text-sm leading-relaxed text-muted-foreground"
      >
        {terms.sections.map((t) => (
          <div key={t.heading} className="mb-5 last:mb-0">
            <p className="font-semibold uppercase tracking-wide text-foreground">{t.heading}</p>
            {t.body.map((line, i) => (
              <p key={i} className="mt-2 whitespace-pre-line">
                {line}
              </p>
            ))}
          </div>
        ))}
      </div>

      <label
        className={`flex flex-col gap-1 rounded-xl border p-4 transition ${
          unlocked ? 'cursor-pointer border-border bg-card' : 'cursor-not-allowed border-border/60 bg-muted/40'
        }`}
      >
        <span className="flex items-center gap-3">
          <input
            type="checkbox"
            className="size-4 accent-primary"
            disabled={!unlocked}
            checked={form.agreed}
            onChange={(e) => update({ agreed: e.target.checked })}
          />
          <Label className="cursor-[inherit] font-semibold">{terms.agreeLabel}</Label>
        </span>
        {!unlocked && (
          <span className="pl-7 text-xs text-muted-foreground">
            Scroll to the bottom of the terms above to enable agreement.
          </span>
        )}
      </label>

      <div className="flex items-start gap-3 rounded-xl border border-red-300/70 bg-red-50 p-4 dark:border-red-500/30 dark:bg-red-500/10">
        <ShieldAlert className="mt-0.5 size-5 shrink-0 text-red-600 dark:text-red-400" />
        <div className="text-sm leading-relaxed text-red-700 dark:text-red-300">
          <p className="font-bold">{terms.finalWarningTitle}</p>
          <p className="mt-1 whitespace-pre-line">{terms.finalWarningBody}</p>
        </div>
      </div>
    </div>
  )
}
