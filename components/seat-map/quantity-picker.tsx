'use client'

import { useState } from 'react'
import { Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const QUICK_OPTIONS = [1, 2, 3, 4, 5]
const EXTENDED_OPTIONS = [6, 7, 8, 9, 10]

export function QuantityPicker({
  initial,
  onConfirm,
}: {
  initial: number
  onConfirm: (quantity: number) => void
}) {
  const [choice, setChoice] = useState(initial)
  const [extended, setExtended] = useState(initial >= 6)

  const options = extended ? EXTENDED_OPTIONS : QUICK_OPTIONS

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="quantity-picker-title"
      className="w-[min(20rem,calc(100%-2rem))] rounded-2xl border bg-card p-5 text-card-foreground shadow-2xl"
    >
      <h2 id="quantity-picker-title" className="text-center text-lg font-bold">
        How many tickets?
      </h2>
      <p className="mt-1 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
        <Users className="size-3.5" aria-hidden="true" />
        {"You'll be seated together"}
      </p>

      <div className="mt-4 grid grid-cols-3 gap-2" role="radiogroup" aria-label="Number of tickets">
        {options.map((option) => (
          <QuantityOption key={option} value={option} active={choice === option} onPick={setChoice} />
        ))}
        {extended ? (
          <button
            type="button"
            onClick={() => {
              setExtended(false)
              if (choice >= 6) setChoice(5)
            }}
            className="h-11 rounded-lg border border-border text-sm font-medium text-muted-foreground transition hover:border-primary/50 hover:text-foreground"
          >
            Fewer
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              setExtended(true)
              setChoice(6)
            }}
            className="h-11 rounded-lg border border-border text-sm font-medium transition hover:border-primary/50"
          >
            6+
          </button>
        )}
      </div>

      <Button className="mt-4 h-11 w-full text-base font-semibold" onClick={() => onConfirm(choice)}>
        Continue
      </Button>
    </div>
  )
}

function QuantityOption({
  value,
  active,
  onPick,
}: {
  value: number
  active: boolean
  onPick: (value: number) => void
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={() => onPick(value)}
      className={cn(
        'h-11 rounded-lg border text-sm font-semibold transition',
        active
          ? 'border-primary bg-primary/10 text-primary ring-2 ring-primary/30'
          : 'border-border hover:border-primary/50',
      )}
    >
      {value}
    </button>
  )
}
