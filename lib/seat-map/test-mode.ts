import 'server-only'

// Restricted test events are configured through env vars so no schema change is needed:
//   SEAT_MAP_TEST_EVENT_IDS  comma-separated event IDs (the events should also be marked hidden)
//   SEAT_MAP_TESTER_EMAILS   comma-separated verified account emails allowed to open them
// Orders on a test event never receive customer emails and are never shown payment QR codes.

function parseList(value: string | undefined) {
  return (value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

export function isTestEvent(eventId: number | null | undefined) {
  if (!eventId) return false
  return parseList(process.env.SEAT_MAP_TEST_EVENT_IDS).some((id) => Number(id) === eventId)
}

export function isAuthorizedTester(user: { email?: string | null; emailVerified?: boolean | null } | null | undefined) {
  if (!user?.email || !user.emailVerified) return false
  const email = user.email.toLowerCase()
  return parseList(process.env.SEAT_MAP_TESTER_EMAILS).some((allowed) => allowed.toLowerCase() === email)
}

export function canAccessEvent(
  eventId: number | null | undefined,
  user: { email?: string | null; emailVerified?: boolean | null } | null | undefined,
) {
  return !isTestEvent(eventId) || isAuthorizedTester(user)
}

export const TEST_EVENT_DENIED = 'This event is not available.'
