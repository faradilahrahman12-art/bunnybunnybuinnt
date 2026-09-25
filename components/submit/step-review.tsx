'use client'

import { CalendarDays, CreditCard, Lock, ShieldCheck, User } from 'lucide-react'
import { computeTotal, pesos, type StepProps } from './types'

export function StepReview({ event, form, content }: StepProps) {
  const { steps, review } = content
  const isResale = event.type !== 'help_to_buy'
  const total = computeTotal(event, form)
  const maskedPassword = form.password ? '•'.repeat(Math.min(form.password.length, 10)) : '—'
  const memberships = form.memberships.filter((m) => m.trim().length > 0)

  return (
    <div className="flex flex-col gap-5">
      <div className="text-left">
        <h1 className="text-3xl font-medium tracking-tight sm:text-4xl">📝{steps.review.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{steps.review.subtitle}</p>
      </div>

      <Section icon={<CalendarDays className="size-4 text-primary" />} title="Event & Tickets">
        <Row label="Event" value={event.title} />
        <Row label="Service" value={event.type === 'resale' ? 'Resale' : 'Help to Buy'} />
        <Row label="Country" value={event.country} />
        <Row label="Date(s)" value={form.selectedDates.length ? form.selectedDates.join(', ') : '—'} />
        {form.selectedDates.map((label) => {
          const sel = form.sections[label]
          if (!sel) return null
          const tier = sel.priority
            ? sel.backup
              ? `${sel.priority}  ·  backup: ${sel.backup}`
              : sel.priority
            : 'No sections'
          return (
            <Row key={label} label={`${label}  ·  ${sel.quantity} qty`} value={tier} />
          )
        })}
        <Row label="Total" value={total !== null ? pesos(total) : 'To be quoted'} highlight />
      </Section>

      {isResale ? (
        <Section icon={<User className="size-4 text-primary" />} title="Contact Information">
          <Row label="Full name" value={form.holderName || '—'} />
          <Row label="Email address" value={form.accountEmail || '—'} />
          <Row label="Contact number" value={form.contactNumber || '—'} />
          {form.telegram.trim() && <Row label="Telegram" value={form.telegram} />}
          {form.instagram.trim() && <Row label="Instagram" value={form.instagram} />}
        </Section>
      ) : (
        <>
          <Section icon={<Lock className="size-4 text-primary" />} title="Account Credentials">
            <Row label="Email" value={form.accountEmail || '—'} />
            <Row label="Password" value={maskedPassword} />
            {memberships.length > 0 && <Row label="Membership(s)" value={memberships.join(', ')} />}
          </Section>

          <Section icon={<User className="size-4 text-primary" />} title="Account Holder">
            <Row label="Full Name" value={form.holderName || '—'} />
            <Row label="Date of Birth" value={form.holderDob || '—'} />
            <Row label="Contact" value={form.contactNumber || '—'} />
          </Section>
        </>
      )}

      <Section icon={<CreditCard className="size-4 text-primary" />} title="Payment">
        <Row label="Method" value={form.paymentMethod || 'QRPH'} />
        {form.paymentMerchant && <Row label="Merchant" value={form.paymentMerchant} />}
        <Row label="Reference" value={form.paymentReference || 'To follow'} />
        {form.datePaid && <Row label="Date paid" value={form.datePaid} />}
        {form.timePaid && <Row label="Time paid" value={form.timePaid} />}
        <Row
          label="Proof of payment"
          value={
            form.screenshots.length
              ? `${form.screenshots.length} screenshot${form.screenshots.length === 1 ? '' : 's'}`
              : '—'
          }
        />
      </Section>

      <p className="flex items-start gap-2 rounded-xl bg-primary/5 p-3 text-sm text-muted-foreground">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
        {review.footer}
      </p>
    </div>
  )
}

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="flex items-center gap-2 text-sm font-bold">
        {icon}
        {title}
      </p>
      <dl className="mt-3 flex flex-col gap-1.5">{children}</dl>
    </div>
  )
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={`text-right font-medium ${highlight ? 'text-base font-bold text-primary' : ''}`}>{value}</dd>
    </div>
  )
}
