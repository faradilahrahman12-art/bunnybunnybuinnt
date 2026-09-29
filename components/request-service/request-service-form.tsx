'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { submitRequestReserve, type SubmitRequestInput } from '@/app/actions/request-reserve'
import { CheckCircle2, Loader2, Send } from 'lucide-react'

const SERVICE_TYPES = [
  { value: 'ticket_purchase', label: 'Ticket Purchase', hint: 'I want to buy tickets for a show' },
  { value: 'transfer', label: 'Ticket Transfer', hint: 'Transfer a ticket to my own account' },
  { value: 'other', label: 'Something else', hint: 'Something else entirely' },
] as const

export function RequestServiceForm() {
  const [serviceType, setServiceType] = useState<SubmitRequestInput['serviceType']>('ticket_purchase')
  const [artist, setArtist] = useState('')
  const [tourName, setTourName] = useState('')
  const [country, setCountry] = useState('')
  const [concertDates, setConcertDates] = useState('')
  const [ticketsNeeded, setTicketsNeeded] = useState('2')
  const [section, setSection] = useState('')
  const [budget, setBudget] = useState('')
  const [telegram, setTelegram] = useState('')
  const [email, setEmail] = useState('')
  const [notes, setNotes] = useState('')

  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const activeHint = SERVICE_TYPES.find((s) => s.value === serviceType)?.hint

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setPending(true)
    const res = await submitRequestReserve({
      serviceType,
      artist,
      tourName,
      country,
      concertDates,
      ticketsNeeded: Number(ticketsNeeded),
      section,
      budget,
      telegram,
      email,
      notes,
    })
    setPending(false)
    if (res.error) {
      setError(res.error)
      return
    }
    setDone(true)
  }

  if (done) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 rounded-2xl border border-border bg-card px-6 py-14 text-center shadow-sm">
        <CheckCircle2 className="size-12 text-primary" />
        <h2 className="text-xl font-semibold tracking-tight">Request received</h2>
        <p className="text-sm text-muted-foreground">
          Thanks! Our team will get back to you — usually within a few hours on Telegram.
        </p>
        <Button variant="outline" className="rounded-full" onClick={() => setDone(false)}>
          Submit another request
        </Button>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto flex max-w-2xl flex-col gap-8 rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8"
    >
      <fieldset className="flex flex-col gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-tight">What do you need?</h2>
          <p className="text-sm text-muted-foreground">Select a service type</p>
        </div>
        <Select value={serviceType} onValueChange={(v) => setServiceType(v as SubmitRequestInput['serviceType'])}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a service type" />
          </SelectTrigger>
          <SelectContent>
            {SERVICE_TYPES.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {activeHint && <p className="text-xs text-muted-foreground">{activeHint}</p>}
      </fieldset>

      <fieldset className="flex flex-col gap-4">
        <div>
          <h2 className="text-base font-semibold tracking-tight">Event details</h2>
          <p className="text-sm text-muted-foreground">Tell us about the concert you&apos;re targeting</p>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="artist">
            Artist / Group <span className="text-primary">*</span>
          </Label>
          <Input
            id="artist"
            required
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
            placeholder="e.g. SEVENTEEN, aespa, TWICE"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="tourName">Concert / Tour name</Label>
          <Input
            id="tourName"
            value={tourName}
            onChange={(e) => setTourName(e.target.value)}
            placeholder="e.g. BE THE SUN World Tour"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="country">Country</Label>
            <Input
              id="country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="e.g. Philippines"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="concertDates">Concert date(s)</Label>
            <Input
              id="concertDates"
              value={concertDates}
              onChange={(e) => setConcertDates(e.target.value)}
              placeholder="e.g. Oct 25–27, 2025"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ticketsNeeded">Tickets needed</Label>
            <Input
              id="ticketsNeeded"
              type="number"
              min={1}
              max={20}
              value={ticketsNeeded}
              onChange={(e) => setTicketsNeeded(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="section">Section / Category</Label>
            <Input
              id="section"
              value={section}
              onChange={(e) => setSection(e.target.value)}
              placeholder="e.g. VIP, Floor A"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="budget">Budget (per ticket)</Label>
            <Input
              id="budget"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="e.g. ₱10,000"
            />
          </div>
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-4">
        <div>
          <h2 className="text-base font-semibold tracking-tight">We&apos;ll follow up here</h2>
          <p className="text-sm text-muted-foreground">Faster replies happen on Telegram.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="telegram">Telegram</Label>
            <Input
              id="telegram"
              value={telegram}
              onChange={(e) => setTelegram(e.target.value)}
              placeholder="@yourhandle"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="notes">Anything else?</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Tell us anything that will help us assist you faster."
            rows={3}
          />
        </div>
      </fieldset>

      {error && <p className="text-sm font-medium text-destructive">{error}</p>}

      <Button type="submit" disabled={pending} className="gap-2 rounded-full sm:h-11">
        {pending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
        {pending ? 'Sending…' : 'Send request'}
      </Button>
    </form>
  )
}
