'use client'

import { useState, useTransition } from 'react'
import { MessageCircle, Send } from 'lucide-react'
import { submitCustomerReview } from '@/app/actions/reviews'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import type { TrackedOrder } from '@/app/actions/orders'

export function CustomerReviewForm({ order, email }: { order: TrackedOrder; email: string }) {
  const [text, setText] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function submit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    startTransition(async () => {
      try {
        await submitCustomerReview({ reference: order.reference, email, text })
        setSent(true)
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'Could not submit review')
      }
    })
  }

  if (sent) {
    return <p className="rounded-xl bg-primary/10 p-3 text-sm text-primary">Thanks for sharing your experience.</p>
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
      <div>
        <p className="flex items-center gap-1.5 text-sm font-semibold"><MessageCircle className="size-4 text-primary" />Share your experience</p>
        <p className="mt-1 text-xs text-muted-foreground">Your order is complete. Tell us about {order.eventTitle}.</p>
      </div>
      <Textarea value={text} onChange={(event) => setText(event.target.value)} placeholder="How was your experience?" maxLength={2000} rows={4} required />
      {error && <p className="text-xs text-destructive">{error}</p>}
      <Button type="submit" disabled={pending || !text.trim()} className="self-start gap-1.5">
        <Send className="size-3.5" />
        {pending ? 'Submitting…' : 'Leave review'}
      </Button>
    </form>
  )
}
