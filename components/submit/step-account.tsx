'use client'

import { AlertTriangle, Info, Lock, Plus, User, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { StepProps } from './types'

export function StepAccount({ event, form, update, content }: StepProps) {
  const { steps, account } = content
  const isResale = event.type !== 'help_to_buy'

  if (isResale) {
    const showChangeNotice = form.deliveryOption === 'change_details'
    return (
      <div className="flex flex-col gap-5">
        <div className="text-left">
          <h1 className="text-3xl font-medium tracking-tight sm:text-4xl">📱Contact Information</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Please provide your details so we can contact you about your order:
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex flex-col gap-4">
            <Field label="ℹ️Full name" required>
              <Input
                placeholder="Your full name"
                value={form.holderName}
                onChange={(e) => update({ holderName: e.target.value })}
              />
            </Field>
            <Field label="📧Email address" required>
              <Input
                type="email"
                placeholder="your@email.com"
                value={form.accountEmail}
                onChange={(e) => update({ accountEmail: e.target.value })}
              />
            </Field>
            <Field label="📞Contact number" required>
              <Input
                type="tel"
                inputMode="tel"
                placeholder="e.g. 0917 123 4567"
                value={form.contactNumber}
                onChange={(e) => update({ contactNumber: e.target.value })}
              />
            </Field>
            <Field label="🔵Telegram username ">
              <Input
                placeholder="@username"
                value={form.telegram}
                onChange={(e) => update({ telegram: e.target.value })}
              />
            </Field>
            <Field label="📸Instagram username ">
              <Input
                placeholder="@username"
                value={form.instagram}
                onChange={(e) => update({ instagram: e.target.value })}
              />
            </Field>
          </div>
        </div>

        {showChangeNotice && (
          <div className="flex items-start gap-3 rounded-xl border border-destructive/40 bg-destructive/5 p-4">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
            <div className="text-sm leading-relaxed text-destructive">
              <p className="font-bold">Notice for &ldquo;Change Account Details to Your Name&rdquo;</p>
              <p className="mt-1">
                The name, email address, and contact number you provide above will be used for the requested Ticketmaster
                account detail change. Please check that these details are accurate before submitting your form.
              </p>
            </div>
          </div>
        )}
      </div>
    )
  }

  const platformBanner = account.platformBanner.replace(
    '{platform}',
    event.platform?.trim() || 'Ticketing platform',
  )
  const emailMismatch =
    form.confirmAccountEmail.length > 0 && form.accountEmail !== form.confirmAccountEmail
  const passwordMismatch = form.confirmPassword.length > 0 && form.password !== form.confirmPassword

  function setMembership(i: number, value: string) {
    const next = [...form.memberships]
    next[i] = value
    update({ memberships: next })
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="text-center">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{steps.account.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{steps.account.subtitle}</p>
      </div>

      <div className="rounded-xl bg-primary/10 px-4 py-3 text-center text-sm font-semibold text-primary">
        {platformBanner}
      </div>

      {/* Confirm correctness */}
      <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4">
        <p className="text-sm font-bold text-destructive">
          <AlertTriangle className="mr-1.5 inline size-4" />
          Before continuing, confirm:
        </p>
        <label className="mt-3 flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-background p-3">
          <input
            type="checkbox"
            className="size-4 accent-primary"
            checked={form.credentialsConfirmed}
            onChange={(e) => update({ credentialsConfirmed: e.target.checked })}
          />
          <span className="text-sm font-semibold text-destructive">{account.confirmLabel}</span>
        </label>
      </div>

      <p className="flex items-start gap-2 rounded-xl bg-sky-50 p-3 text-sm text-sky-700 dark:bg-sky-500/10 dark:text-sky-300">
        <Info className="mt-0.5 size-4 shrink-0" />
        {account.backupInfo}
      </p>

      {/* Credentials */}
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="flex items-center gap-2 text-sm font-bold">
          <Lock className="size-4 text-primary" />
          Account Credentials
        </p>
        <p className="text-xs text-muted-foreground">Login details for queuing</p>
        <div className="mt-4 flex flex-col gap-4">
          <Field label="Account Email" required>
            <Input
              type="email"
              placeholder="your@email.com"
              value={form.accountEmail}
              onChange={(e) => update({ accountEmail: e.target.value })}
            />
          </Field>
          <Field label="Confirm Account Email" required error={emailMismatch ? 'Emails do not match' : undefined}>
            <Input
              type="email"
              placeholder="Re-enter your account email"
              value={form.confirmAccountEmail}
              onChange={(e) => update({ confirmAccountEmail: e.target.value })}
            />
          </Field>
          <Field label="Password" required hint="Shown in plain text for accuracy.">
            <Input
              type="text"
              placeholder="Enter password"
              value={form.password}
              onChange={(e) => update({ password: e.target.value })}
            />
          </Field>
          <Field
            label="Confirm Password"
            required
            hint="Re-enter your password exactly to confirm"
            error={passwordMismatch ? 'Passwords do not match' : undefined}
          >
            <Input
              type="text"
              placeholder="Re-enter password"
              value={form.confirmPassword}
              onChange={(e) => update({ confirmPassword: e.target.value })}
            />
          </Field>
        </div>
      </div>

      {/* Holder */}
      <div className="rounded-xl border border-amber-300/60 bg-amber-50/60 p-4 dark:border-amber-500/30 dark:bg-amber-500/5">
        <p className="flex items-center gap-2 text-sm font-bold text-amber-700 dark:text-amber-300">
          <User className="size-4" />
          Account Holder Details
        </p>
        <p className="text-xs text-muted-foreground">Details of the person who owns this ticketing account</p>
        <div className="mt-4 flex flex-col gap-4">
          <Field label="Full Name" required>
            <Input
              placeholder="Name as registered on the platform"
              value={form.holderName}
              onChange={(e) => update({ holderName: e.target.value })}
            />
          </Field>
          <Field label="Date of Birth" required>
            <Input
              type="date"
              value={form.holderDob}
              onChange={(e) => update({ holderDob: e.target.value })}
            />
          </Field>
          <Field label="Contact Number" required>
            <Input
              type="tel"
              inputMode="tel"
              placeholder="e.g. 0917 123 4567"
              value={form.contactNumber}
              onChange={(e) => update({ contactNumber: e.target.value })}
            />
          </Field>
        </div>
      </div>

      {/* Memberships */}
      <div className="rounded-xl border border-border bg-card p-4">
        <Label className="text-sm font-bold">{account.membershipTitle}</Label>
        <p className="mt-1 text-xs text-muted-foreground">{account.membershipHint}</p>
        <div className="mt-3 flex flex-col gap-2">
          {form.memberships.map((m, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="w-5 text-xs font-semibold text-muted-foreground">{i + 1}</span>
              <Input
                placeholder="e.g. ARMY Membership"
                value={m}
                onChange={(e) => setMembership(i, e.target.value)}
              />
              {form.memberships.length > 1 && (
                <button
                  type="button"
                  aria-label="Remove membership"
                  onClick={() => update({ memberships: form.memberships.filter((_, j) => j !== i) })}
                  className="grid size-9 shrink-0 place-items-center rounded-lg border border-border hover:bg-muted"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
          ))}
        </div>
        {form.memberships.length < 3 && (
          <button
            type="button"
            onClick={() => update({ memberships: [...form.memberships, ''] })}
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
          >
            <Plus className="size-3.5" />
            Add Backup Membership
          </button>
        )}
      </div>
    </div>
  )
}

function Field({
  label,
  required,
  hint,
  error,
  children,
}: {
  label: string
  required?: boolean
  hint?: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-sm">
        {label} {required && <span className="text-primary">*</span>}
      </Label>
      {children}
      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  )
}
