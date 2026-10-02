'use client'

import { useState, useTransition } from 'react'
import { ChevronDown, Link2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { claimOrder } from '@/app/actions/orders'

export function ClaimOrderForm({ onClaimed }: { onClaimed: () => void }) {
  const [open, setOpen] = useState(false)
  const [reference, setReference] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [pending, startTransition] = useTransition()

  function submit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    setSuccess(false)
    startTransition(async () => {
      const res = await claimOrder(reference, email)
      if (res.error) {
        setError(res.error)
        return
      }
      setReference('')
      setEmail('')
      setSuccess(true)
      onClaimed()
    })
  }

  return (
    <div className="rounded-2xl border border-border bg-card">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm"
      >
        <span className="flex items-center gap-2 font-medium">
          <Link2 className="size-4 text-primary" aria-hidden="true" />
          Missing an older order?
        </span>
        <ChevronDown
          className={`size-4 text-muted-foreground transition ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <form onSubmit={submit} className="flex flex-col gap-3 border-t border-border px-4 py-4">
          <p className="text-xs text-muted-foreground">
            Orders placed before you created an account can be added here. Enter the order
            reference and the email you used on that order.
          </p>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="claim-reference">Order reference</Label>
            <Input
              id="claim-reference"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="NP-XXXXXX"
              autoCapitalize="characters"
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="claim-email">Email on the order</Label>
            <Input
              id="claim-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              autoComplete="email"
              required
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          {success && <p className="text-sm text-primary">Order added to your account.</p>}
          <Button type="submit" disabled={pending} className="gap-1.5">
            {pending && <Loader2 className="size-4 animate-spin" />}
            {pending ? 'Adding order…' : 'Add to My Orders'}
          </Button>
        </form>
      )}
    </div>
  )
}
