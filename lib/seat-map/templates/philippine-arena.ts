import type { MapSection, VenueMap } from '@/components/seat-map/types'

type Point = [number, number]

const WIDTH = 1000
const HEIGHT = 780
const CX = 500
const CY = 380
const BOWL_SQUARENESS = 2.6

const round = (n: number) => Math.round(n * 10) / 10

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

/** A point on a rounded-rectangle (superellipse) outline; 0 degrees is the right side and angles run clockwise. */
function bowlPoint(rx: number, ry: number, degrees: number): Point {
  const t = (degrees * Math.PI) / 180
  const c = Math.cos(t)
  const s = Math.sin(t)
  const e = 2 / BOWL_SQUARENESS
  return [CX + rx * Math.sign(c) * Math.abs(c) ** e, CY + ry * Math.sign(s) * Math.abs(s) ** e]
}

interface Tier {
  inner: [number, number]
  outer: [number, number]
  fromDegrees: number
  toDegrees: number
  firstNumber: number
  lastNumber: number
  labelSize: number
}

/** A horseshoe tier that opens toward the stage, split into seamless numbered wedges running clockwise. */
function tierSections({ inner, outer, fromDegrees, toDegrees, firstNumber, lastNumber, labelSize }: Tier): MapSection[] {
  const count = lastNumber - firstNumber + 1
  const step = (toDegrees - fromDegrees) / count
  return Array.from({ length: count }, (_, i) => {
    const start = fromDegrees + i * step
    const end = start + step
    const samples = 6
    const angles = Array.from({ length: samples + 1 }, (_, s) => start + ((end - start) * s) / samples)
    const points: Point[] = [
      ...angles.map((a) => bowlPoint(outer[0], outer[1], a)),
      ...[...angles].reverse().map((a) => bowlPoint(inner[0], inner[1], a)),
    ]
    const [labelX, labelY] = bowlPoint((inner[0] + outer[0]) / 2, (inner[1] + outer[1]) / 2, start + step / 2)
    return {
      code: String(firstNumber + i),
      kind: 'seat',
      path: toPath(points),
      labelX: Math.round(labelX),
      labelY: Math.round(labelY),
      labelSize,
    }
  })
}

/** End stage with a short thrust runway reaching into the floor. */
function stagePath() {
  return [
    toPath(clockwise([[372, 168], [628, 168], [628, 246], [372, 246]])),
    toPath(clockwise([[484, 246], [516, 246], [516, 318], [484, 318]])),
    toPath(clockwise([[462, 318], [538, 318], [538, 352], [462, 352]])),
  ].join(' ')
}

export const PHILIPPINE_ARENA_TEMPLATE_NAME = 'Philippine Arena (end stage)'

/**
 * End-stage layout for the Philippine Arena, Bulacan: a standing floor in front of the stage, then four horseshoe
 * tiers that open toward it — Lower Box 103-113 and 203-221, Upper Box 303-322 and 404-433.
 */
export function buildPhilippineArenaMap(id: string, name = PHILIPPINE_ARENA_TEMPLATE_NAME): VenueMap {
  const floor: MapSection = {
    code: 'FLOOR',
    kind: 'floor',
    path: toPath([[318, 262], [682, 262], [682, 488], [640, 528], [360, 528], [318, 488]]),
    labelX: 500,
    labelY: 440,
    labelSize: 22,
  }

  return {
    id,
    name,
    viewBox: { width: WIDTH, height: HEIGHT },
    backgroundImage: null,
    sections: [
      floor,
      { code: 'STAGE', kind: 'stage', path: stagePath(), labelX: 500, labelY: 207, labelSize: 22 },
      ...tierSections({
        inner: [232, 172], outer: [288, 214], fromDegrees: -18, toDegrees: 198,
        firstNumber: 103, lastNumber: 113, labelSize: 14,
      }),
      ...tierSections({
        inner: [296, 222], outer: [346, 264], fromDegrees: -32, toDegrees: 212,
        firstNumber: 203, lastNumber: 221, labelSize: 13,
      }),
      ...tierSections({
        inner: [354, 272], outer: [400, 314], fromDegrees: -42, toDegrees: 222,
        firstNumber: 303, lastNumber: 322, labelSize: 12,
      }),
      ...tierSections({
        inner: [408, 322], outer: [462, 370], fromDegrees: -50, toDegrees: 230,
        firstNumber: 404, lastNumber: 433, labelSize: 11,
      }),
    ],
  }
}
