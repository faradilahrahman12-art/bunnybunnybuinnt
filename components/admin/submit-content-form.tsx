'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, Plus, RotateCcw, Save, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { resetSubmitContent, updateSubmitContent } from '@/app/actions/settings'
import {
  DEFAULT_SUBMIT_CONTENT,
  type PaymentMethodContent,
  type SubmitContent,
  type TermSection,
} from '@/lib/submit-content'

const STEP_KEYS = ['terms', 'ticket', 'account', 'payment', 'review'] as const
const STEP_LABELS: Record<(typeof STEP_KEYS)[number], string> = {
  terms: 'Step 1 · Agree',
  ticket: 'Step 2 · Ticket',
  account: 'Step 3 · Account',
  payment: 'Step 4 · Payment',
  review: 'Step 5 · Review',
}

export function SubmitContentForm({ content }: { content: SubmitContent }) {
  const router = useRouter()
  const [data, setData] = useState<SubmitContent>(content)
  const [saving, startSave] = useTransition()
  const [resetting, startReset] = useTransition()

  function save() {
    startSave(async () => {
      try {
        await updateSubmitContent(data)
        toast.success('Submit page content saved')
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to save')
      }
    })
  }

  function reset() {
    if (!confirm('Reset all submit page content back to the defaults?')) return
    startReset(async () => {
      try {
        await resetSubmitContent()
        setData(DEFAULT_SUBMIT_CONTENT)
        toast.success('Reset to defaults')
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to reset')
      }
    })
  }

  // Terms section helpers
  function updateSection(i: number, patch: Partial<TermSection>) {
    setData((d) => ({
      ...d,
      terms: {
        ...d.terms,
        sections: d.terms.sections.map((s, j) => (j === i ? { ...s, ...patch } : s)),
      },
    }))
  }
  function addSection() {
    setData((d) => ({
      ...d,
      terms: { ...d.terms, sections: [...d.terms.sections, { heading: '', body: [''] }] },
    }))
  }
  function removeSection(i: number) {
    setData((d) => ({
      ...d,
      terms: { ...d.terms, sections: d.terms.sections.filter((_, j) => j !== i) },
    }))
  }

  // Payment method helpers
  function updateMethod(i: number, patch: Partial<PaymentMethodContent>) {
    setData((d) => ({
      ...d,
      payment: {
        ...d.payment,
        methods: d.payment.methods.map((m, j) => (j === i ? { ...m, ...patch } : m)),
      },
    }))
  }
  function addMethod() {
    setData((d) => ({
      ...d,
      payment: { ...d.payment, methods: [...d.payment.methods, { value: '', hint: '' }] },
    }))
  }
  function removeMethod(i: number) {
    setData((d) => ({
      ...d,
      payment: { ...d.payment, methods: d.payment.methods.filter((_, j) => j !== i) },
    }))
  }

  const busy = saving || resetting

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">Submit Page Content</h2>
          <p className="text-sm text-muted-foreground">
            Edit the text shown across the 5-step booking flow at <code>/submit</code>. The Terms
            sections also power the public <code>/terms</code> page.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={reset} disabled={busy}>
            {resetting ? <Loader2 className="size-3.5 animate-spin" /> : <RotateCcw className="size-3.5" />}
            Reset
          </Button>
          <Button size="sm" className="gap-1.5" onClick={save} disabled={busy}>
            {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
            Save changes
          </Button>
        </div>
      </div>

      {/* Step headings */}
      <Group title="Step headings" desc="The large title and subtitle at the top of each step.">
        {STEP_KEYS.map((key) => (
          <div key={key} className="rounded-lg border border-border bg-background p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {STEP_LABELS[key]}
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <FieldText
                label="Title"
                value={data.steps[key].title}
                onChange={(v) =>
                  setData((d) => ({ ...d, steps: { ...d.steps, [key]: { ...d.steps[key], title: v } } }))
                }
              />
              <FieldText
                label="Subtitle"
                value={data.steps[key].subtitle}
                onChange={(v) =>
                  setData((d) => ({
                    ...d,
                    steps: { ...d.steps, [key]: { ...d.steps[key], subtitle: v } },
                  }))
                }
              />
            </div>
          </div>
        ))}
      </Group>

      {/* Terms */}
      <Group title="Terms & Agreement" desc="Sections shown in the scrollable terms box and on /terms.">
        <div className="grid gap-3 sm:grid-cols-2">
          <FieldText
            label="Scroll hint"
            value={data.terms.scrollHint}
            onChange={(v) => setData((d) => ({ ...d, terms: { ...d.terms, scrollHint: v } }))}
          />
          <FieldText
            label="Agreement checkbox label"
            value={data.terms.agreeLabel}
            onChange={(v) => setData((d) => ({ ...d, terms: { ...d.terms, agreeLabel: v } }))}
          />
          <FieldText
            label="Final warning title"
            value={data.terms.finalWarningTitle}
            onChange={(v) => setData((d) => ({ ...d, terms: { ...d.terms, finalWarningTitle: v } }))}
          />
          <FieldArea
            label="Final warning body"
            value={data.terms.finalWarningBody}
            onChange={(v) => setData((d) => ({ ...d, terms: { ...d.terms, finalWarningBody: v } }))}
          />
        </div>

        <div className="mt-2 flex flex-col gap-3">
          {data.terms.sections.map((s, i) => (
            <div key={i} className="rounded-lg border border-border bg-background p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Section {i + 1}
                </p>
                <button
                  type="button"
                  aria-label="Remove section"
                  onClick={() => removeSection(i)}
                  className="grid size-7 place-items-center rounded-md border border-border text-destructive hover:bg-muted"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
              <div className="mt-3 flex flex-col gap-3">
                <FieldText
                  label="Heading"
                  value={s.heading}
                  onChange={(v) => updateSection(i, { heading: v })}
                />
                <FieldArea
                  label="Body (one paragraph or bullet per line)"
                  rows={4}
                  value={s.body.join('\n')}
                  onChange={(v) => updateSection(i, { body: v.split('\n') })}
                />
              </div>
            </div>
          ))}
          <Button variant="outline" size="sm" className="gap-1.5 self-start" onClick={addSection}>
            <Plus className="size-3.5" />
            Add section
          </Button>
        </div>
      </Group>

      {/* Account */}
      <Group title="Account step" desc="Use {platform} in the banner to insert the event's platform name.">
        <div className="grid gap-3 sm:grid-cols-2">
          <FieldText
            label="Platform banner"
            value={data.account.platformBanner}
            onChange={(v) => setData((d) => ({ ...d, account: { ...d.account, platformBanner: v } }))}
          />
          <FieldText
            label="Confirmation checkbox label"
            value={data.account.confirmLabel}
            onChange={(v) => setData((d) => ({ ...d, account: { ...d.account, confirmLabel: v } }))}
          />
          <FieldArea
            label="Backup account note"
            value={data.account.backupInfo}
            onChange={(v) => setData((d) => ({ ...d, account: { ...d.account, backupInfo: v } }))}
          />
          <FieldText
            label="Membership section title"
            value={data.account.membershipTitle}
            onChange={(v) => setData((d) => ({ ...d, account: { ...d.account, membershipTitle: v } }))}
          />
          <FieldArea
            label="Membership hint"
            value={data.account.membershipHint}
            onChange={(v) => setData((d) => ({ ...d, account: { ...d.account, membershipHint: v } }))}
          />
        </div>
      </Group>

      {/* Payment */}
      <Group title="Payment step" desc="Amount labels, info banners, and available payment methods.">
        <div className="grid gap-3 sm:grid-cols-2">
          <FieldText
            label="Amount due label"
            value={data.payment.amountDueLabel}
            onChange={(v) => setData((d) => ({ ...d, payment: { ...d.payment, amountDueLabel: v } }))}
          />
          <div />
          <FieldArea
            label="Info banner (price to be quoted)"
            value={data.payment.infoQuoted}
            onChange={(v) => setData((d) => ({ ...d, payment: { ...d.payment, infoQuoted: v } }))}
          />
          <FieldArea
            label="Info banner (price known)"
            value={data.payment.infoFixed}
            onChange={(v) => setData((d) => ({ ...d, payment: { ...d.payment, infoFixed: v } }))}
          />
        </div>

        <div className="mt-2 flex flex-col gap-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Payment methods
          </p>
          {data.payment.methods.map((m, i) => (
            <div key={i} className="flex items-start gap-2 rounded-lg border border-border bg-background p-3">
              <div className="grid flex-1 gap-3 sm:grid-cols-2">
                <FieldText
                  label="Name"
                  value={m.value}
                  onChange={(v) => updateMethod(i, { value: v })}
                />
                <FieldText label="Hint" value={m.hint} onChange={(v) => updateMethod(i, { hint: v })} />
              </div>
              <button
                type="button"
                aria-label="Remove method"
                onClick={() => removeMethod(i)}
                className="mt-6 grid size-7 shrink-0 place-items-center rounded-md border border-border text-destructive hover:bg-muted"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ))}
          <Button variant="outline" size="sm" className="gap-1.5 self-start" onClick={addMethod}>
            <Plus className="size-3.5" />
            Add method
          </Button>
        </div>
      </Group>

      {/* Review */}
      <Group title="Review step" desc="The confirmation note shown above the submit button.">
        <FieldArea
          label="Footer note"
          value={data.review.footer}
          onChange={(v) => setData((d) => ({ ...d, review: { ...d.review, footer: v } }))}
        />
      </Group>

      <div className="flex justify-end">
        <Button className="gap-1.5" onClick={save} disabled={busy}>
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          Save changes
        </Button>
      </div>
    </div>
  )
}

function Group({
  title,
  desc,
  children,
}: {
  title: string
  desc?: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <div className="mb-3">
        <h3 className="text-sm font-bold">{title}</h3>
        {desc && <p className="text-xs text-muted-foreground">{desc}</p>}
      </div>
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  )
}

function FieldText({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs">{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  )
}

function FieldArea({
  label,
  value,
  onChange,
  rows = 3,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  rows?: number
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs">{label}</Label>
      <Textarea rows={rows} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  )
}
