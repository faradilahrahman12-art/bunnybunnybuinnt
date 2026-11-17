import type { MapSection, SectionKind, VenueMap } from '@/components/seat-map/types'

type Point = [number, number]

const WIDTH = 1000
const HEIGHT = 760
const CX = 500
const CY = 380
const STAGE_RADIUS = 58

const round = (n: number) => Math.round(n * 10) / 10

function toPath(points: Point[]) {
  return `M${points.map(([x, y]) => `${round(x)} ${round(y)}`).join('L')}Z`
}

function circlePath(cx: number, cy: number, r: number) {
  return `M${cx - r} ${cy}A${r} ${r} 0 1 0 ${cx + r} ${cy}A${r} ${r} 0 1 0 ${cx - r} ${cy}Z`
}

function centroid(points: Point[]): Point {
  const [sx, sy] = points.reduce(([ax, ay], [x, y]) => [ax + x, ay + y], [0, 0])
  return [Math.round(sx / points.length), Math.round(sy / points.length)]
}

function ellipsePoint(rx: number, ry: number, degrees: number): Point {
  const t = (degrees * Math.PI) / 180
  return [CX + rx * Math.cos(t), CY + ry * Math.sin(t)]
}

interface Ring {
  inner: [number, number]
  outer: [number, number]
  count: number
  firstNumber: number
  labelSize: number
}

/** Splits an elliptical seating bowl into numbered wedges, clockwise from the top centre. */
function ringSections({ inner, outer, count, firstNumber, labelSize }: Ring): MapSection[] {
  const step = 360 / count
  const gap = 0.7
  return Array.from({ length: count }, (_, i) => {
    const start = -90 - step / 2 + i * step + gap
    const end = start + step - gap * 2
    const samples = 4
    const angles = Array.from({ length: samples + 1 }, (_, s) => start + ((end - start) * s) / samples)
    const points: Point[] = [
      ...angles.map((a) => ellipsePoint(outer[0], outer[1], a)),
      ...angles.reverse().map((a) => ellipsePoint(inner[0], inner[1], a)),
    ]
    const mid = start + (end - start) / 2
    const [labelX, labelY] = ellipsePoint((inner[0] + outer[0]) / 2, (inner[1] + outer[1]) / 2, mid)
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

function zone(code: string, points: Point[], kind: SectionKind = 'floor', labelSize = 16): MapSection {
  const [labelX, labelY] = centroid(points)
  return { code, kind, path: toPath(points), labelX, labelY, labelSize }
}

/** Four catwalks run from the round stage toward the corners of the field, each ending in a small platform. */
function stagePath() {
  const reach: Point = [176, 132]
  const length = Math.hypot(...reach)
  const halfWidth = 7
  const parts = [circlePath(CX, CY, STAGE_RADIUS)]
  for (const [sx, sy] of [[1, -1], [1, 1], [-1, 1], [-1, -1]] as const) {
    const dx = (reach[0] * sx) / length
    const dy = (reach[1] * sy) / length
    const px = -dy * halfWidth
    const py = dx * halfWidth
    const startX = CX + dx * (STAGE_RADIUS - 2)
    const startY = CY + dy * (STAGE_RADIUS - 2)
    const endX = CX + reach[0] * sx
    const endY = CY + reach[1] * sy
    parts.push(
      toPath([
        [startX + px, startY + py],
        [endX + px, endY + py],
        [endX - px, endY - py],
        [startX - px, startY - py],
      ]),
      circlePath(endX, endY, 16),
    )
  }
  return parts.join(' ')
}

export const PHILIPPINE_SPORTS_STADIUM_TEMPLATE_NAME = 'Philippine Sports Stadium (360 stage)'

/**
 * In-the-round stadium layout for the Philippine Sports Stadium, Bulacan: a central 360-degree stage with four
 * diagonal catwalks, four standing floor zones, a lower bowl (Bleachers 1) and an upper bowl (Bleachers 2).
 */
export function buildPhilippineSportsStadiumMap(id: string, name = PHILIPPINE_SPORTS_STADIUM_TEMPLATE_NAME): VenueMap {
  const floorZones = [
    zone('FLOOR A', [[316, 230], [684, 230], [556, 318], [444, 318]]),
    zone('FLOOR B', [[700, 244], [700, 516], [575, 418], [575, 342]]),
    zone('FLOOR C', [[684, 530], [316, 530], [444, 442], [556, 442]]),
    zone('FLOOR D', [[300, 516], [300, 244], [425, 342], [425, 418]]),
  ]

  return {
    id,
    name,
    viewBox: { width: WIDTH, height: HEIGHT },
    backgroundImage: null,
    sections: [
      ...floorZones,
      { code: 'STAGE', kind: 'stage', path: stagePath(), labelX: CX, labelY: CY, labelSize: 15 },
      ...ringSections({ inner: [300, 228], outer: [388, 296], count: 24, firstNumber: 101, labelSize: 14 }),
      ...ringSections({ inner: [398, 306], outer: [470, 364], count: 28, firstNumber: 201, labelSize: 13 }),
    ],
  }
}
