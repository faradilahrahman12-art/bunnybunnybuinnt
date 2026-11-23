'use client'

import { useEffect, useRef, useState } from 'react'
import { BookOpenCheck, Check, Info, ShieldAlert, Sparkles, Star, Ticket, UserRound, UsersRound, Watch, X } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { isFlexibleDeliveryEligible, isNolKorea, type DeliveryOption, type ServiceTier, type StepProps } from './types'

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

type SingleDeliveryOption = {
  value: Exclude<DeliveryOption, ''>
  icon: string
  title: string
  description: string
}

const FLEXIBLE_METHODS = [
  {
    icon: UserRound,
    title: 'Change Account Details to Your Own Name',
    label: 'PRIORITY',
    description:
      'The Ticketmaster account details will be updated to your own name and contact information, where permitted. You may be given access to the account during the process to view your tickets and verify the updated details.',
    importantInfo: "Processing typically takes 1–7 days, subject to availability of insider.",
  },
  {
    icon: UsersRound,
    title: 'Enter Together at Venue',
    description:
      'You will enter the concert venue together with the original Ticketmaster account holder. You may be given access to the account until the event day to view your tickets in advance.',
    importantInfo: 'Meeting details and entry instructions will be provided before the event, subject to venue entry requirements.',
  },
  {
    icon: Watch,
    title: 'Wristband Transfer',
    description:
      'If the event uses physical wristbands for entry and transfers are permitted, your wristband will be arranged for handover through an agreed delivery or collection method.',
    importantInfo:
      "Wristband handover details and instructions will be provided once arrangements are confirmed, subject to the event organizer's policies.",
  },
  {
    icon: Ticket,
    title: 'E-Ticket Transfer',
    description:
      'If official e-ticket transfer is supported for your event, your ticket will be transferred electronically through the available ticketing system. You will receive instructions on how to access your ticket.',
    importantInfo:
      "E-ticket transfer availability and timing are subject to the ticketing platform and event organizer's policies.",
  },
] as const

function FlexibleDeliveryCard() {
  const [methodIndex, setMethodIndex] = useState<number | null>(null)
  const method = methodIndex === null ? null : FLEXIBLE_METHODS[methodIndex]

  return (
    <>
      <div className="relative w-full overflow-hidden rounded-2xl border-2 border-primary/60 bg-primary/10 p-3 shadow-[0_0_28px_color-mix(in_oklch,var(--primary)_18%,transparent)] sm:rounded-3xl sm:p-5">
        <div className="absolute -right-10 -top-10 size-28 rounded-full bg-primary/20 blur-2xl" aria-hidden="true" />
        <div className="relative flex flex-col gap-3 sm:gap-4">
          <div className="flex items-start gap-2.5 sm:gap-3">
            <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-lg sm:size-10 sm:rounded-2xl">
              <Sparkles className="size-4 sm:size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-bold leading-tight tracking-tight sm:text-lg">Flexible Ticket Delivery</h2>
              <p className="mt-0.5 text-pretty text-xs leading-snug text-muted-foreground sm:mt-1 sm:text-sm sm:leading-relaxed">
                We will select the most suitable and reliable ticket delivery method for your event to ensure a smooth, convenient, and hassle-free experience. Our team will arrange the best available option based on the event&apos;s ticketing system and entry requirements.
              </p>
            </div>
            <span className="grid size-5 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground sm:size-6" aria-label="Flexible delivery selected">
              <Check className="size-3 sm:size-3.5" aria-hidden="true" />
            </span>
          </div>
          <div className="grid grid-cols-1 gap-2 min-[360px]:grid-cols-2 sm:gap-2.5">
            {FLEXIBLE_METHODS.map((item, index) => {
              const Icon = item.icon
              return (
                <button
                  key={item.title}
                  type="button"
                  onClick={() => setMethodIndex(index)}
                  data-method={index}
                  aria-label={`${item.title}${'label' in item ? ' (priority)' : ''} — view details`}
                  className="flex min-h-14 min-w-0 items-start gap-2 rounded-xl border border-primary/25 bg-background/70 p-2.5 text-left transition hover:border-primary/60 hover:bg-background focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25 active:scale-[0.98] sm:min-h-20 sm:gap-3 sm:rounded-2xl sm:p-3 sm:hover:-translate-y-0.5"
                >
                  <Icon className="mt-0.5 size-3.5 shrink-0 text-primary sm:size-4" aria-hidden="true" />
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="text-pretty break-words text-xs font-semibold leading-snug text-foreground sm:text-sm">{item.title}</span>
                    {'label' in item && <span className="text-[10px] font-extrabold tracking-wide text-primary sm:text-xs">{item.label}</span>}
                  </span>
                  <Info className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {method && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-background/75 backdrop-blur-sm sm:items-center sm:p-4"
          role="presentation"
          onMouseDown={() => setMethodIndex(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="flexible-method-title"
            className="flex max-h-[85dvh] w-full flex-col rounded-t-3xl border border-b-0 border-primary/40 bg-card shadow-2xl sm:max-h-[90dvh] sm:max-w-md sm:rounded-3xl sm:border-b"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-muted-foreground/30 sm:hidden" aria-hidden="true" />
            <div className="overflow-y-auto overscroll-contain px-4 pb-3 pt-3 sm:px-6 sm:pt-6">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary sm:size-10 sm:rounded-2xl">
                    <method.icon className="size-4 sm:size-5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-primary sm:text-xs">Flexible delivery</p>
                    <h2 id="flexible-method-title" className="text-pretty text-base font-bold leading-tight sm:text-lg">{method.title}</h2>
                  </div>
                </div>
                <button type="button" onClick={() => setMethodIndex(null)} aria-label="Close delivery method information" className="-mr-1 shrink-0 rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground">
                  <X className="size-4" aria-hidden="true" />
                </button>
              </div>
              {'label' in method && (
                <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-primary/15 px-2.5 py-1 text-[10px] font-extrabold tracking-wide text-primary sm:mt-4 sm:px-3 sm:text-xs">
                  <Star className="size-3 fill-current" aria-hidden="true" />
                  PRIORITY METHOD
                </span>
              )}
              <p className="mt-3 text-pretty text-sm leading-relaxed text-muted-foreground sm:mt-4">{method.description}</p>
              <div className="mt-3 rounded-xl border border-primary/25 bg-primary/10 p-3 sm:mt-4 sm:rounded-2xl">
                <p className="text-[10px] font-bold uppercase tracking-wide text-primary sm:text-xs">Important Information</p>
                <p className="mt-1 text-pretty text-sm leading-relaxed text-foreground">{method.importantInfo}</p>
              </div>
            </div>
            <div className="shrink-0 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-1 sm:px-6 sm:pb-6 sm:pt-2">
              <button type="button" onClick={() => setMethodIndex(null)} className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90">
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function SingleDeliveryCard({
  option,
  selected,
  onSelect,
}: {
  option: SingleDeliveryOption
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`group relative flex w-full max-w-[17rem] flex-col items-start gap-2 rounded-3xl border-2 px-5 py-4 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30 active:scale-[0.98] sm:max-w-xs sm:px-6 sm:py-5 ${
        selected
          ? 'border-primary bg-primary/10 shadow-[0_0_0_4px_color-mix(in_oklch,var(--primary)_15%,transparent)]'
          : 'border-primary/30 bg-primary/5 hover:-translate-y-0.5 hover:border-primary/60 hover:bg-primary/10 hover:shadow-md'
      }`}
    >
      <span
        className={`absolute right-3.5 top-3.5 grid size-5 place-items-center rounded-full transition ${
          selected ? 'bg-primary text-primary-foreground' : 'border border-primary/30 bg-background'
        }`}
        aria-hidden="true"
      >
        {selected && <Check className="size-3" />}
      </span>
      <span className="text-2xl leading-none transition-transform duration-200 group-hover:scale-110" aria-hidden="true">
        {option.icon}
      </span>
      <span className="flex flex-col gap-0.5 pr-6">
        <span className="text-base font-semibold tracking-tight text-foreground">{option.title}</span>
        <span className="text-pretty text-sm leading-snug text-muted-foreground">{option.description}</span>
      </span>
    </button>
  )
}

export function StepTerms({ event, form, update, content }: StepProps) {
  const { steps, terms } = content
  const isResale = event.type !== 'help_to_buy'
  const isFlexible = isFlexibleDeliveryEligible(event)
  const isTicketnet = event.platform?.trim().toLowerCase().includes('ticketnet') ?? false
  const isTicketmasterSg = event.platform?.trim().toLowerCase() === 'ticketmaster sg'
  const nolKorea = isNolKorea(event)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (isFlexible && form.deliveryOption !== 'flexible') update({ deliveryOption: 'flexible' })
  }, [form.deliveryOption, isFlexible, update])
  const scrollRef = useRef<HTMLDivElement>(null)
  const unlocked = progress >= 99

  function onScroll() {
    const el = scrollRef.current
    if (!el) return
    const max = el.scrollHeight - el.clientHeight
    const pct = max <= 0 ? 100 : Math.min(100, Math.round((el.scrollTop / max) * 100))
    setProgress((p) => (pct > p ? pct : p))
  }

  if (nolKorea) {
    function selectService(value: Exclude<ServiceTier, ''>) {
      if (form.serviceTier === value) return
      // Switching services resets the read progress and agreement — each service has its own terms.
      setProgress(0)
      // Each service has its own sections, so earlier date/section picks no longer apply.
      update({ serviceTier: value, agreed: false, selectedDates: [], sections: {} })
    }

    return (
      <div className="flex flex-col gap-5">
        <div className="text-left">
          <h1 className="text-3xl font-medium tracking-tight sm:text-4xl">⚙Choose Your Service</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Pick a service option, read its terms, and agree to continue.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {content.nolServices.map((svc) => {
            const selected = form.serviceTier === svc.value
            return (
              <div
                key={svc.value}
                className={`rounded-2xl border transition ${
                  selected ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border bg-card'
                }`}
              >
                <button
                  type="button"
                  onClick={() => selectService(svc.value)}
                  aria-pressed={selected}
                  className="flex w-full items-start gap-3 p-4 text-left sm:gap-4 sm:p-5"
                >
                  <span className="flex-1">
                    <span className="block text-sm font-semibold tracking-tight text-foreground sm:text-base">
                      {svc.value === 'manual' ? '✍🏻' : '💎'}{svc.title}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted-foreground sm:text-sm">{svc.subtitle}</span>
                  </span>
                  <span
                    className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full transition sm:size-6 ${
                      selected ? 'bg-primary text-primary-foreground' : 'border border-border bg-background'
                    }`}
                  >
                    {selected && <Check className="size-3 sm:size-3.5" />}
                  </span>
                </button>

                {selected && (
                  <div className="flex flex-col gap-4 border-t border-border/70 p-5 pt-4">
                    <div className="rounded-xl border border-amber-300/60 bg-amber-50 p-3 dark:border-amber-500/30 dark:bg-amber-500/10">
                      <p className="flex items-center gap-2 text-sm font-medium text-amber-700 dark:text-amber-300">
                        <BookOpenCheck className="size-4 shrink-0" />
                        Scroll to the bottom of the {svc.title} terms to enable agreement.
                      </p>
                      <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-amber-200/70 dark:bg-amber-500/20">
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
                      className="h-56 overflow-y-auto rounded-xl border border-border bg-background p-4 text-sm leading-relaxed text-muted-foreground"
                    >
                      {svc.sections.map((s) => (
                        <div key={s.heading} className="mb-4 last:mb-0">
                          <p className="font-semibold uppercase tracking-wide text-foreground">{s.heading}</p>
                          <p className="mt-1.5 whitespace-pre-line">{s.body}</p>
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
                        <Label className="cursor-[inherit] font-semibold">{svc.agreeLabel}</Label>
                      </span>
                      {!unlocked && (
                        <span className="pl-7 text-xs text-muted-foreground">
                          Scroll to the bottom of the terms above to enable agreement.
                        </span>
                      )}
                    </label>
                  </div>
                )}
              </div>
            )
          })}
        </div>
        {isFlexible && <FlexibleDeliveryCard />}
      </div>
    )
  }

  if (isResale) {
    const singleOption: SingleDeliveryOption | null = isTicketnet
      ? {
          value: 'etix_transfer',
          icon: '🎫',
          title: 'Ticket Transfer via Etix',
          description: 'Your ticket will be transferred to your Etix account.',
        }
      : isTicketmasterSg
      ? {
          value: 'electronic_ticket',
          icon: '🎫',
          title: 'Electronic Ticket',
          description: 'Your ticket and pdf will be sent to you through email'
        }
      : null

    return (
      <div className="flex flex-col gap-5">
        <div className="text-left">
          <h1 className="text-3xl font-medium tracking-tight sm:text-4xl">📦Ticket Delivery</h1>
          <p className="mt-1 text-sm text-muted-foreground">Choose how you&apos;d like to receive your tickets</p>
        </div>

        {isFlexible ? (
          <FlexibleDeliveryCard />
        ) : singleOption ? (
          <SingleDeliveryCard
            option={singleOption}
            selected={form.deliveryOption === singleOption.value}
            onSelect={() => update({ deliveryOption: singleOption.value })}
          />
        ) : (
        <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-col sm:items-start sm:gap-4">
          {DELIVERY_OPTIONS.map((opt) => {
            const selected = form.deliveryOption === opt.value
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => update({ deliveryOption: opt.value })}
                aria-pressed={selected}
                className={`relative flex h-auto w-full min-w-0 flex-col gap-1.5 rounded-2xl border p-3 text-left transition sm:w-[199px] sm:min-h-[109.5px] sm:p-4 ${
                  selected
                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                    : 'border-border bg-card hover:border-primary/50'
                }`}
              >
                <span
                  className={`absolute right-2.5 top-2.5 grid size-5 place-items-center rounded-full transition sm:size-5 ${
                    selected ? 'bg-primary text-primary-foreground' : 'border border-border bg-background'
                  }`}
                >
                  {selected && <Check className="size-3" />}
                </span>
                <span className="text-pretty break-words pr-7 text-sm font-medium leading-snug tracking-tight text-foreground">
                  {opt.title}
                </span>
                <span className="text-pretty break-words text-xs leading-relaxed text-muted-foreground">
                  {opt.description}
                </span>
              </button>
            )
          })}
        </div>
        )}
      </div>
    )
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
