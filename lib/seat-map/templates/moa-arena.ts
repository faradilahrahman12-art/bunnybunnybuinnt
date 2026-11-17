import type { MapSection, SectionKind, VenueMap } from '@/components/seat-map/types'

type Point = [number, number]

const WIDTH = 1000
const HEIGHT = 960

function toPath(points: Point[]) {
  return `M${points.map(([x, y]) => `${x} ${y}`).join('L')}Z`
}

function rect(x1: number, y1: number, x2: number, y2: number): Point[] {
  return [
    [x1, y1],
    [x2, y1],
    [x2, y2],
    [x1, y2],
  ]
}

function centroid(points: Point[]): Point {
  const [sx, sy] = points.reduce(([ax, ay], [x, y]) => [ax + x, ay + y], [0, 0])
  return [Math.round(sx / points.length), Math.round(sy / points.length)]
}

function mirror(points: Point[]): Point[] {
  return points.map(([x, y]) => [WIDTH - x, y] as Point).reverse()
}

function section(code: string, points: Point[], labelSize = 22, kind: SectionKind = 'seat'): MapSection {
  const [labelX, labelY] = centroid(points)
  return { code, kind, path: toPath(points), labelX, labelY, labelSize }
}

/** Left-hand blocks of the bowl, paired with the code of their mirror image on the right. */
const LEFT_BLOCKS: { code: string; mirrorCode: string; points: Point[]; labelSize?: number }[] = [
  { code: '507', mirrorCode: '516', points: rect(40, 195, 110, 305) },
  { code: '407', mirrorCode: '416', points: rect(115, 195, 195, 305) },
  { code: '207', mirrorCode: '216', points: rect(200, 195, 330, 305) },
  { code: '506', mirrorCode: '517', points: rect(40, 310, 110, 420) },
  { code: '406', mirrorCode: '417', points: rect(115, 310, 195, 420) },
  { code: '206', mirrorCode: '217', points: rect(200, 310, 330, 420) },
  { code: '505', mirrorCode: '518', points: rect(40, 425, 110, 535) },
  { code: '405', mirrorCode: '418', points: rect(115, 425, 195, 535) },
  { code: '205', mirrorCode: '218', points: rect(200, 425, 330, 535) },

  { code: '504', mirrorCode: '519', points: [[40, 540], [110, 540], [110, 621], [40, 650]] },
  { code: '503B', mirrorCode: '520A', points: [[40, 650], [110, 621], [189, 700], [125, 735]], labelSize: 18 },
  { code: '503A', mirrorCode: '520B', points: [[125, 735], [189, 700], [279, 790], [220, 830]], labelSize: 18 },
  { code: '502', mirrorCode: '521', points: [[220, 830], [279, 790], [354, 865], [390, 865], [390, 940], [330, 940]] },

  { code: '404', mirrorCode: '419', points: [[115, 540], [195, 540], [195, 587], [115, 619]], labelSize: 18 },
  { code: '403B', mirrorCode: '420A', points: [[115, 619], [195, 587], [268, 660], [196, 700]], labelSize: 18 },
  { code: '403A', mirrorCode: '420B', points: [[196, 700], [268, 660], [338, 730], [271, 775]], labelSize: 18 },
  { code: '402', mirrorCode: '421', points: [[271, 775], [338, 730], [390, 782], [390, 860], [356, 860]] },

  { code: '204', mirrorCode: '219', points: [[200, 540], [330, 540], [330, 630], [200, 586]] },
  { code: '203', mirrorCode: '220', points: [[200, 586], [330, 630], [370, 670], [280, 666]], labelSize: 18 },
  { code: '202', mirrorCode: '221', points: [[280, 666], [370, 670], [390, 690], [390, 770], [384, 770]], labelSize: 18 },

  { code: '201', mirrorCode: '222', points: rect(395, 690, 497, 770) },
  { code: '401', mirrorCode: '422', points: rect(395, 775, 497, 860) },
  { code: '501', mirrorCode: '522', points: rect(395, 865, 497, 940) },
]

const STAGE_PATH = [
  toPath(rect(345, 25, 655, 180)),
  toPath(rect(484, 180, 516, 300)),
  toPath(rect(430, 300, 570, 390)),
].join(' ')

export const MOA_ARENA_TEMPLATE_NAME = 'SM Mall of Asia Arena'

/** Concert-in-the-round style layout for SM Mall of Asia Arena: end stage with runway, SVIP standing floor and the 200/400/500 bowl. */
export function buildMoaArenaMap(id: string, name = MOA_ARENA_TEMPLATE_NAME): VenueMap {
  const svip: Point[] = [[340, 215], [660, 215], [660, 600], [640, 625], [360, 625], [340, 600]]
  const blocks = LEFT_BLOCKS.flatMap(({ code, mirrorCode, points, labelSize }) => [
    section(code, points, labelSize),
    section(mirrorCode, mirror(points), labelSize),
  ])

  return {
    id,
    name,
    viewBox: { width: WIDTH, height: HEIGHT },
    backgroundImage: null,
    sections: [
      { ...section('SVIP', svip, 30, 'floor'), labelY: 520 },
      { code: 'STAGE', kind: 'stage', path: STAGE_PATH, labelX: 500, labelY: 102, labelSize: 34 },
      section('CONTROL BOOTH', rect(420, 640, 580, 685), 10, 'stage'),
      ...blocks,
    ],
  }
}
