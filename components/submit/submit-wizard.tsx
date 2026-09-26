'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { ArrowLeft, ArrowRight, Check, Loader2, PartyPopper, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { EventWithSchedule, QrphMerchant } from '@/lib/db/schema'
import type { SubmitContent } from '@/lib/submit-content'
import { submitOrder } from '@/app/actions/orders'
import { StepTerms } from './step-terms'
import { StepTicket } from './step-ticket'
import { StepAccount } from './step-account'
import { StepPayment } from './step-payment'
import { StepReview } from './step-review'
import { computeTotal, initialFormState, STEPS, type SubmitFormState } from './types'

function isEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())
}

function formatDate(d: Date) {
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${mm}/${dd}/${d.getFullYear()}`
}

function formatTime(d: Date) {
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

export function SubmitWizard({
  event,
  content,
  merchants,
}: {
  event: EventWithSchedule
  content: SubmitContent
  merchants: QrphMerchant[]
}) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<SubmitFormState>(() => {
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

  const update = (patch: Partial<SubmitFormState>) => setForm((f) => ({ ...f, ...patch }))

  const canContinue = useMemo(() => {
    switch (step) {
      case 0:
        return event.type !== 'help_to_buy' ? form.deliveryOption !== '' : form.agreed
      case 1:
        return (
          form.selectedDates.length > 0 &&
          form.selectedDates.every((label) => (form.sections[label]?.quantity ?? 0) >= 1)
        )
      case 2:
        if (event.type !== 'help_to_buy') {
          return (
            form.holderName.trim().length > 0 &&
            isEmail(form.accountEmail) &&
            form.contactNumber.trim().length >= 7
          )
        }
        return (
          form.credentialsConfirmed &&
          isEmail(form.accountEmail) &&
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
      const res = await submitOrder({
        eventId: event.id,
        eventTitle: event.title,
        serviceType: event.type === 'help_to_buy' ? 'help_to_buy' : 'resale',
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
      })
      if (res.error) {
        toast.error(res.error)
        return
      }
      setDone(res.reference ?? null)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch {
      toast.error('Something went wrong submitting your order. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-5 py-12 text-center">
        <span className="grid size-16 place-items-center rounded-full bg-primary/10 text-primary">
          <PartyPopper className="size-8" />
        </span>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">✅ ORDER SUBMITTED SUCCESSFULLY!</h1>
          <p className="mt-2 text-sm text-muted-foreground">
          Thanks! We&apos;ve received your reservation for <span className="font-semibold">{event.title}</span>. Our
          team will review your order details and payment. All updates regarding your order will be posted directly
          on your dashboard, so please check it regularly for the latest status..
          </p>
        </div>
        <div className="w-full rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Your order reference</p>
          <p className="mt-1 text-2xl font-extrabold tracking-widest text-primary">{done}</p>
          <p className="mt-3 rounded-lg bg-primary/5 px-3 py-2 text-xs font-medium text-muted-foreground">
            Keep this reference number to track your order. You can check your order status and details anytime by
            entering it on the Track Order page.
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:flex-row">
          <Button className="flex-1" render={<Link href={`/track?ref=${done}`} />}>
            Track Your Order
          </Button>
          <Button variant="outline" className="flex-1" render={<Link href="/resale" />}>
            Browse More Events
          </Button>
        </div>
        <Button
          variant="ghost"
          className="text-muted-foreground"
          render={<Link href="/" />}
        >
          Back to Home
        </Button>
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
        <p className="text-sm font-extrabold tracking-tight">
<span className="text-foreground">Bunny</span>
              <span className="text-primary">Ticket</span>
        </p>
        <p className="text-sm font-semibold text-muted-foreground">
          {step + 1}/{STEPS.length}
        </p>
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
      <div className="mt-8 flex items-center gap-3">
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
            {submitting ? 'Submitting…' : 'Submit Order'}
          </Button>
        )}
      </div>
    </div>
  )
}
