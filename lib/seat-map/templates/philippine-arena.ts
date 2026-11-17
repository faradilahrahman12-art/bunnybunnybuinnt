import type { MapSection, VenueMap } from '@/components/seat-map/types'

type Point = [number, number]

const WIDTH = 1040
const HEIGHT = 720
const CX = 520
const CY = 610

const round = (n: number) => Math.round(n * 10) / 10

function toPath(points: Point[]) {
  return `M${points.map(([x, y]) => `${round(x)} ${round(y)}`).join('L')}Z`
}

/** A point on an ellipse centred just above the stage; 180 degrees is the left end and 270 is straight up. */
function bowlPoint(rx: number, ry: number, degrees: number): Point {
  const t = (degrees * Math.PI) / 180
  return [CX + rx * Math.cos(t), CY + ry * Math.sin(t)]
}

interface Tier {
  inner: [number, number]
  outer: [number, number]
  firstNumber: number
  lastNumber: number
  labelSize: number
}

/** A half-ring fanning over the floor from left to right, split into seamless numbered wedges. */
function tierSections({ inner, outer, firstNumber, lastNumber, labelSize }: Tier): MapSection[] {
  const count = lastNumber - firstNumber + 1
  const step = 180 / count
  return Array.from({ length: count }, (_, i) => {
    const start = 180 + i * step
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

/** The standing floor: a dome in front of the stage, flat along the stage edge. */
function floorPath() {
  const angles = Array.from({ length: 25 }, (_, i) => 180 + (180 * i) / 24)
  return toPath([[CX - 124, CY + 4], ...angles.map((a) => bowlPoint(124, 96, a)), [CX + 124, CY + 4]])
}

export const PHILIPPINE_ARENA_TEMPLATE_NAME = 'Philippine Arena (end stage)'

/**
 * End-stage layout for the Philippine Arena, Bulacan, matching its fan-shaped bowl: a domed standing floor in front
 * of the stage, then Lower Box 103-113 and 203-221, the narrow 302-323 ring and the Upper Box 402-435.
 */
export function buildPhilippineArenaMap(id: string, name = PHILIPPINE_ARENA_TEMPLATE_NAME): VenueMap {
  return {
    id,
    name,
    viewBox: { width: WIDTH, height: HEIGHT },
    backgroundImage: null,
    sections: [
      { code: 'FLOOR', kind: 'floor', path: floorPath(), labelX: CX, labelY: CY - 36, labelSize: 20 },
      {
        code: 'STAGE',
        kind: 'stage',
        path: toPath([[CX - 68, CY + 16], [CX + 68, CY + 16], [CX + 68, CY + 80], [CX - 68, CY + 80]]),
        labelX: CX,
        labelY: CY + 48,
        labelSize: 20,
      },
      ...tierSections({ inner: [140, 108], outer: [272, 236], firstNumber: 103, lastNumber: 113, labelSize: 14 }),
      ...tierSections({ inner: [280, 244], outer: [358, 310], firstNumber: 203, lastNumber: 221, labelSize: 13 }),
      ...tierSections({ inner: [366, 318], outer: [388, 348], firstNumber: 302, lastNumber: 323, labelSize: 8 }),
      ...tierSections({ inner: [396, 356], outer: [508, 568], firstNumber: 402, lastNumber: 435, labelSize: 13 }),
    ],
  }
}
