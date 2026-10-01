import type { EventWithSchedule, QrphMerchant } from '@/lib/db/schema'
import type { SubmitContent } from '@/lib/submit-content'

// Payment methods are admin-editable, so this is an open string.
export type PaymentMethod = string

// Per-date choice: priority tier, optional backup tier, and the quantity for that date
export type DateSelection = { priority: string; backup?: string; quantity: number }

export type DeliveryOption = 'enter_together' | 'change_details' | 'electronic_ticket' | 'etix_transfer' | ''

// NOL Korea help-to-buy events let the buyer pick between a manual or a bot-assisted service,
// each with its own terms and agreement.
export type ServiceTier = 'manual' | 'premium_bots' | ''

export type SubmitFormState = {
  agreed: boolean
  // NOL Korea only: which service the buyer selected on the Agree step
  serviceTier: ServiceTier
  // resale-only: how the buyer receives access to the tickets
  deliveryOption: DeliveryOption
  // ticket — each selected date carries its own tier + quantity
  selectedDates: string[]
  // tier + quantity selection keyed by date label
  sections: Record<string, DateSelection>
  // account
  credentialsConfirmed: boolean
  accountEmail: string
  confirmAccountEmail: string
  password: string
  confirmPassword: string
  holderName: string
  holderDob: string
  contactNumber: string
  // resale contact-info step
  telegram: string
  instagram: string
  memberships: string[]
  // payment
  paymentMethod: PaymentMethod
  paymentMerchant: string
  paymentReference: string
  datePaid: string
  timePaid: string
  amountSent: string
  // proof of payment — compressed screenshot data URLs stored in the DB
  screenshots: string[]
}

export const initialFormState: SubmitFormState = {
  agreed: false,
  serviceTier: '',
  deliveryOption: '',
  selectedDates: [],
  sections: {},
  credentialsConfirmed: false,
  accountEmail: '',
  confirmAccountEmail: '',
  password: '',
  confirmPassword: '',
  holderName: '',
  holderDob: '',
  contactNumber: '',
  telegram: '',
  instagram: '',
  memberships: [''],
  paymentMethod: 'QRPH',
  paymentMerchant: '',
  paymentReference: '',
  datePaid: '',
  timePaid: '',
  amountSent: '',
  screenshots: [],
}

export const MAX_QUANTITY = 10

// NOL Korea help-to-buy events swap the single terms step for a two-service picker
// (Manual Service vs Premium Service / Bots), each with its own terms + agreement.
export function isNolKorea(event: EventWithSchedule): boolean {
  const country = (event.country ?? '').toLowerCase()
  const platform = (event.platform ?? '').trim().toLowerCase()
  return country.includes('korea') && platform.startsWith('nol')
}

export const STEPS = ['Agree', 'Ticket', 'Account', 'Payment', 'Review'] as const

export type StepProps = {
  event: EventWithSchedule
  form: SubmitFormState
  update: (patch: Partial<SubmitFormState>) => void
  content: SubmitContent
  merchants: QrphMerchant[]
}

export function pesos(n: number) {
  return `₱${n.toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
}

// Manual Service on NOL Korea events uses its own section list when the admin has set one up.
export function daySections(
  event: EventWithSchedule,
  form: SubmitFormState,
  day: EventWithSchedule['schedule'][number] | undefined,
) {
  if (!day) return []
  if (isNolKorea(event) && form.serviceTier === 'manual' && (day.manualSections?.length ?? 0) > 0) {
    return day.manualSections
  }
  return day.sections
}

// Fallback for older data: a bots section's manual price when no manual section list exists.
export function sectionPrice(
  event: EventWithSchedule,
  form: SubmitFormState,
  section: { price: number; manualPrice?: number | null },
): number {
  if (isNolKorea(event) && form.serviceTier === 'manual' && (section.manualPrice ?? 0) > 0) {
    return section.manualPrice as number
  }
  return section.price
}

// Total = sum over selected dates of (chosen priority tier price, if any) * that date's quantity
export function computeTotal(event: EventWithSchedule, form: SubmitFormState): number | null {
  if (form.selectedDates.length === 0) return null
  let total = 0
  let hasPrice = false
  for (const label of form.selectedDates) {
    const day = event.schedule.find((d) => d.label === label)
    const list = daySections(event, form, day)
    if (list.length === 0) continue
    const priorityName = form.sections[label]?.priority
    const qty = form.sections[label]?.quantity ?? 1
    const chosen = list.find((s) => s.name === priorityName) ?? list[0]
    const price = chosen ? sectionPrice(event, form, chosen) : 0
    if (price > 0) {
      total += price * qty
      hasPrice = true
    }
  }
  return hasPrice ? total : null
}

// Sum of quantities across all selected dates
export function totalTickets(form: SubmitFormState): number {
  return form.selectedDates.reduce((sum, label) => sum + (form.sections[label]?.quantity ?? 0), 0)
}

export function pesosPlain(n: number) {
  return n.toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}
