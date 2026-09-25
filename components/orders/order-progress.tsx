'use client'

import { ORDER_STAGES, isCancelled, stageIndex } from '@/lib/order-status'

export function OrderProgress({ status }: { status: string }) {
  const cancelled = isCancelled(status)
  const current = stageIndex(status)

  if (cancelled) {
    return (
      <div className="flex flex-col gap-1.5">
        <div className="h-1.5 w-full rounded-full bg-destructive/20">
          <div className="h-full w-full rounded-full bg-destructive" />
        </div>
        <p className="text-xs font-semibold text-destructive">This order was cancelled.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-4 gap-1.5">
        {ORDER_STAGES.map((stage, i) => (
          <div
            key={stage.key}
            className={`h-1.5 rounded-full transition-colors ${
              i <= current ? 'bg-primary' : 'bg-muted'
            }`}
          />
        ))}
      </div>
      <div className="grid grid-cols-4 gap-1.5 text-[11px] font-medium">
        {ORDER_STAGES.map((stage, i) => (
          <span
            key={stage.key}
            className={`truncate text-center ${
              i === current
                ? 'font-semibold text-primary'
                : i < current
                  ? 'text-foreground'
                  : 'text-muted-foreground'
            }`}
          >
            {stage.label}
          </span>
        ))}
      </div>
    </div>
  )
}
