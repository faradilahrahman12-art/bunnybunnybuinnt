// The 4-stage progress model shown on the user dashboard and order tracker.
// The database `status` column keeps its original values; these helpers map
// those values onto the friendly Submitted → Confirmed → In Progress → Complete
// pipeline that admins control.

export const ORDER_STAGES = [
  { key: 'submitted', label: 'Submitted', status: 'pending' },
  { key: 'confirmed', label: 'Confirmed', status: 'verified' },
  { key: 'in_progress', label: 'In Progress', status: 'processing' },
  { key: 'complete', label: 'Complete', status: 'completed' },
] as const

export type OrderStage = (typeof ORDER_STAGES)[number]

// DB status -> index in ORDER_STAGES
// Pending remains at Submitted until an admin confirms the order.
const STATUS_TO_INDEX: Record<string, number> = {
  pending: 0,
  submitted: 0,
  verified: 1,
  confirmed: 1,
  processing: 2,
  in_progress: 2,
  completed: 3,
  complete: 3,
}

export function stageIndex(status: string): number {
  return STATUS_TO_INDEX[status] ?? 0
}

export function isCancelled(status: string): boolean {
  return status === 'cancelled'
}

export function isComplete(status: string): boolean {
  return stageIndex(status) >= ORDER_STAGES.length - 1
}

// Active = still moving through the pipeline (not complete, not cancelled)
export function isActive(status: string): boolean {
  return !isCancelled(status) && !isComplete(status)
}

export function stageLabel(status: string): string {
  if (isCancelled(status)) return 'Cancelled'
  return ORDER_STAGES[stageIndex(status)].label
}

// Options for the admin status selector
export const ADMIN_STATUS_OPTIONS: { value: string; label: string }[] = [
  ...ORDER_STAGES.map((s) => ({ value: s.status, label: s.label })),
  { value: 'cancelled', label: 'Cancelled' },
]
