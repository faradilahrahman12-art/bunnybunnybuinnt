import type { MapSection, SectionKind, VenueMap } from '@/components/seat-map/types'

type Point = [number, number]
type Radii = [number, number]

const WIDTH = 1000
const HEIGHT = 760
const CX = 500
const CY = 380
const BOWL_SQUARENESS = 2.8

const round = (n: number) => Math.round(n * 10) / 10
const mirrorX = ([x, y]: Point): Point => [WIDTH - x, y]
const mirrorY = ([x, y]: Point): Point => [x, 2 * CY - y]

/** Every stage sub-shape is wound the same way so overlapping parts merge instead of punching holes. */
function clockwise(points: Point[]): Point[] {
  let area = 0
  for (let i = 0; i < points.length; i++) {
    const [x1, y1] = points[i]
    const [x2, y2] = points[(i + 1) % points.length]
    area += x1 * y2 - x2 * y1
  }
  return area < 0 ? [...points].reverse() : points
}

function toPath(points: Point[]) {
  return `M${points.map(([x, y]) => `${round(x)} ${round(y)}`).join('L')}Z`
}

function ellipsePath(cx: number, cy: number, rx: number, ry: number) {
  return `M${cx - rx} ${cy}A${rx} ${ry} 0 1 1 ${cx + rx} ${cy}A${rx} ${ry} 0 1 1 ${cx - rx} ${cy}Z`
}

/** A point on the rounded oval bowl. Angles are screen degrees: 0 east, 90 south, 180 west, 270 north. */
function bowlPoint([rx, ry]: Radii, degrees: number): Point {
  const t = (degrees * Math.PI) / 180
  const c = Math.cos(t)
  const s = Math.sin(t)
  const e = 2 / BOWL_SQUARENESS
  return [CX + rx * Math.sign(c) * Math.abs(c) ** e, CY + ry * Math.sign(s) * Math.abs(s) ** e]
}

interface Arc {
  codes: string[]
  inner: Radii
  outer: Radii
  /** Boundary angle of the first code; numbering runs anticlockwise on screen, as on the venue's own map. */
  from: number
  to: number
  labelSize: number
}

function arcSections({ codes, inner, outer, from, to, labelSize }: Arc): MapSection[] {
  const step = (from - to) / codes.length
  const mid: Radii = [(inner[0] + outer[0]) / 2, (inner[1] + outer[1]) / 2]
  return codes.map((code, i) => {
    const start = from - i * step
    const samples = 5
    const angles = Array.from({ length: samples + 1 }, (_, s) => start - (step * s) / samples)
    const points: Point[] = [
      ...angles.map((a) => bowlPoint(outer, a)),
      ...[...angles].reverse().map((a) => bowlPoint(inner, a)),
    ]
    const [labelX, labelY] = bowlPoint(mid, start - step / 2)
    return { code, kind: 'seat', path: toPath(points), labelX: Math.round(labelX), labelY: Math.round(labelY), labelSize }
  })
}

const range = (first: number, last: number) => Array.from({ length: last - first + 1 }, (_, i) => String(first + i))

function rect(code: string, x: number, y: number, w: number, h: number, labelSize = 12, kind: SectionKind = 'floor'): MapSection {
  return {
    code,
    kind,
    path: toPath([[x, y], [x + w, y], [x + w, y + h], [x, y + h]]),
    labelX: Math.round(x + w / 2),
    labelY: Math.round(y + h / 2),
    labelSize,
  }
}

/** Mirror a left-hand pen to the right-hand side of the field. */
function mirroredRect(code: string, x: number, y: number, w: number, h: number, labelSize = 12) {
  return rect(code, WIDTH - x - w, y, w, h, labelSize)
}

function column(codes: string[], x: number, top: number, w: number, h: number, gap: number, side: 'left' | 'right') {
  return codes.map((code, i) =>
    side === 'left' ? rect(code, x, top + i * (h + gap), w, h) : mirroredRect(code, x, top + i * (h + gap), w, h),
  )
}

function row(codes: string[], left: number, y: number, w: number, h: number, gap: number) {
  return codes.map((code, i) => rect(code, left + i * (w + gap), y, w, h))
}

/** A bar of the given half-width running between two points. */
function bar(a: Point, b: Point, halfWidth: number) {
  const length = Math.hypot(b[0] - a[0], b[1] - a[1])
  const px = (-(b[1] - a[1]) / length) * halfWidth
  const py = ((b[0] - a[0]) / length) * halfWidth
  return toPath(
    clockwise([
      [a[0] + px, a[1] + py],
      [b[0] + px, b[1] + py],
      [b[0] - px, b[1] - py],
      [a[0] - px, a[1] - py],
    ]),
  )
}

/** Oval centre stage with an X of four catwalks reaching out to the corners of the floor. */
function stagePath() {
  const corner: Point = [300, 262]
  const ends = [corner, mirrorX(corner), mirrorY(corner), mirrorY(mirrorX(corner))]
  return [ellipsePath(CX, CY, 72, 50), ...ends.map((end) => bar([CX, CY], end, 8))].join(' ')
}

function floorPens(): MapSection[] {
  return [
    ...row(['PA14', 'PA13', 'PA12', 'PA11', 'PA10', 'PA9', 'PA8'], 310, 205, 50, 35, 5),
    ...row(['PA7', 'PA6', 'PA5', 'PA4', 'PA3', 'PA2', 'PA1'], 362, 246, 36, 32, 4),
    ...row(['PC1', 'PC2', 'PC3', 'PC4', 'PC5', 'PC6', 'PC7'], 362, 482, 36, 32, 4),
    ...row(['PC8', 'PC9', 'PC10', 'PC11', 'PC12', 'PC13', 'PC14'], 310, 520, 50, 35, 5),
    ...column(['PD9', 'PD10', 'PD11', 'PD12', 'PD13'], 230, 250, 52, 48, 5, 'left'),
    ...column(['PD4', 'PD5', 'PD6', 'PD7', 'PD8'], 288, 300, 44, 29, 4, 'left'),
    ...column(['PD1', 'PD2', 'PD3'], 345, 330, 50, 30, 5, 'left'),
    ...column(['PB13', 'PB12', 'PB11', 'PB10', 'PB9'], 230, 250, 52, 48, 5, 'right'),
    ...column(['PB8', 'PB7', 'PB6', 'PB5', 'PB4'], 288, 300, 44, 29, 4, 'right'),
    ...column(['PB3', 'PB2', 'PB1'], 345, 330, 50, 30, 5, 'right'),
  ]
}

const LOWER_BOWL = [
  ...range(101, 106), '107A', '107B', ...range(109, 117), '119A', '119B', ...range(120, 131),
  '132A', '132B', ...range(134, 142), '144A', '144B', ...range(145, 150),
]

export const SINGAPORE_NATIONAL_STADIUM_TEMPLATE_NAME = 'Singapore National Stadium (X stage)'

/**
 * Singapore National Stadium in-the-round layout: a centre stage with an X of catwalks, floor pens PA, PB, PC and
 * PD around it, the 100 and 200 levels as full rings, the 400 level around all but the west end and the 600 level
 * along the two long sides.
 */
export function buildSingaporeNationalStadiumMap(id: string, name = SINGAPORE_NATIONAL_STADIUM_TEMPLATE_NAME): VenueMap {
  return {
    id,
    name,
    viewBox: { width: WIDTH, height: HEIGHT },
    backgroundImage: null,
    sections: [
      ...floorPens(),
      { code: 'STAGE', kind: 'stage', path: stagePath(), labelX: CX, labelY: CY, labelSize: 20 },
      ...arcSections({ codes: LOWER_BOWL, inner: [315, 215], outer: [370, 262], from: 180, to: -180, labelSize: 12 }),
      ...arcSections({ codes: range(201, 250), inner: [374, 266], outer: [400, 290], from: 180, to: -180, labelSize: 9 }),
      ...arcSections({ codes: range(405, 446), inner: [404, 294], outer: [446, 332], from: 150, to: -152, labelSize: 11 }),
      ...arcSections({ codes: range(606, 620), inner: [450, 336], outer: [490, 372], from: 141, to: 33, labelSize: 11 }),
      ...arcSections({ codes: range(631, 645), inner: [450, 336], outer: [490, 372], from: -33, to: -141, labelSize: 11 }),
    ],
  }
}
