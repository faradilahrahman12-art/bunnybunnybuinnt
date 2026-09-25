'use client'

import { useRef, useState } from 'react'
import { Check, Loader2, QrCode, Upload, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { fileToCompressedDataUrl } from '@/lib/compress-image'
import { extractReferenceFromImage } from '@/app/actions/extract-reference'
import { computeTotal, pesos, type StepProps } from './types'

const MAX_SCREENSHOTS = 15

export function StepPayment({ event, form, update, content, merchants }: StepProps) {
  const { steps } = content
  const total = computeTotal(event, form)
  const fileRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [detecting, setDetecting] = useState(false)

  const selected = merchants.find((m) => m.name === form.paymentMerchant) ?? merchants[0] ?? null

  async function onFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    const remaining = MAX_SCREENSHOTS - form.screenshots.length
    if (remaining <= 0) return
    const picked = Array.from(files)
      .filter((f) => f.type.startsWith('image/'))
      .slice(0, remaining)
    if (picked.length === 0) return
    setBusy(true)
    try {
      const compressed: string[] = []
      for (const f of picked) {
        try {
          compressed.push(await fileToCompressedDataUrl(f, { maxSize: 1400, quality: 0.6 }))
        } catch {
          // Skip files that fail to process rather than blocking the batch.
        }
      }
      if (compressed.length) update({ screenshots: [...form.screenshots, ...compressed] })
      // Auto-detect the reference number from the first uploaded receipt if the
      // field is still empty. Runs in the background — the user can always edit it.
      if (compressed.length && form.paymentReference.trim().length === 0) {
        setDetecting(true)
        try {
          const { reference } = await extractReferenceFromImage(compressed[0])
          if (reference) update({ paymentReference: reference })
        } finally {
          setDetecting(false)
        }
      }
    } finally {
      setBusy(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  function removeShot(index: number) {
    update({ screenshots: form.screenshots.filter((_, i) => i !== index) })
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="text-left">
        <h1 className="text-3xl font-medium tracking-tight sm:text-4xl">💸{steps.payment.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{steps.payment.subtitle}</p>
      </div>

      {/* Total to pay */}
      <div className="flex items-center justify-between rounded-xl bg-primary/10 px-5 py-4">
        <p className="text-sm font-medium text-primary/80">Total to pay:</p>
        <p className="text-2xl font-bold text-primary">
          {total !== null ? pesos(total) : 'To be quoted'}
        </p>
      </div>

      {/* Mode of Payment */}
      <div className="flex flex-col gap-2">
        <Label className="text-sm">
          Mode of Payment <span className="text-primary">*</span>
        </Label>
        <div className="flex items-center gap-3 rounded-xl border border-primary bg-primary/5 px-4 py-3">
          <span className="grid size-9 place-items-center overflow-hidden rounded-md bg-white p-1">
            <img src="/images/qrph-logo.png" alt="QR Ph" className="size-full object-contain" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold">QRPH</p>
            <p className="text-xs text-muted-foreground">Scan the QR code to pay</p>
          </div>
          <Check className="size-4 shrink-0 text-primary" />
        </div>
      </div>

      {/* Merchant selector */}
      {merchants.length > 0 ? (
        <>
          {merchants.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {merchants.map((m) => {
                const active = selected?.id === m.id
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => update({ paymentMerchant: m.name })}
                    className={`rounded-full px-4 py-1.5 text-sm font-bold uppercase tracking-wide transition ${
                      active
                        ? 'bg-primary text-primary-foreground'
                        : 'border border-border bg-background text-muted-foreground hover:border-primary/40'
                    }`}
                  >
                    {m.name}
                  </button>
                )
              })}
            </div>
          )}
          {/* QR display */}
          <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-muted/30 p-5">
            <div className="grid aspect-square w-52 place-items-center overflow-hidden rounded-xl bg-white p-3">
              {selected?.qrImageUrl ? (
                // Uploaded QR is a compressed data URL — a plain img avoids next/image domain config.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={selected.qrImageUrl || '/placeholder.svg'}
                  alt={`QRPH code for ${selected.name}`}
                  className="h-full w-full object-contain"
                />
              ) : (
                <div className="flex flex-col items-center gap-2 text-center text-muted-foreground">
                  <QrCode className="size-10" />
                  <span className="text-xs">QR code coming soon</span>
                </div>
              )}
            </div>
            <div className="text-center">
              <p className="text-sm font-bold">Scan to pay via QRPH</p>
              {selected && (
                <p className="text-xs text-muted-foreground">Account name: {selected.name}</p>
              )}
              <p className="text-xs text-primary/80">Use your order reference as the payment note</p>
            </div>
          </div>
          {/* How to pay via QRPH */}
          <div className="rounded-xl border border-border bg-muted/20 p-5">
            <p className="text-sm font-bold">How to pay via QRPH</p>
            <ol className="mt-3 flex flex-col gap-2.5">
              {[
                { icon: '📱', text: 'Open your bank or e-wallet app.' },
                { icon: '📷', text: 'Select Scan QR / Pay via QR / QR Ph.' },
                { icon: '🖼️', text: 'Scan the QR or upload it from your gallery.' },
                { icon: '💰', text: 'Enter the exact payment amount.' },
                { icon: '✅', text: 'Check the recipient name and amount.' },
                { icon: '💳', text: 'Confirm and complete the payment.' },
                { icon: '📸', text: 'Save a screenshot of your successful payment receipt.' },
                { icon: '📤', text: 'Upload the receipt as your proof of payment.' },
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    {i + 1}
                  </span>
                  <span className="leading-6">
                    <span aria-hidden="true" className="mr-1.5">
                      {step.icon}
                    </span>
                    {step.text}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </>
      ) : (
        <p className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-6 text-center text-sm text-muted-foreground">
          Payment QR codes are being set up. You can still submit your order and we&apos;ll send you
          payment details after.
        </p>
      )}

      {/* Date & time paid */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label className="text-sm">Date Paid</Label>
          <Input
            value={form.datePaid}
            onChange={(e) => update({ datePaid: e.target.value })}
            placeholder="MM/DD/YYYY"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-sm">Time Paid</Label>
          <Input
            value={form.timePaid}
            onChange={(e) => update({ timePaid: e.target.value })}
            placeholder="e.g. 7:32 PM"
          />
        </div>
      </div>

      {/* Reference number */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-2">
          <Label className="text-sm">
            Reference Number <span className="text-primary">*</span>
          </Label>
          {detecting && (
            <span className="flex items-center gap-1.5 text-xs text-primary">
              <Loader2 className="size-3.5 animate-spin" />
              Detecting from receipt…
            </span>
          )}
        </div>
        <Input
          value={form.paymentReference}
          onChange={(e) => update({ paymentReference: e.target.value })}
          placeholder="Transaction reference or hash"
        />
        <p className="text-xs text-muted-foreground">
          Upload your receipt below and we&apos;ll try to auto-fill this. Please double-check it.
        </p>
      </div>

      {/* Proof of payment */}
      <div className="flex flex-col gap-1.5">
        <Label className="text-sm">
          Proof of Payment <span className="text-primary">*</span>
        </Label>
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp"
          multiple
          className="hidden"
          onChange={(e) => onFiles(e.target.files)}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={busy || form.screenshots.length >= MAX_SCREENSHOTS}
          className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/20 px-4 py-8 text-center transition hover:border-primary/40 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span className="grid size-11 place-items-center rounded-full bg-primary/10 text-primary">
            <Upload className="size-5" />
          </span>
          <span className="text-sm font-bold">
            {busy ? 'Processing…' : 'Tap to upload screenshot(s)'}
          </span>
          <span className="text-xs text-muted-foreground">PNG, JPG up to 10MB</span>
        </button>

        {form.screenshots.length > 0 && (
          <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
            {form.screenshots.map((src, i) => (
              <div
                key={i}
                className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-muted"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src || '/placeholder.svg'} alt={`Proof ${i + 1}`} className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeShot(i)}
                  aria-label={`Remove screenshot ${i + 1}`}
                  className="absolute right-1 top-1 grid size-6 place-items-center rounded-full bg-background/90 text-destructive shadow hover:bg-background"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        <p className="text-xs text-primary/80">
          Upload up to {MAX_SCREENSHOTS} screenshots · {form.screenshots.length}/{MAX_SCREENSHOTS} ·
          auto-compressed
        </p>
      </div>
    </div>
  )
}
