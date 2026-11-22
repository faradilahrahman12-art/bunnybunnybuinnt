export const FLEXIBLE_DELIVERY = 'flexible'
export const PRIORITY_DELIVERY_METHOD = 'change_account_details'

export const FINAL_DELIVERY_METHODS = [
  { value: 'change_account_details', label: 'Change Account Details' },
  { value: 'enter_together', label: 'Enter Together at Venue' },
  { value: 'wristband_transfer', label: 'Wristband Transfer' },
  { value: 'eticket_transfer', label: 'E-Ticket Transfer' },
] as const

export type FinalDeliveryMethod = (typeof FINAL_DELIVERY_METHODS)[number]['value']

// Delivery values a buyer can submit on non-Ticketmaster resale events.
export const LEGACY_DELIVERY_OPTIONS = [
  'enter_together',
  'change_details',
  'electronic_ticket',
  'etix_transfer',
  'flexible',
] as const

export const DELIVERY_METHOD_LABELS: Record<string, string> = {
  flexible: 'Flexible',
  change_account_details: 'Change Account Details',
  change_details: 'Change Account Details',
  enter_together: 'Enter Together at Venue',
  wristband_transfer: 'Wristband Transfer',
  eticket_transfer: 'E-Ticket Transfer',
  electronic_ticket: 'Electronic Ticket',
  etix_transfer: 'Ticket Transfer via Etix',
}

function normalizePlatform(platform: string | null | undefined) {
  return (platform ?? '').toLowerCase().replace(/[^a-z0-9]/g, '')
}

// Matches every regional Ticketmaster platform ("Ticketmaster PH", "Ticketmaster Korea", "Ticketmaster")
// while excluding look-alike providers such as Thaiticketmajor and Ticketmelon.
export function isTicketmasterPlatform(platform: string | null | undefined) {
  return normalizePlatform(platform).startsWith('ticketmaster')
}

export function usesFlexibleDelivery(event: { type?: string | null; country?: string | null; platform?: string | null }) {
  const isKoreaEvent = (event.country ?? '').toLowerCase().includes('korea')
  return event.type !== 'help_to_buy' && (isTicketmasterPlatform(event.platform) || isKoreaEvent)
}

export type OrderDeliveryFields = {
  deliveryMethod: string | null
  priorityDeliveryMethod: string | null
  actualDeliveryMethod: null
}

// The server decides delivery from the event record so a client can't opt out of the flexible flow.
export function resolveOrderDelivery(
  event: { type?: string | null; country?: string | null; platform?: string | null } | null,
  requested: string | null | undefined,
): OrderDeliveryFields {
  if (event && usesFlexibleDelivery(event)) {
    return {
      deliveryMethod: FLEXIBLE_DELIVERY,
      priorityDeliveryMethod: PRIORITY_DELIVERY_METHOD,
      actualDeliveryMethod: null,
    }
  }
  const allowed = (LEGACY_DELIVERY_OPTIONS as readonly string[]).includes(requested ?? '')
  return {
    deliveryMethod: event?.type !== 'help_to_buy' && allowed ? (requested as string) : null,
    priorityDeliveryMethod: null,
    actualDeliveryMethod: null,
  }
}
