import type { MapSection, SectionKind, VenueMap } from '@/components/seat-map/types'

type Point = [number, number]
type Radii = [number, number]

const WIDTH = 1060
const HEIGHT = 1160
const CX = 530
const CY = 590

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

function circlePath(cx: number, cy: number, r: number) {
  return `M${cx - r} ${cy}A${r} ${r} 0 1 1 ${cx + r} ${cy}A${r} ${r} 0 1 1 ${cx - r} ${cy}Z`
}

/**
 * Where a ray from the centre meets a superellipse ring. Angles are screen degrees (0 east, 90 south, 180 west,
 * 270 north) so section spans can be read straight off the venue's own map; a higher exponent squares the ring.
 */
function ringPoint([rx, ry]: Radii, exponent: number, degrees: number): Point {
  const t = (degrees * Math.PI) / 180
  const c = Math.cos(t)
  const s = Math.sin(t)
  const r = 1 / ((Math.abs(c) / rx) ** exponent + (Math.abs(s) / ry) ** exponent) ** (1 / exponent)
  return [CX + r * c, CY + r * s]
}

interface Ring {
  inner: Radii
  outer: Radii
  exponent: number
}

/** Rings, innermost first. Each grows deeper at the two ends of the bowl, as the venue's upper tiers do. */
const RING_1: Ring = { inner: [360, 215], outer: [420, 285], exponent: 4 }
const RING_2: Ring = { inner: [425, 290], outer: [470, 410], exponent: 3.2 }
const RING_3: Ring = { inner: [474, 415], outer: [500, 520], exponent: 3 }
const OUTER_BOXES: Ring = { inner: [506, 528], outer: [520, 546], exponent: 3 }

/** Sections in clockwise order on screen, from the boundary angle `from` to `to`. */
function arcSections(ring: Ring, codes: string[], from: number, to: number, labelSize: number): MapSection[] {
  const { inner, outer, exponent } = ring
  const step = (to - from) / codes.length
  const mid: Radii = [(inner[0] + outer[0]) / 2, (inner[1] + outer[1]) / 2]
  return codes.map((code, i) => {
    const start = from + i * step
    const samples = 6
    const angles = Array.from({ length: samples + 1 }, (_, s) => start + (step * s) / samples)
    const points: Point[] = [
      ...angles.map((a) => ringPoint(outer, exponent, a)),
      ...[...angles].reverse().map((a) => ringPoint(inner, exponent, a)),
    ]
    const [labelX, labelY] = ringPoint(mid, exponent, start + step / 2)
    return { code, kind: 'seat', path: toPath(points), labelX: Math.round(labelX), labelY: Math.round(labelY), labelSize }
  })
}

const lettered = (prefix: string, count: number) =>
  Array.from({ length: count }, (_, i) => `${prefix}${String.fromCharCode(65 + i)}`)

function rect(code: string, x: number, y: number, w: number, h: number, labelSize = 14, kind: SectionKind = 'floor'): MapSection {
  return {
    code,
    kind,
    path: toPath([[x, y], [x + w, y], [x + w, y + h], [x, y + h]]),
    labelX: Math.round(x + w / 2),
    labelY: Math.round(y + h / 2),
    labelSize,
  }
}

/** A left-hand floor block and its right-hand twin. */
function pair(left: string, right: string, x: number, y: number, w: number, h: number, labelSize = 14) {
  return [rect(left, x, y, w, h, labelSize), rect(right, WIDTH - x - w, y, w, h, labelSize)]
}

function row(codes: string[], y: number, h: number, labelSize = 14) {
  return codes.map((code, i) => rect(code, 355 + i * 72, y, 62, h, labelSize))
}

function floorBlocks(): MapSection[] {
  return [
    ...pair('A16', 'A10', 305, 393, 40, 40, 11),
    ...row(['A15', 'A14', 'A13', 'A12', 'A11'], 368, 68),
    ...row(['V11', 'V10', 'V9', 'V8', 'V7'], 440, 57, 12),
    ...pair('A17', 'A9', 224, 455, 80, 30, 12),
    ...pair('A18', 'A8', 190, 498, 122, 56),
    ...pair('A19', 'A7', 190, 566, 122, 56),
    ...pair('A20', 'A6', 190, 634, 122, 56),
    ...pair('V12', 'V6', 316, 516, 54, 37, 12),
    ...pair('V13', 'V5', 316, 566, 106, 56),
    ...pair('V14', 'V4', 316, 634, 54, 37, 12),
    ...pair('A21', 'A5', 222, 703, 82, 34, 12),
    rect('V15', 355, 720, 62, 30, 12),
    ...row(['V15', 'V16', 'V1', 'V2', 'V3'], 690, 60, 12).slice(1, 4),
    rect('V3', 643, 720, 62, 30, 12),
    ...row(['A23', 'A24', 'A1', 'A2', 'A3'], 752, 56),
    ...pair('A22', 'A4', 305, 748, 38, 38, 11),
  ]
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

const lerp = (a: Point, b: Point, t: number): Point => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]

/** Round centre stage with four catwalks out to the corners of the floor, each widening into a B-stage halfway. */
function stagePath() {
  const centre: Point = [CX, CY]
  const corner: Point = [292, 445]
  const ends = [corner, mirrorX(corner), mirrorY(corner), mirrorY(mirrorX(corner))]
  return [
    circlePath(CX, CY, 60),
    ...ends.flatMap((end) => [
      bar(centre, end, 11),
      bar(lerp(centre, end, 0.42), lerp(centre, end, 0.62), 24),
      bar(lerp(centre, end, 0.47), lerp(centre, end, 0.57), 34),
    ]),
  ].join(' ')
}

/** Small boxes outside the upper tier, placed at the angle each sits at on the venue map. */
function outerBoxes(): MapSection[] {
  const boxes: [string, number][] = [
    ['W2', 247], ['W4', 259], ['W5', 281], ['W7', 289],
    ['N4', 12], ['N5', 24],
    ['E2', 66], ['E4', 77], ['E6', 103], ['E8', 113],
  ]
  return boxes.flatMap(([code, angle]) => arcSections(OUTER_BOXES, [code], angle - 2.5, angle + 2.5, 8))
}

export const RAJAMANGALA_STADIUM_TEMPLATE_NAME = 'Rajamangala National Stadium (X stage)'

/**
 * Rajamangala National Stadium, Bangkok, in the round: a centre stage with an X of catwalks, floor blocks A1–A24
 * and V1–V16, a lower ring (W1, N1, E1, S1), a second ring (W2, N2, E2, S2), an upper tier at the two ends
 * (W3, E3) and the small outer boxes.
 */
export function buildRajamangalaStadiumMap(id: string, name = RAJAMANGALA_STADIUM_TEMPLATE_NAME): VenueMap {
  return {
    id,
    name,
    viewBox: { width: WIDTH, height: HEIGHT },
    backgroundImage: null,
    sections: [
      ...floorBlocks(),
      { code: 'STAGE', kind: 'stage', path: stagePath(), labelX: CX, labelY: CY, labelSize: 20 },
      ...arcSections(RING_1, lettered('W1', 19), 212, 328, 10),
      ...arcSections(RING_1, lettered('N1', 12), 328, 392, 10),
      ...arcSections(RING_1, lettered('E1', 19), 32, 148, 10),
      ...arcSections(RING_1, lettered('S1', 12), 148, 212, 10),
      ...arcSections(RING_2, lettered('W2', 22), 212, 328, 10),
      ...arcSections(RING_2, lettered('N2', 12), 328, 392, 10),
      ...arcSections(RING_2, lettered('E2', 22), 32, 148, 10),
      ...arcSections(RING_2, lettered('S2', 12), 148, 212, 10),
      ...arcSections(RING_3, lettered('W3', 18), 222, 318, 11),
      ...arcSections(RING_3, lettered('E3', 20), 40, 140, 11),
      ...outerBoxes(),
    ],
  }
}
