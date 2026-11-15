import { notFound, redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

// Seat selection now lives inside Step 2 of the Submit Wizard; keep old links working.
export default async function SeatsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const eventId = Number(id)
  if (!Number.isInteger(eventId) || eventId < 1) notFound()
  redirect(`/submit?event=${eventId}`)
}
