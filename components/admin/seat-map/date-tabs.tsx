'use client'

import { CalendarDays } from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = {
  dates: { id: string; label: string }[]
  value: string
  onChange: (id: string) => void
  counts?: Record<string, number>
}

export function DateTabs({ dates, value, onChange, counts }: Props) {
  if (dates.length === 0) return null
  return (
    <div className="flex flex-col gap-2 rounded-2xl border bg-card p-3 sm:flex-row sm:items-center">
      <p className="flex shrink-0 items-center gap-2 text-sm font-medium">
        <CalendarDays className="size-4 text-primary" aria-hidden="true" />
        Event date
      </p>
      <div role="radiogroup" aria-label="Event date" className="flex flex-wrap gap-2">
        {dates.map((d) => {
          const active = d.id === value
          return (
            <button
              key={d.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(d.id)}
              className={cn(
                'flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors',
                active ? 'border-primary bg-primary text-primary-foreground' : 'hover:bg-accent',
              )}
            >
              {d.label}
              {counts && (
                <span
                  className={cn(
                    'rounded-full px-1.5 text-xs tabular-nums',
                    active ? 'bg-primary-foreground/20' : 'bg-muted text-muted-foreground',
                  )}
                >
                  {counts[d.id] ?? 0}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
