'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { ArrowLeft, ArrowRight, Check, House, Loader2, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { EventWithSchedule, QrphMerchant } from '@/lib/db/schema'
import type { SubmitContent } from '@/lib/submit-content'
import { submitOrder, updateOrder, type EditableOrder, type SubmitOrderInput } from '@/app/actions/orders'
import { StepTerms } from './step-terms'
import { StepTicket } from './step-ticket'
import { StepAccount } from './step-account'
import { StepPayment } from './step-payment'
import { StepReview } from './step-review'
import { computeTotal, daySections, initialFormState, isNolKorea, STEPS, type SubmitFormState } from './types'

function isEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())
}

function requiresUsername(platform: string | null | undefined) {
  const normalized = platform?.trim().toLowerCase()
  return normalized === 'smtickets'
}

function hasValidAccountIdentifier(value: string, usernameField: boolean) {
  const identifier = value.trim()
  if (!identifier) return false
  return usernameField || isEmail(identifier)
}

function formatDate(d: Date) {
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${mm}/${dd}/${d.getFullYear()}`
}

function formatTime(d: Date) {
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

function formFromOrder(order: EditableOrder): SubmitFormState {
  const sections: SubmitFormState['sections'] = {}
  for (const label of order.dates) {
    const saved = order.sections[label] ?? {}
    sections[label] = {
      priority: saved.priority ?? '',
      ...(saved.backup ? { backup: saved.backup } : {}),
      quantity: saved.quantity ?? order.quantityPerDate ?? 1,
    }
  }
  return {
    ...initialFormState,
    agreed: true,
    credentialsConfirmed: true,
    serviceTier: order.serviceTier ?? '',
    // Resale delivery choice isn't stored on the order; the buyer re-confirms it on step 1.
    deliveryOption: '',
    selectedDates: order.dates,
    sections,
    accountEmail: order.accountEmail,
    confirmAccountEmail: order.accountEmail,
    password: order.accountPassword,
    confirmPassword: order.accountPassword,
    holderName: order.holderName,
    holderDob: order.holderDob,
    contactNumber: order.contactNumber,
    telegram: order.telegram,
    instagram: order.instagram,
    memberships: order.memberships.length > 0 ? order.memberships : [''],
    paymentMethod: order.paymentMethod || 'QRPH',
    paymentMerchant: order.paymentMerchant,
    paymentReference: order.paymentReference,
    datePaid: order.datePaid,
    timePaid: order.timePaid,
    amountSent: order.amountSent,
    screenshots: order.screenshots,
  }
}

export function SubmitWizard({
  event,
  content,
  merchants,
  editingOrder = null,
}: {
  event: EventWithSchedule
  content: SubmitContent
  merchants: QrphMerchant[]
  editingOrder?: EditableOrder | null
}) {
  const router = useRouter()
  const isEditing = editingOrder !== null
  const draftKey = isEditing
    ? `bunnyticket-edit-draft-${editingOrder.reference}`
    : `bunnyticket-submit-draft-${event.id}`
  const [step, setStep] = useState(0)
  const [editableUntil, setEditableUntil] = useState<string | null>(editingOrder?.editableUntil ?? null)
  const [form, setForm] = useState<SubmitFormState>(() => {
    if (editingOrder) return formFromOrder(editingOrder)
    const now = new Date()
    return {
      ...initialFormState,
      paymentMethod: 'QRPH',
      paymentMerchant: merchants[0]?.name ?? '',
      datePaid: formatDate(now),
      timePaid: formatTime(now),
    }
  })
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState<string | null>(null)
  const [draftRestored, setDraftRestored] = useState(false)

  useEffect(() => {
    const saved = window.sessionStorage.getItem(draftKey)
    if (!saved) return
    try {
      const draft = JSON.parse(saved) as { step?: number; form?: Partial<SubmitFormState> }
      if (draft.form) setForm((current) => ({ ...current, ...draft.form }))
      if (typeof draft.step === 'number') setStep(Math.min(Math.max(draft.step, 0), STEPS.length - 1))
      setDraftRestored(true)
    } catch {
      window.sessionStorage.removeItem(draftKey)
    }
  }, [draftKey])

  useEffect(() => {
    if (done) return
    window.sessionStorage.setItem(draftKey, JSON.stringify({ step, form }))
  }, [draftKey, done, form, step])

  const update = (patch: Partial<SubmitFormState>) => setForm((f) => ({ ...f, ...patch }))

  const usernameField = requiresUsername(event.platform)
  const accountIdentifierError =
    step === 2 &&
    form.accountEmail.trim().length > 0 &&
    !hasValidAccountIdentifier(form.accountEmail, usernameField)
      ? 'Enter a valid email address to continue.'
      : undefined

  const canContinue = useMemo(() => {
    switch (step) {
      case 0:
        if (isNolKorea(event)) return form.serviceTier !== '' && form.agreed
        return event.type !== 'help_to_buy' ? form.deliveryOption !== '' : form.agreed
      case 1:
        return (
          form.selectedDates.length > 0 &&
          form.selectedDates.every((label) => {
            const selection = form.sections[label]
            if (!selection || selection.quantity < 1) return false
            if (event.type !== 'help_to_buy') return true
            const day = event.schedule.find((date) => date.label === label)
            const list = daySections(event, form, day)
            if (list.length === 0) return true
            const priorityIndex = list.findIndex((section) => section.name === selection.priority)
            if (priorityIndex < 0) return false
            const isLastPriority = priorityIndex === list.length - 1
            return isLastPriority || Boolean(selection.backup)
          })
        )
      case 2:
        if (event.type !== 'help_to_buy') {
          return (
            form.holderName.trim().length > 0 &&
            hasValidAccountIdentifier(form.accountEmail, usernameField) &&
            form.contactNumber.trim().length >= 7
          )
        }
        return (
          form.credentialsConfirmed &&
          hasValidAccountIdentifier(form.accountEmail, usernameField) &&
          form.accountEmail === form.confirmAccountEmail &&
          form.password.length > 0 &&
          form.password === form.confirmPassword &&
          form.holderName.trim().length > 0 &&
          form.holderDob.length > 0 &&
          form.contactNumber.trim().length >= 7
        )
      case 3: {
        const merchantOk = merchants.length === 0 || form.paymentMerchant.trim().length > 0
        return (
          merchantOk &&
          form.paymentReference.trim().length > 0 &&
          form.screenshots.length > 0
        )
      }
      default:
        return true
    }
  }, [step, form, event, merchants])

  function next() {
    if (!canContinue) {
      toast.error('Please complete the required fields to continue.')
      return
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function back() {
    if (step === 0) {
      router.back()
      return
    }
    setStep((s) => Math.max(s - 1, 0))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleSubmit() {
    setSubmitting(true)
    try {
      const payload = {
        eventId: event.id,
        eventTitle: event.title,
        serviceType: event.type === 'help_to_buy' ? 'help_to_buy' : 'resale',
        serviceTier: isNolKorea(event) ? form.serviceTier || null : null,
        country: event.country,
        dates: form.selectedDates,
        // Per-date quantities live in `sections`; keep this column as a representative (first date)
        quantityPerDate: form.sections[form.selectedDates[0]]?.quantity ?? 1,
        sections: form.sections,
        totalAmount: computeTotal(event, form),
        accountEmail: form.accountEmail,
        accountPassword: form.password,
        holderName: form.holderName,
        holderDob: form.holderDob,
        contactNumber: form.contactNumber,
        telegram: form.telegram || null,
        instagram: form.instagram || null,
        memberships: form.memberships.filter((m) => m.trim().length > 0),
        paymentMethod: form.paymentMethod,
        paymentMerchant: form.paymentMerchant || null,
        paymentReference: form.paymentReference || null,
        datePaid: form.datePaid || null,
        timePaid: form.timePaid || null,
        amountSent: form.amountSent ? Number(form.amountSent) : null,
        screenshots: form.screenshots,
      } satisfies SubmitOrderInput
      const res = editingOrder
        ? await updateOrder(editingOrder.reference, payload)
        : await submitOrder(payload)
      if (res.error) {
        toast.error(res.error)
        return
      }
      window.sessionStorage.removeItem(draftKey)
      if (editingOrder) toast.success('Your order changes have been saved.')
      setEditableUntil(res.editableUntil ?? null)
      setDone(res.reference ?? null)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch {
      toast.error('Something went wrong submitting your order. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    const firstDate = form.selectedDates[0] ?? 'Selected date'
    const firstTier = form.sections[firstDate]?.priority ?? 'General sale'
    const serviceLabel = form.serviceTier === 'premium_bots' ? 'Premium Service' : form.serviceTier === 'manual' ? 'Manual Service' : 'Express Pass'

    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-5 text-center sm:py-8">
        <span className="grid size-14 place-items-center rounded-full bg-primary/10 text-primary">
          <Check className="size-7" strokeWidth={2.5} />
        </span>
        <div>
          <h1 className="text-lg font-extrabold tracking-tight">{isEditing ? 'Order Updated!' : 'Order Confirmed!'}</h1>
          <p className="mt-1 text-[10px] text-muted-foreground">
            {isEditing
              ? 'Your changes have been saved to your order.'
              : 'Your reservation has been received. Check your email for confirmation.'}
          </p>
        </div>

        <div className="w-full rounded-2xl border border-border bg-card p-3 text-left text-[10px] leading-[1.35]">
          <p className="font-bold text-foreground">⚠ 5-Hour Edit Window — Act Now If Needed</p>
          <p className="mt-1 text-muted-foreground">You have until <span className="font-semibold text-foreground">{editableUntil ? formatTime(new Date(editableUntil)) : '5 hours from submission'}</span> to edit your order and correct any mistakes (account email, password, ticket details, etc.). After that, your order is locked and final.</p>
          <div className="mt-2 rounded-xl border border-border px-2 py-1.5 text-muted-foreground">
            <p className="font-semibold text-foreground">⚠ As per our Terms &amp; Conditions:</p>
            <p>• Incorrect login credentials = <span className="font-semibold text-foreground">NO REFUND</span></p>
            <p>• Wrong password or social login = <span className="font-semibold text-foreground">NO REFUND</span></p>
            <p>• Orders are non-cancellable and non-refundable by the customer</p>
          </div>
          <Button variant="outline" className="mt-2 h-7 w-full text-[10px]" render={<Link href={`/submit?event=${event.id}&edit=${done}`} />}>Edit Now</Button>
        </div>

        <div className="w-full rounded-2xl border border-primary/30 bg-primary/5 p-3 text-left">
          <div className="flex items-start justify-between gap-2">
            <div><p className="text-[9px] uppercase text-primary">Your order reference</p><p className="mt-1 font-mono text-sm font-bold tracking-widest text-primary">{done}</p></div>
            <span className="rounded-full bg-primary/10 px-2 py-1 text-[9px] text-primary">Copy</span>
          </div>
          <p className="mt-2 text-[9px] text-muted-foreground">Save this — use it when contacting support.</p>
        </div>

        <div className="w-full overflow-hidden rounded-2xl border border-border bg-card text-left text-[10px]">
          <div className="flex items-center justify-between border-b border-border px-3 py-2 font-semibold text-primary"><span>🎟 ORDER SUMMARY</span><span className="rounded-full bg-muted px-2 py-1 text-[9px] text-muted-foreground">Copy summary</span></div>
          <div className="divide-y divide-border">
            <div className="flex justify-between gap-3 px-3 py-2"><span className="text-muted-foreground">Concert</span><span className="max-w-[60%] truncate text-right">{event.title}</span></div>
            <div className="flex justify-between gap-3 px-3 py-2"><span className="text-muted-foreground">Service</span><span>{serviceLabel}</span></div>
            <div className="flex justify-between gap-3 px-3 py-2"><span className="text-muted-foreground">Dates &amp; tiers</span><span className="text-right">{firstDate}<br />{firstTier}</span></div>
            <div className="flex justify-between gap-3 px-3 py-2"><span className="text-muted-foreground">Account email</span><span className="max-w-[60%] truncate">{form.accountEmail}</span></div>
            <div className="flex justify-between gap-3 px-3 py-2"><span className="text-muted-foreground">Payment</span><span>{form.paymentMethod}</span></div>
            <div className="flex justify-between gap-3 px-3 py-2"><span className="text-muted-foreground">Amount paid</span><span>{form.amountSent || 'Pending'}</span></div>
            <div className="flex justify-between px-3 py-2"><span className="text-muted-foreground">Status</span><span>Pending</span></div>
          </div>
        </div>

        <div className="w-full text-left"><p className="mb-2 text-[9px] uppercase text-muted-foreground">What happens next</p><div className="space-y-2 text-[10px]"><div className="rounded-xl border border-border px-3 py-2"><p className="font-semibold">◷ Payment review</p><p className="text-muted-foreground">Our team verifies your payment.</p></div><div className="rounded-xl border border-border px-3 py-2"><p className="font-semibold">✉ Status updates via email</p><p className="text-muted-foreground">We&apos;ll email you at every stage — keep an eye on your inbox.</p></div><div className="rounded-xl border border-border px-3 py-2"><p className="font-semibold">🎟 Ticket transfer</p><p className="text-muted-foreground">Your ticket will be transferred before the concert date.</p></div></div></div>
        <div className="w-full rounded-xl border border-primary/30 bg-primary/5 p-2 text-left text-[9px] text-muted-foreground">Have questions? Message <a className="text-primary underline-offset-2 hover:underline" href="https://wa.me/639608722635" target="_blank" rel="noreferrer">@bunnyticket,main</a> on WhatsApp — include your email address for faster support.</div>
        <Button className="h-8 w-full font-semibold" render={<Link href="/orders" />}>View My Orders →</Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <button
          type="button"
          onClick={back}
          aria-label="Go back"
          className="grid size-9 place-items-center rounded-full border border-border bg-background hover:bg-muted"
        >
          <ArrowLeft className="size-4" />
        </button>
        <Link
          href="/"
          aria-label="Go to homepage"
          className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          <House className="size-3.5" />
          <span className="hidden sm:inline">Home</span>
        </Link>
        <p className="text-sm font-extrabold tracking-tight">
<span className="text-foreground">Bunny</span>
              <span className="text-primary">Ticket</span>
        </p>
        <div className="flex items-center gap-2">
          {isEditing && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
              Editing {editingOrder.reference}
            </span>
          )}
          {draftRestored && <span className="hidden text-[11px] text-muted-foreground sm:inline">Draft restored</span>}
          <p className="text-sm font-semibold text-muted-foreground">
            {step + 1}/{STEPS.length}
          </p>
        </div>
      </div>

      {/* Stepper */}
      <ol className="mb-8 flex items-center justify-between">
        {STEPS.map((label, i) => {
          const state = i < step ? 'done' : i === step ? 'active' : 'todo'
          return (
            <li key={label} className="flex flex-1 items-center last:flex-none">
              <div className="flex flex-col items-center gap-1">
                <span
                  className={`grid size-9 place-items-center rounded-full text-sm font-bold transition ${
                    state === 'active'
                      ? 'bg-primary text-primary-foreground'
                      : state === 'done'
                        ? 'bg-primary/15 text-primary'
                        : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {state === 'done' ? <Check className="size-4" /> : i + 1}
                </span>
                <span
                  className={`text-[11px] font-medium ${
                    state === 'active' ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <span className={`mx-1 h-px flex-1 ${i < step ? 'bg-primary/40' : 'bg-border'}`} />
              )}
            </li>
          )
        })}
      </ol>

      {/* Step content */}
      {step === 0 && <StepTerms event={event} form={form} update={update} content={content} merchants={merchants} />}
      {step === 1 && <StepTicket event={event} form={form} update={update} content={content} merchants={merchants} />}
      {step === 2 && <StepAccount event={event} form={form} update={update} content={content} merchants={merchants} />}
      {step === 3 && <StepPayment event={event} form={form} update={update} content={content} merchants={merchants} />}
      {step === 4 && <StepReview event={event} form={form} update={update} content={content} merchants={merchants} />}

      {/* Nav */}
      <div className="mt-8 flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={back} className="h-14 rounded-full px-8 text-base">
            {step === 0 ? 'Cancel' : 'Back'}
          </Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={next} disabled={!canContinue} className="h-14 flex-1 gap-2 rounded-full text-base">
              Continue
              <ArrowRight className="size-5" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={submitting} className="h-14 flex-1 gap-2 rounded-full text-base">
              {submitting ? <Loader2 className="size-5 animate-spin" /> : <Send className="size-5" />}
              {submitting ? (isEditing ? 'Saving…' : 'Submitting…') : isEditing ? 'Save Changes' : 'Submit Order'}
            </Button>
          )}
        </div>
        <p className="text-center text-sm text-muted-foreground">
          Need help?{' '}
          <a
            href="https://wa.me/639608722635"
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-primary underline-offset-4 hover:underline"
          >
            Message @bunnyticket.main on WhatsApp
          </a>
        </p>
      </div>
    </div>
  )
}
