'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Eye, EyeOff, Loader2, Plus, QrCode, Save, Trash2, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  createQrphMerchant,
  deleteQrphMerchant,
  updateQrphMerchant,
} from '@/app/actions/qrph'
import { fileToCompressedDataUrl } from '@/lib/compress-image'
import type { QrphMerchant } from '@/lib/db/schema'

export function QrphManager({ merchants }: { merchants: QrphMerchant[] }) {
  const [adding, setAdding] = useState(false)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">QRPH Payment Merchants</h2>
          <p className="text-sm text-muted-foreground">
            Add the QRPH accounts buyers scan on the payment step. Each merchant has a display name
            and its own QR code image.
          </p>
        </div>
        <Button className="gap-1.5" onClick={() => setAdding((a) => !a)}>
          <Plus className="size-4" />
          Add Merchant
        </Button>
      </div>

      {adding && <MerchantForm onDone={() => setAdding(false)} />}

      <div className="flex flex-col gap-3">
        {merchants.length === 0 && !adding && (
          <p className="rounded-xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
            No QRPH merchants yet. Click “Add Merchant” to create one.
          </p>
        )}
        {merchants.map((m) => (
          <MerchantForm key={m.id} merchant={m} />
        ))}
      </div>
    </div>
  )
}

function MerchantForm({ merchant, onDone }: { merchant?: QrphMerchant; onDone?: () => void }) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [pending, startTransition] = useTransition()
  const [uploading, setUploading] = useState(false)
  const [name, setName] = useState(merchant?.name ?? '')
  const [qrImageUrl, setQrImageUrl] = useState(merchant?.qrImageUrl ?? '')
  const [active, setActive] = useState(merchant?.active ?? true)
  const [sortOrder, setSortOrder] = useState(merchant?.sortOrder ?? 0)

  async function onFile(files: FileList | null) {
    const file = files?.[0]
    if (!file || !file.type.startsWith('image/')) return
    setUploading(true)
    try {
      // Keep QR readable: cap size, use PNG so codes stay crisp.
      const dataUrl = await fileToCompressedDataUrl(file, {
        maxSize: 700,
        quality: 0.92,
        mime: 'image/png',
      })
      setQrImageUrl(dataUrl)
    } catch {
      toast.error('Could not process that image')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  function save() {
    if (!name.trim()) {
      toast.error('Merchant name is required')
      return
    }
    startTransition(async () => {
      try {
        const input = { name, qrImageUrl, active, sortOrder }
        if (merchant) {
          await updateQrphMerchant(merchant.id, input)
          toast.success('Merchant updated')
        } else {
          await createQrphMerchant(input)
          toast.success('Merchant added')
        }
        router.refresh()
        onDone?.()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to save')
      }
    })
  }

  function remove() {
    if (!merchant) {
      onDone?.()
      return
    }
    if (!confirm(`Delete "${merchant.name}"? This cannot be undone.`)) return
    startTransition(async () => {
      try {
        await deleteQrphMerchant(merchant.id)
        toast.success('Merchant deleted')
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to delete')
      }
    })
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex flex-col gap-4 sm:flex-row">
        {/* QR preview + upload */}
        <div className="flex flex-col items-center gap-2">
          <div className="grid size-32 place-items-center overflow-hidden rounded-lg border border-border bg-white p-2">
            {qrImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={qrImageUrl || '/placeholder.svg'}
                alt={name ? `QR for ${name}` : 'QR preview'}
                className="h-full w-full object-contain"
              />
            ) : (
              <QrCode className="size-8 text-muted-foreground" />
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            className="hidden"
            onChange={(e) => onFile(e.target.files)}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
          >
            {uploading ? <Loader2 className="size-3.5 animate-spin" /> : <Upload className="size-3.5" />}
            {qrImageUrl ? 'Replace QR' : 'Upload QR'}
          </Button>
        </div>

        {/* Fields */}
        <div className="flex flex-1 flex-col gap-3">
          <div className="grid gap-3 sm:grid-cols-[1fr_120px]">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Merchant name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. IAN NAVIGAR"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Sort order</Label>
              <Input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">QR image URL (optional — or upload above)</Label>
            <Input
              value={qrImageUrl.startsWith('data:') ? '' : qrImageUrl}
              onChange={(e) => setQrImageUrl(e.target.value)}
              placeholder={qrImageUrl.startsWith('data:') ? 'Uploaded image in use' : 'https://…'}
              disabled={qrImageUrl.startsWith('data:')}
            />
            {qrImageUrl.startsWith('data:') && (
              <button
                type="button"
                onClick={() => setQrImageUrl('')}
                className="self-start text-xs text-primary hover:underline"
              >
                Clear uploaded image
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setActive((a) => !a)}
              className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium"
            >
              {active ? (
                <Eye className="size-4 text-primary" />
              ) : (
                <EyeOff className="size-4 text-muted-foreground" />
              )}
              {active ? 'Active on payment step' : 'Hidden from buyers'}
            </button>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={remove}
                disabled={pending}
              >
                <Trash2 className="size-3.5" />
                {merchant ? 'Delete' : 'Cancel'}
              </Button>
              <Button type="button" size="sm" className="gap-1.5" onClick={save} disabled={pending}>
                {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
                {merchant ? 'Save' : 'Add'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
