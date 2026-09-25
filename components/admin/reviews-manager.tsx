'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Eye, EyeOff, ImagePlus, Loader2, Plus, Save, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createReview, deleteReview, updateReview } from '@/app/actions/reviews'
import { fileToCompressedDataUrl } from '@/lib/compress-image'
import type { Review } from '@/lib/db/schema'

export function ReviewsManager({ reviews }: { reviews: Review[] }) {
  const [adding, setAdding] = useState(false)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">Reviews</h2>
          <p className="text-sm text-muted-foreground">
            Add as many customer reviews as you like. Each has a name, an event subtitle, the review
            text, and any number of photos. Reordering uses the sort order field.
          </p>
        </div>
        <Button className="gap-1.5" onClick={() => setAdding((a) => !a)}>
          <Plus className="size-4" />
          Add Review
        </Button>
      </div>

      {adding && <ReviewForm onDone={() => setAdding(false)} />}

      <div className="flex flex-col gap-3">
        {reviews.length === 0 && !adding && (
          <p className="rounded-xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
            No reviews yet. Click “Add Review” to create one.
          </p>
        )}
        {reviews.map((r) => (
          <ReviewForm key={r.id} review={r} />
        ))}
      </div>
    </div>
  )
}

function ReviewForm({ review, onDone }: { review?: Review; onDone?: () => void }) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [pending, startTransition] = useTransition()
  const [uploading, setUploading] = useState(false)
  const [name, setName] = useState(review?.name ?? '')
  const [event, setEvent] = useState(review?.event ?? '')
  const [text, setText] = useState(review?.text ?? '')
  const [images, setImages] = useState<string[]>(review?.images ?? [])
  const [hidden, setHidden] = useState(review?.hidden ?? false)
  const [sortOrder, setSortOrder] = useState(review?.sortOrder ?? 0)

  async function onFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    setUploading(true)
    try {
      const added: string[] = []
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) continue
        const dataUrl = await fileToCompressedDataUrl(file, {
          maxSize: 900,
          quality: 0.82,
          mime: 'image/jpeg',
        })
        added.push(dataUrl)
      }
      if (added.length) setImages((prev) => [...prev, ...added])
    } catch {
      toast.error('Could not process one of those images')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  function removeImage(idx: number) {
    setImages((prev) => prev.filter((_, i) => i !== idx))
  }

  function save() {
    if (!name.trim()) {
      toast.error('Name is required')
      return
    }
    if (!text.trim()) {
      toast.error('Review text is required')
      return
    }
    startTransition(async () => {
      try {
        const input = { name, event, text, images, hidden, sortOrder }
        if (review) {
          await updateReview(review.id, input)
          toast.success('Review updated')
        } else {
          await createReview(input)
          toast.success('Review added')
        }
        router.refresh()
        onDone?.()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to save')
      }
    })
  }

  function remove() {
    if (!review) {
      onDone?.()
      return
    }
    if (!confirm(`Delete the review from "${review.name}"? This cannot be undone.`)) return
    startTransition(async () => {
      try {
        await deleteReview(review.id)
        toast.success('Review deleted')
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to delete')
      }
    })
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex flex-col gap-3">
        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_120px]">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Angel" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">Event / subtitle</Label>
            <Input
              value={event}
              onChange={(e) => setEvent(e.target.value)}
              placeholder="e.g. BTS World Tour in Goyang"
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
          <Label className="text-xs">Review text</Label>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="What the customer said…"
            rows={4}
          />
        </div>

        {/* Photos */}
        <div className="flex flex-col gap-2">
          <Label className="text-xs">Photos</Label>
          <div className="flex flex-wrap gap-2">
            {images.map((src, i) => (
              <div
                key={i}
                className="group relative size-20 overflow-hidden rounded-lg border border-border bg-muted"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src || '/placeholder.svg'} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute right-1 top-1 grid size-5 place-items-center rounded-full bg-background/90 text-foreground shadow transition hover:bg-destructive hover:text-white"
                  aria-label={`Remove photo ${i + 1}`}
                >
                  <X className="size-3" />
                </button>
              </div>
            ))}
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
              disabled={uploading}
              className="grid size-20 place-items-center rounded-lg border border-dashed border-border bg-background text-muted-foreground transition hover:border-primary hover:text-primary disabled:opacity-60"
              aria-label="Add photos"
            >
              {uploading ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <ImagePlus className="size-5" />
              )}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <button
            type="button"
            onClick={() => setHidden((h) => !h)}
            className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium"
          >
            {hidden ? (
              <EyeOff className="size-4 text-muted-foreground" />
            ) : (
              <Eye className="size-4 text-primary" />
            )}
            {hidden ? 'Hidden from site' : 'Visible on site'}
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
              {review ? 'Delete' : 'Cancel'}
            </Button>
            <Button type="button" size="sm" className="gap-1.5" onClick={save} disabled={pending}>
              {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
              {review ? 'Save' : 'Add'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
