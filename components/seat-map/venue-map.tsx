'use client'

import { useRef, useState } from 'react'
import { Minus, Plus, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatMoney, sectionName, type MapSection, type VenueMap as VenueMapData } from './types'

export type SectionSummary = { minPrice: number; available: number; currency: string }

type Props = {
  map: VenueMapData
  summaries: Map<string, SectionSummary>
  soldOutCodes?: Set<string>
  selectedCode: string | null
  onSelect: (code: string | null) => void
}

const MIN_SCALE = 1
const MAX_SCALE = 4
const DRAG_THRESHOLD = 5

type View = { scale: number; x: number; y: number }
const INITIAL_VIEW: View = { scale: 1, x: 0, y: 0 }

export function VenueMap({ map, summaries, soldOutCodes, selectedCode, onSelect }: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [view, setView] = useState<View>(INITIAL_VIEW)
  const [hover, setHover] = useState<{ code: string; x: number; y: number } | null>(null)
  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const gesture = useRef<{ moved: boolean; pinchDistance: number | null }>({ moved: false, pinchDistance: null })

  const { width, height } = map.viewBox

  function toSvgPoint(clientX: number, clientY: number) {
    const svg = svgRef.current
    if (!svg) return { x: width / 2, y: height / 2 }
    const rect = svg.getBoundingClientRect()
    const ratio = Math.max(width / rect.width, height / rect.height)
    const offsetX = (rect.width * ratio - width) / 2
    const offsetY = (rect.height * ratio - height) / 2
    return { x: (clientX - rect.left) * ratio - offsetX, y: (clientY - rect.top) * ratio - offsetY }
  }

  function clampView(next: View): View {
    const scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, next.scale))
    const minX = width - width * scale
    const minY = height - height * scale
    return { scale, x: Math.min(0, Math.max(minX, next.x)), y: Math.min(0, Math.max(minY, next.y)) }
  }

  function zoomAt(factor: number, focus: { x: number; y: number }) {
    setView((current) => {
      const scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, current.scale * factor))
      const applied = scale / current.scale
      return clampView({
        scale,
        x: focus.x - (focus.x - current.x) * applied,
        y: focus.y - (focus.y - current.y) * applied,
      })
    })
  }

  function svgUnitsPerPixel() {
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return 1
    return Math.max(width / rect.width, height / rect.height)
  }

  function handleWheel(event: React.WheelEvent) {
    if (!event.ctrlKey && !event.metaKey && view.scale === 1 && event.deltaY > 0) return
    zoomAt(event.deltaY < 0 ? 1.15 : 1 / 1.15, toSvgPoint(event.clientX, event.clientY))
  }

  function handlePointerDown(event: React.PointerEvent) {
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
    gesture.current.moved = false
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()]
      gesture.current.pinchDistance = Math.hypot(a.x - b.x, a.y - b.y)
    }
  }

  function handlePointerMove(event: React.PointerEvent) {
    const previous = pointers.current.get(event.pointerId)
    if (!previous) return
    const dx = event.clientX - previous.x
    const dy = event.clientY - previous.y
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY })

    if (pointers.current.size === 2 && gesture.current.pinchDistance) {
      const [a, b] = [...pointers.current.values()]
      const distance = Math.hypot(a.x - b.x, a.y - b.y)
      gesture.current.moved = true
      zoomAt(distance / gesture.current.pinchDistance, toSvgPoint((a.x + b.x) / 2, (a.y + b.y) / 2))
      gesture.current.pinchDistance = distance
      return
    }

    if (!gesture.current.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return
    if (view.scale === 1) return
    if (!gesture.current.moved) {
      gesture.current.moved = true
      ;(event.currentTarget as Element).setPointerCapture(event.pointerId)
    }
    const units = svgUnitsPerPixel()
    setHover(null)
    setView((current) => clampView({ ...current, x: current.x + dx * units, y: current.y + dy * units }))
  }

  function handlePointerUp(event: React.PointerEvent) {
    pointers.current.delete(event.pointerId)
    if (pointers.current.size < 2) gesture.current.pinchDistance = null
  }

  function selectSection(section: MapSection) {
    if (gesture.current.moved) return
    if (!summaries.has(section.code)) return
    onSelect(selectedCode === section.code ? null : section.code)
  }

  function showHover(event: React.PointerEvent, code: string) {
    if (event.pointerType !== 'mouse') return
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    setHover({ code, x: event.clientX - rect.left, y: event.clientY - rect.top })
  }

  const hoveredSummary = hover ? summaries.get(hover.code) : undefined
  const pinSections = map.sections.filter((section) => summaries.has(section.code))

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden rounded-2xl bg-muted/60">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        className="h-full w-full touch-none select-none"
        role="group"
        aria-label={`${map.name} seat map. Use Tab to move between available sections and Enter to select.`}
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerLeave={() => setHover(null)}
      >
        <g transform={`translate(${view.x} ${view.y}) scale(${view.scale})`}>
          {map.backgroundImage && (
            <image
              href={map.backgroundImage}
              x={0}
              y={0}
              width={width}
              height={height}
              preserveAspectRatio="xMidYMid meet"
              opacity={0.55}
              aria-hidden="true"
            />
          )}
          {map.sections.map((section) => {
            const summary = summaries.get(section.code)
            const isAvailable = Boolean(summary)
            const isSelected = selectedCode === section.code
            const isStage = section.kind === 'stage'
            const label = isStage
              ? section.code.toLowerCase()
              : isAvailable
                ? `${sectionName(section.code)}, from ${formatMoney(summary!.minPrice, summary!.currency)}, ${summary!.available} tickets left${isSelected ? ', selected' : ''}`
                : `${sectionName(section.code)}, ${soldOutCodes?.has(section.code) ? 'sold out' : 'no tickets available'}`

            return (
              <g key={section.code}>
                <path
                  d={section.path}
                  role={isAvailable ? 'button' : 'img'}
                  tabIndex={isAvailable ? 0 : undefined}
                  aria-label={label}
                  aria-pressed={isAvailable ? isSelected : undefined}
                  className={cn(
                    'stroke-background outline-none transition-[fill] duration-150',
                    isStage && 'fill-muted-foreground',
                    !isStage && !isAvailable && 'fill-foreground/10',
                    isAvailable && !isSelected && 'cursor-pointer fill-primary/55 hover:fill-primary/80 focus-visible:fill-primary/80',
                    isSelected && 'cursor-pointer fill-[oklch(0.66_0.22_350)]',
                  )}
                  strokeWidth={isSelected ? 4 : 2}
                  onClick={() => selectSection(section)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      selectSection(section)
                    }
                  }}
                  onPointerEnter={(event) => isAvailable && showHover(event, section.code)}
                  onPointerMove={(event) => isAvailable && showHover(event, section.code)}
                  onPointerLeave={() => setHover(null)}
                />
                <text
                  x={section.labelX}
                  y={section.labelY}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={section.labelSize}
                  className={cn(
                    'pointer-events-none font-semibold',
                    isStage ? 'fill-background' : isAvailable ? 'fill-foreground' : 'fill-foreground/40',
                  )}
                >
                  {section.code}
                </text>
              </g>
            )
          })}

          {view.scale >= 1 &&
            pinSections.map((section) => {
              const summary = summaries.get(section.code)!
              const isSelected = selectedCode === section.code
              const pinScale = 1 / Math.sqrt(view.scale)
              return (
                <g
                  key={`pin-${section.code}`}
                  transform={`translate(${section.labelX} ${section.labelY - section.labelSize - 6}) scale(${pinScale})`}
                  className="pointer-events-none"
                  aria-hidden="true"
                >
                  <rect
                    x={-46}
                    y={-38}
                    width={92}
                    height={34}
                    rx={8}
                    className={cn(isSelected ? 'fill-[oklch(0.66_0.22_350)]' : 'fill-card', 'stroke-border')}
                    strokeWidth={1}
                  />
                  <text
                    y={-25}
                    textAnchor="middle"
                    fontSize={11}
                    className={cn('font-bold', isSelected ? 'fill-white' : 'fill-foreground')}
                  >
                    {formatMoney(summary.minPrice, summary.currency)}
                  </text>
                  <text
                    y={-11}
                    textAnchor="middle"
                    fontSize={10}
                    className={cn('font-semibold', isSelected ? 'fill-white' : 'fill-[oklch(0.58_0.22_350)]')}
                  >
                    {summary.available} left
                  </text>
                </g>
              )
            })}
        </g>
      </svg>

      {hover && hoveredSummary && (
        <div
          className="pointer-events-none absolute z-10 rounded-lg border bg-popover px-3 py-2 text-sm text-popover-foreground shadow-lg"
          style={{ left: hover.x + 14, top: hover.y + 14 }}
          role="tooltip"
        >
          <p className="font-semibold">{sectionName(hover.code)}</p>
          <p className="text-muted-foreground">
            From {formatMoney(hoveredSummary.minPrice, hoveredSummary.currency)} · {hoveredSummary.available} left
          </p>
        </div>
      )}

      <div className="absolute right-3 top-3 flex flex-col overflow-hidden rounded-xl border bg-card shadow-sm">
        <MapButton label="Zoom in" onClick={() => zoomAt(1.4, { x: width / 2, y: height / 2 })} disabled={view.scale >= MAX_SCALE}>
          <Plus className="size-4" aria-hidden="true" />
        </MapButton>
        <MapButton label="Zoom out" onClick={() => zoomAt(1 / 1.4, { x: width / 2, y: height / 2 })} disabled={view.scale <= MIN_SCALE}>
          <Minus className="size-4" aria-hidden="true" />
        </MapButton>
        <MapButton label="Reset view" onClick={() => setView(INITIAL_VIEW)} disabled={view.scale === 1}>
          <RotateCcw className="size-4" aria-hidden="true" />
        </MapButton>
      </div>

      <div className="absolute bottom-3 left-3 flex flex-wrap items-center gap-3 rounded-xl border bg-card/90 px-3 py-2 text-xs backdrop-blur">
        <LegendSwatch className="bg-primary/55" label="Available" />
        <LegendSwatch className="bg-[oklch(0.66_0.22_350)]" label="Selected" />
        <LegendSwatch className="bg-foreground/10" label="Sold out / unavailable" />
      </div>
    </div>
  )
}

function MapButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string
  onClick: () => void
  disabled: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className="flex size-9 items-center justify-center border-b last:border-b-0 hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-40"
    >
      {children}
    </button>
  )
}

function LegendSwatch({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={cn('size-3 rounded-sm', className)} aria-hidden="true" />
      {label}
    </span>
  )
}
