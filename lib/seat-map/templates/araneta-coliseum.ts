import type { MapSection, VenueMap } from '@/components/seat-map/types'

type Point = [number, number]

const WIDTH = 1150
const HEIGHT = 830
const CX = 575
const CY = 730
const START = 178
const END = 362
/** Superellipse exponent: above 2 squares the rings off so they hug the rectangular floor like the real bowl. */
const SQUARENESS = 2.6

const round = (n: number) => Math.round(n * 10) / 10

function toPath(points: Point[]) {
  return `M${points.map(([x, y]) => `${round(x)} ${round(y)}`).join('L')}Z`
}

function bowlPoint(rx: number, ry: number, degrees: number): Point {
  const t = (degrees * Math.PI) / 180
  const c = Math.cos(t)
  const s = Math.sin(t)
  const e = 2 / SQUARENESS
  return [CX + rx * Math.sign(c) * Math.abs(c) ** e, CY + ry * Math.sign(s) * Math.abs(s) ** e]
}

interface Ring {
  inner: [number, number]
  outer: [number, number]
  codes: string[]
  labelSize: number
  kind?: MapSection['kind']
}

/** A ring fanning over the floor from left to right, split into seamless numbered wedges. */
function ringSections({ inner, outer, codes, labelSize, kind = 'seat' }: Ring): MapSection[] {
  const step = (END - START) / codes.length
  return codes.map((code, i) => {
    const start = START + i * step
    const end = start + step
    const samples = Math.max(8, Math.ceil(step / 2))
    const angles = Array.from({ length: samples + 1 }, (_, s) => start + ((end - start) * s) / samples)
    const points: Point[] = [
      ...angles.map((a) => bowlPoint(outer[0], outer[1], a)),
      ...[...angles].reverse().map((a) => bowlPoint(inner[0], inner[1], a)),
    ]
    const [labelX, labelY] = bowlPoint((inner[0] + outer[0]) / 2, (inner[1] + outer[1]) / 2, start + step / 2)
    return { code, kind, path: toPath(points), labelX: Math.round(labelX), labelY: Math.round(labelY), labelSize }
  })
}

const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => String(from + i))

function rect(x1: number, y1: number, x2: number, y2: number) {
  return toPath([[x1, y1], [x2, y1], [x2, y2], [x1, y2]])
}

export const ARANETA_COLISEUM_TEMPLATE_NAME = 'Smart Araneta Coliseum (end stage)'

/**
 * End-stage layout for the Smart Araneta Coliseum, Quezon City: Patron floor 101 and 103 in front of the stage,
 * Lower Box 104-117, Upper Box A 200-221, Upper Box B 400-423 and General Admission across the top.
 */
export function buildAranetaColiseumMap(id: string, name = ARANETA_COLISEUM_TEMPLATE_NAME): VenueMap {
  return {
    id,
    name,
    viewBox: { width: WIDTH, height: HEIGHT },
    backgroundImage: null,
    sections: [
      { code: '101', kind: 'floor', path: rect(CX - 130, CY - 262, CX - 3, CY), labelX: CX - 66, labelY: CY - 125, labelSize: 18 },
      { code: '103', kind: 'floor', path: rect(CX + 3, CY - 262, CX + 130, CY), labelX: CX + 66, labelY: CY - 125, labelSize: 18 },
      { code: 'STAGE', kind: 'stage', path: rect(CX - 128, CY + 10, CX + 128, CY + 80), labelX: CX, labelY: CY + 45, labelSize: 22 },
      ...ringSections({
        inner: [186, 332],
        outer: [272, 422],
        codes: ['113', '114', '115', '116', '117', '104', '105', '106', '107', '108'],
        labelSize: 16,
      }),
      ...ringSections({
        inner: [284, 434],
        outer: [374, 526],
        codes: [...range(216, 221), '200', '201', ...range(202, 207)],
        labelSize: 15,
      }),
      ...ringSections({
        inner: [386, 538],
        outer: [482, 640],
        codes: [...range(419, 423), ...range(400, 407)],
        labelSize: 15,
      }),
      {
        ...ringSections({ inner: [494, 652], outer: [548, 712], codes: ['GA'], labelSize: 15, kind: 'floor' })[0],
        labelX: CX,
        labelY: CY - 682,
      },
    ],
  }
}
