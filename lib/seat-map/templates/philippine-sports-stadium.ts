import type { MapSection, SectionKind, VenueMap } from '@/components/seat-map/types'

type Point = [number, number]

const WIDTH = 1000
const HEIGHT = 760
const CX = 500
const CY = 380
const STAGE_RADIUS = 58
const BOWL_SQUARENESS = 3.2

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

function circlePath(cx: number, cy: number, r: number) {
  return `M${cx - r} ${cy}A${r} ${r} 0 1 1 ${cx + r} ${cy}A${r} ${r} 0 1 1 ${cx - r} ${cy}Z`
}

function centroid(points: Point[]): Point {
  const [sx, sy] = points.reduce(([ax, ay], [x, y]) => [ax + x, ay + y], [0, 0])
  return [Math.round(sx / points.length), Math.round(sy / points.length)]
}

/** A point on a rounded-rectangle (superellipse) outline, which gives the stadium its racetrack shape. */
function bowlPoint(rx: number, ry: number, degrees: number): Point {
  const t = (degrees * Math.PI) / 180
  const c = Math.cos(t)
  const s = Math.sin(t)
  const e = 2 / BOWL_SQUARENESS
  return [CX + rx * Math.sign(c) * Math.abs(c) ** e, CY + ry * Math.sign(s) * Math.abs(s) ** e]
}

interface Ring {
  inner: [number, number]
  outer: [number, number]
  count: number
  firstNumber: number
  labelSize: number
}

/** Seamless numbered wedges; section 1 of each ring sits just below the right-hand side and numbers run clockwise. */
function ringSections({ inner, outer, count, firstNumber, labelSize }: Ring): MapSection[] {
  const step = 360 / count
  const firstCentre = 18
  return Array.from({ length: count }, (_, i) => {
    const start = firstCentre - step / 2 + i * step
    const end = start + step
    const samples = 6
    const angles = Array.from({ length: samples + 1 }, (_, s) => start + ((end - start) * s) / samples)
    const points: Point[] = [
      ...angles.map((a) => bowlPoint(outer[0], outer[1], a)),
      ...[...angles].reverse().map((a) => bowlPoint(inner[0], inner[1], a)),
    ]
    const [labelX, labelY] = bowlPoint(
      (inner[0] + outer[0]) / 2,
      (inner[1] + outer[1]) / 2,
      start + step / 2,
    )
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

function zone(
  code: string,
  points: Point[],
  label?: Point,
  kind: SectionKind = 'floor',
  labelSize = 18,
): MapSection {
  const [labelX, labelY] = label ?? centroid(points)
  return { code, kind, path: toPath(points), labelX, labelY, labelSize }
}

/** A rectangle of the given length and width centred on (cx, cy), rotated to the unit direction (dx, dy). */
function orientedRect(cx: number, cy: number, dx: number, dy: number, halfLength: number, halfWidth: number) {
  const px = -dy
  const py = dx
  return clockwise([
    [cx - dx * halfLength + px * halfWidth, cy - dy * halfLength + py * halfWidth],
    [cx + dx * halfLength + px * halfWidth, cy + dy * halfLength + py * halfWidth],
    [cx + dx * halfLength - px * halfWidth, cy + dy * halfLength - py * halfWidth],
    [cx - dx * halfLength - px * halfWidth, cy - dy * halfLength - py * halfWidth],
  ])
}

/** Round 360-degree stage on a wide deck, with four diagonal catwalks that each carry a cross-shaped platform. */
function stagePath() {
  const reach: Point = [232, 160]
  const length = Math.hypot(...reach)
  const parts = [
    circlePath(CX, CY, STAGE_RADIUS + 14),
    toPath(clockwise([[CX - 92, CY - 30], [CX + 92, CY - 30], [CX + 92, CY + 30], [CX - 92, CY + 30]])),
  ]
  for (const [sx, sy] of [[1, -1], [1, 1], [-1, 1], [-1, -1]] as const) {
    const dx = (reach[0] * sx) / length
    const dy = (reach[1] * sy) / length
    const walkStart = STAGE_RADIUS
    const walkMid = (walkStart + length) / 2
    parts.push(
      toPath(orientedRect(CX + dx * walkMid, CY + dy * walkMid, dx, dy, (length - walkStart) / 2, 11)),
      toPath(orientedRect(CX + dx * length * 0.68, CY + dy * length * 0.68, -dy, dx, 30, 16)),
    )
  }
  return parts.join(' ')
}

export const PHILIPPINE_SPORTS_STADIUM_TEMPLATE_NAME = 'Philippine Sports Stadium (360 stage)'

/**
 * In-the-round stadium layout for the Philippine Sports Stadium, Bulacan: a central 360-degree stage with four
 * diagonal catwalks, four standing floor zones, a lower bowl (101-146) and an upper bowl (201-246).
 */
export function buildPhilippineSportsStadiumMap(id: string, name = PHILIPPINE_SPORTS_STADIUM_TEMPLATE_NAME): VenueMap {
  const floorZones = [
    zone('FLOOR A', [[290, 190], [710, 190], [612, 252], [612, 288], [388, 288], [388, 252]], [500, 238]),
    zone('FLOOR C', [[290, 570], [710, 570], [612, 508], [612, 472], [388, 472], [388, 508]], [500, 522]),
    zone(
      'FLOOR B',
      [[655, 380], [790, 262], [822, 290], [842, 330], [848, 380], [842, 430], [822, 470], [790, 498]],
      [775, 380],
    ),
    zone(
      'FLOOR D',
      [[345, 380], [210, 498], [178, 470], [158, 430], [152, 380], [158, 330], [178, 290], [210, 262]],
      [225, 380],
    ),
  ]

  return {
    id,
    name,
    viewBox: { width: WIDTH, height: HEIGHT },
    backgroundImage: null,
    sections: [
      ...floorZones,
      { code: 'STAGE', kind: 'stage', path: stagePath(), labelX: CX, labelY: CY, labelSize: 20 },
      ...ringSections({ inner: [378, 262], outer: [432, 306], count: 46, firstNumber: 101, labelSize: 12 }),
      ...ringSections({ inner: [436, 310], outer: [488, 356], count: 46, firstNumber: 201, labelSize: 12 }),
    ],
  }
}
