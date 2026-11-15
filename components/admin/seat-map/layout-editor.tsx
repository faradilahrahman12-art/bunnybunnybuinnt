'use client'

import { useRef, useState } from 'react'
import { Copy, ImageUp, MousePointer2, PenLine, Plus, Trash2, Undo2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import type { MapSection, SeatMapEvent, SectionKind, VenueMap } from '@/components/seat-map/types'

type Props = {
  layouts: VenueMap[]
  events: SeatMapEvent[]
  onCreate: (layout: VenueMap) => void
  onUpdate: (layout: VenueMap) => void
  onDelete: (id: string) => void
}

type Point = { x: number; y: number }

const CANVAS_WIDTH = 1000
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024

function newId(prefix: string) {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`
}

function polygonPath(points: Point[]) {
  return `M${points.map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join('L')}Z`
}

function centroid(points: Point[]): Point {
  const sum = points.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 })
  return { x: sum.x / points.length, y: sum.y / points.length }
}

export function LayoutEditor({ layouts, events, onCreate, onUpdate, onDelete }: Props) {
  const [activeId, setActiveId] = useState<string | null>(layouts[0]?.id ?? null)
  const [mode, setMode] = useState<'select' | 'draw'>('select')
  const [draft, setDraft] = useState<Point[]>([])
  const [newCode, setNewCode] = useState('')
  const [newKind, setNewKind] = useState<SectionKind>('seat')
  const [selectedCode, setSelectedCode] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const layout = layouts.find((l) => l.id === activeId) ?? null
  const selected = layout?.sections.find((s) => s.code === selectedCode) ?? null
  const usedBy = layout ? events.filter((e) => e.layoutId === layout.id) : []

  function resetEditing() {
    setMode('select')
    setDraft([])
    setSelectedCode(null)
    setError(null)
  }

  function createBlank() {
    const next: VenueMap = {
      id: newId('layout'),
      name: `New layout ${layouts.length + 1}`,
      viewBox: { width: CANVAS_WIDTH, height: 700 },
      backgroundImage: null,
      sections: [],
    }
    onCreate(next)
    setActiveId(next.id)
    resetEditing()
  }

  function duplicate() {
    if (!layout) return
    const next: VenueMap = { ...layout, id: newId('layout'), name: `${layout.name} (copy)`, sections: [...layout.sections] }
    onCreate(next)
    setActiveId(next.id)
    resetEditing()
  }

  function handleUpload(file: File | undefined) {
    if (!file || !layout) return
    if (!file.type.startsWith('image/')) return setError('Please choose an image file.')
    if (file.size > MAX_UPLOAD_BYTES) return setError('Image must be 5 MB or smaller.')
    const reader = new FileReader()
    reader.onload = () => {
      const src = String(reader.result)
      const image = new Image()
      image.onload = () => {
        const height = Math.round((CANVAS_WIDTH * image.naturalHeight) / image.naturalWidth)
        onUpdate({ ...layout, backgroundImage: src, viewBox: { width: CANVAS_WIDTH, height } })
        setError(null)
      }
      image.src = src
    }
    reader.readAsDataURL(file)
  }

  function toCanvasPoint(event: React.MouseEvent<SVGSVGElement>): Point | null {
    const svg = svgRef.current
    const matrix = svg?.getScreenCTM()
    if (!svg || !matrix) return null
    const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse())
    return { x: point.x, y: point.y }
  }

  function handleCanvasClick(event: React.MouseEvent<SVGSVGElement>) {
    if (mode !== 'draw') return
    const point = toCanvasPoint(event)
    if (point) setDraft((current) => [...current, point])
  }

  function finishSection() {
    if (!layout) return
    const code = newCode.trim().toUpperCase()
    if (!code) return setError('Enter a section number first.')
    if (!/^[A-Z0-9-]{1,12}$/.test(code)) return setError('Use letters, numbers or dashes only (max 12).')
    if (layout.sections.some((s) => s.code === code)) return setError(`Section ${code} already exists.`)
    if (draft.length < 3) return setError('Click at least 3 points to outline the section.')
    const center = centroid(draft)
    const section: MapSection = {
      code,
      kind: newKind,
      path: polygonPath(draft),
      labelX: center.x,
      labelY: center.y,
      labelSize: 16,
    }
    onUpdate({ ...layout, sections: [...layout.sections, section] })
    setDraft([])
    setNewCode('')
    setError(null)
    setSelectedCode(code)
  }

  function updateSelected(patch: Partial<MapSection>) {
    if (!layout || !selected) return
    if (patch.code !== undefined) {
      const code = patch.code.trim().toUpperCase()
      if (!code || layout.sections.some((s) => s.code === code && s !== selected)) return
      patch.code = code
    }
    onUpdate({ ...layout, sections: layout.sections.map((s) => (s === selected ? { ...s, ...patch } : s)) })
    if (patch.code) setSelectedCode(patch.code)
  }

  function deleteSelected() {
    if (!layout || !selected) return
    onUpdate({ ...layout, sections: layout.sections.filter((s) => s !== selected) })
    setSelectedCode(null)
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)_300px]">
      <section aria-labelledby="layouts-heading" className="flex flex-col gap-3 rounded-2xl border bg-card p-4">
        <div className="flex items-center justify-between">
          <h2 id="layouts-heading" className="font-semibold">Layouts</h2>
          <Button size="sm" variant="outline" onClick={createBlank}>
            <Plus className="size-4" aria-hidden="true" />
            New
          </Button>
        </div>
        <ul className="flex flex-col gap-1">
          {layouts.map((l) => (
            <li key={l.id}>
              <button
                type="button"
                onClick={() => {
                  setActiveId(l.id)
                  resetEditing()
                }}
                aria-current={l.id === activeId ? 'true' : undefined}
                className={cn(
                  'w-full rounded-lg px-3 py-2 text-left text-sm',
                  l.id === activeId ? 'bg-primary/12 font-semibold text-primary' : 'hover:bg-accent',
                )}
              >
                {l.name}
                <span className="block text-xs font-normal text-muted-foreground">
                  {l.sections.filter((s) => s.kind !== 'stage').length} sections
                </span>
              </button>
            </li>
          ))}
        </ul>
        <p className="text-xs text-muted-foreground">
          Layouts are reusable. Assign the same layout to several events in the Events tab.
        </p>
      </section>

      <section aria-label="Layout canvas" className="flex min-w-0 flex-col gap-3 rounded-2xl border bg-card p-4">
        {layout ? (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" variant={mode === 'select' ? 'default' : 'outline'} onClick={() => { setMode('select'); setDraft([]) }}>
                <MousePointer2 className="size-4" aria-hidden="true" />
                Select
              </Button>
              <Button size="sm" variant={mode === 'draw' ? 'default' : 'outline'} onClick={() => { setMode('draw'); setSelectedCode(null) }}>
                <PenLine className="size-4" aria-hidden="true" />
                Draw section
              </Button>
              <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()}>
                <ImageUp className="size-4" aria-hidden="true" />
                {layout.backgroundImage ? 'Replace image' : 'Upload venue image'}
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="sr-only"
                aria-label="Upload venue map image"
                onChange={(e) => {
                  handleUpload(e.target.files?.[0])
                  e.target.value = ''
                }}
              />
            </div>

            <div className="overflow-hidden rounded-xl border bg-muted/60">
              <svg
                ref={svgRef}
                viewBox={`0 0 ${layout.viewBox.width} ${layout.viewBox.height}`}
                className={cn('h-auto w-full select-none', mode === 'draw' && 'cursor-crosshair')}
                onClick={handleCanvasClick}
                role="img"
                aria-label={`${layout.name} layout editor canvas`}
              >
                {layout.backgroundImage && (
                  <image href={layout.backgroundImage} width={layout.viewBox.width} height={layout.viewBox.height} />
                )}
                {layout.sections.map((section) => (
                  <g key={section.code}>
                    <path
                      d={section.path}
                      className={cn(
                        'stroke-background',
                        section.kind === 'stage' ? 'fill-foreground/60' : 'fill-primary/45',
                        section.code === selectedCode && 'fill-[oklch(0.66_0.22_350)]/80',
                        mode === 'select' && 'cursor-pointer hover:fill-primary/70',
                      )}
                      strokeWidth={2}
                      onClick={(e) => {
                        if (mode !== 'select') return
                        e.stopPropagation()
                        setSelectedCode(section.code)
                      }}
                    />
                    <text
                      x={section.labelX}
                      y={section.labelY}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize={section.labelSize}
                      className="pointer-events-none fill-foreground font-semibold"
                    >
                      {section.code}
                    </text>
                  </g>
                ))}
                {draft.length > 0 && (
                  <g className="pointer-events-none">
                    <polyline
                      points={draft.map((p) => `${p.x},${p.y}`).join(' ')}
                      className="fill-[oklch(0.66_0.22_350)]/25 stroke-[oklch(0.66_0.22_350)]"
                      strokeWidth={2}
                      strokeDasharray="6 4"
                    />
                    {draft.map((p, i) => (
                      <circle key={i} cx={p.x} cy={p.y} r={5} className="fill-[oklch(0.66_0.22_350)]" />
                    ))}
                  </g>
                )}
              </svg>
            </div>
            <p className="text-xs text-muted-foreground">
              {mode === 'draw'
                ? 'Click around a section on the image to outline it, then name it and press Save section.'
                : 'Click a section to edit its number or type.'}
            </p>
          </>
        ) : (
          <p className="p-6 text-center text-sm text-muted-foreground">Create a layout to get started.</p>
        )}
      </section>

      <section aria-label="Layout details" className="flex flex-col gap-4 rounded-2xl border bg-card p-4">
        {layout && (
          <>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="layout-name">Layout name</Label>
              <Input id="layout-name" value={layout.name} onChange={(e) => onUpdate({ ...layout, name: e.target.value })} />
              <p className="text-xs text-muted-foreground">
                {usedBy.length ? `Used by ${usedBy.map((e) => e.name).join(', ')}` : 'Not assigned to any event'}
              </p>
            </div>

            {mode === 'draw' && (
              <div className="flex flex-col gap-3 rounded-xl border border-dashed p-3">
                <p className="text-sm font-semibold">New section</p>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="new-section-code">Section number</Label>
                  <Input id="new-section-code" value={newCode} onChange={(e) => setNewCode(e.target.value)} placeholder="e.g. 212" />
                </div>
                <KindSelect id="new-section-kind" value={newKind} onChange={setNewKind} />
                <p className="text-xs text-muted-foreground">{draft.length} points placed</p>
                <div className="flex gap-2">
                  <Button size="sm" onClick={finishSection} disabled={draft.length < 3}>
                    Save section
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setDraft((d) => d.slice(0, -1))} disabled={!draft.length}>
                    <Undo2 className="size-4" aria-hidden="true" />
                    <span className="sr-only">Undo last point</span>
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setDraft([])} disabled={!draft.length}>
                    Clear
                  </Button>
                </div>
              </div>
            )}

            {selected && mode === 'select' && (
              <div className="flex flex-col gap-3 rounded-xl border p-3">
                <p className="text-sm font-semibold">Edit section</p>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="edit-section-code">Section number</Label>
                  <Input
                    id="edit-section-code"
                    key={selected.code}
                    defaultValue={selected.code}
                    onBlur={(e) => updateSelected({ code: e.target.value })}
                  />
                </div>
                <KindSelect id="edit-section-kind" value={selected.kind} onChange={(kind) => updateSelected({ kind })} />
                <Button size="sm" variant="outline" onClick={deleteSelected} className="text-destructive">
                  <Trash2 className="size-4" aria-hidden="true" />
                  Delete section
                </Button>
              </div>
            )}

            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}

            <div className="mt-auto flex flex-col gap-2 border-t pt-4">
              <Button size="sm" variant="outline" onClick={duplicate}>
                <Copy className="size-4" aria-hidden="true" />
                Duplicate layout
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive"
                onClick={() => {
                  onDelete(layout.id)
                  setActiveId(layouts.find((l) => l.id !== layout.id)?.id ?? null)
                  resetEditing()
                }}
              >
                <Trash2 className="size-4" aria-hidden="true" />
                Delete layout
              </Button>
            </div>
          </>
        )}
      </section>
    </div>
  )
}

function KindSelect({ id, value, onChange }: { id: string; value: SectionKind; onChange: (kind: SectionKind) => void }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>Type</Label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value as SectionKind)}
        className="h-9 rounded-md border bg-background px-3 text-sm"
      >
        <option value="seat">Seated section</option>
        <option value="floor">Floor / standing</option>
        <option value="stage">Stage (not sellable)</option>
      </select>
    </div>
  )
}
