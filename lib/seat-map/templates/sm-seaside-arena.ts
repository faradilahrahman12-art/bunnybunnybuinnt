import type { MapSection, SectionKind, VenueMap } from '@/components/seat-map/types'

type Point = [number, number]

const WIDTH = 1370
const HEIGHT = 1040
/** Vertical axis the stage sits on; right-side corner sections mirror the left ones across it. */
const MIRROR_X = 1366

function toPath(points: Point[]) {
  return `M${points.map(([x, y]) => `${x} ${y}`).join('L')}Z`
}

function centroid(points: Point[]): Point {
  const sum = points.reduce<Point>(([sx, sy], [x, y]) => [sx + x, sy + y], [0, 0])
  return [Math.round(sum[0] / points.length), Math.round(sum[1] / points.length)]
}

function shape(code: string, points: Point[], labelSize = 20, kind: SectionKind = 'seat', label?: Point): MapSection {
  const [labelX, labelY] = label ?? centroid(points)
  return { code, kind, path: toPath(points), labelX, labelY, labelSize }
}

function box(code: string, x1: number, y1: number, x2: number, y2: number, labelSize = 20): MapSection {
  return shape(code, [[x1, y1], [x2, y1], [x2, y2], [x1, y2]], labelSize)
}

const mirror = (points: Point[]): Point[] => points.map(([x, y]) => [MIRROR_X - x, y] as Point).reverse()

/** Angled corner sections on the left side, paired with their mirrored right-side code. */
const CORNERS: { left: string; right: string; points: Point[]; size?: number }[] = [
  { left: '203', right: '216', points: [[391, 567], [484, 567], [484, 628], [433, 652], [391, 640]] },
  { left: '202', right: '217', points: [[408, 676], [493, 640], [463, 732]] },
  { left: '603B', right: '616A', points: [[116, 600], [157, 600], [157, 700], [188, 742], [150, 756], [116, 705]], size: 16 },
  { left: '503B', right: '516A', points: [[162, 600], [202, 600], [202, 680], [237, 716], [196, 734], [162, 690]], size: 15 },
  { left: '403B', right: '416A', points: [[207, 600], [334, 600], [346, 665], [240, 712], [207, 680]] },
  { left: '403A', right: '416B', points: [[252, 728], [352, 685], [383, 735], [297, 800]] },
  { left: '503A', right: '516B', points: [[205, 748], [248, 732], [296, 825], [262, 840]], size: 17 },
  { left: '603A', right: '616B', points: [[153, 770], [200, 750], [255, 855], [225, 880], [178, 830]], size: 17 },
  { left: '402B', right: '417A', points: [[334, 830], [412, 755], [462, 800], [410, 893]] },
  { left: '402A', right: '417B', points: [[455, 808], [543, 808], [543, 925], [408, 900]] },
  { left: '502B', right: '517A', points: [[295, 866], [330, 835], [408, 895], [392, 935]], size: 17 },
  { left: '502A', right: '517B', points: [[408, 908], [543, 930], [543, 972], [398, 945]], size: 17 },
  { left: '602B', right: '617A', points: [[248, 912], [290, 873], [386, 940], [370, 990]] },
  { left: '602A', right: '617B', points: [[394, 955], [543, 980], [543, 1025], [382, 1000]] },
]

export const SM_SEASIDE_ARENA_TEMPLATE_NAME = 'SM Seaside Arena Cebu (end stage)'

/**
 * End-stage concert layout for SM Seaside Arena, Cebu City: T-runway stage with a wraparound standing floor,
 * 201-218 inner boxes, and 400/500/600-level sections with A/B splits on the angled corners.
 */
export function buildSmSeasideArenaMap(id: string, name = SM_SEASIDE_ARENA_TEMPLATE_NAME): VenueMap {
  return {
    id,
    name,
    viewBox: { width: WIDTH, height: HEIGHT },
    backgroundImage: null,
    sections: [
      shape(
        'STAGE',
        [[572, 30], [792, 30], [792, 211], [714, 211], [714, 340], [745, 340], [745, 428], [617, 428], [617, 340], [651, 340], [651, 211], [572, 211]],
        24,
        'stage',
        [682, 100],
      ),
      shape(
        'STANDING',
        [
          [511, 262], [606, 262], [606, 302], [566, 322], [566, 462], [581, 474], [781, 474], [796, 462], [796, 322],
          [757, 302], [757, 262], [852, 262], [852, 605], [822, 645], [767, 632], [597, 632], [537, 645], [511, 605],
        ],
        24,
        'floor',
        [682, 548],
      ),
      shape('CONTROL BOOTH', [[616, 652], [748, 652], [748, 708], [616, 708]], 13, 'stage'),

      box('206', 391, 205, 484, 286),
      box('205', 391, 304, 484, 418),
      box('204', 391, 437, 484, 550),
      box('213', 880, 205, 970, 286),
      box('214', 880, 304, 970, 418),
      box('215', 880, 437, 970, 550),
      box('201B', 514, 723, 616, 782, 17),
      box('201A', 631, 723, 733, 782, 17),
      box('218', 748, 723, 850, 782),

      box('606', 116, 205, 157, 286, 15),
      box('506', 162, 205, 202, 286, 15),
      box('406', 207, 205, 334, 286),
      box('605', 116, 304, 157, 437, 15),
      box('505', 162, 304, 202, 437, 15),
      box('405', 207, 304, 334, 437),
      box('604', 116, 455, 157, 583, 15),
      box('504', 162, 455, 202, 583, 15),
      box('404', 207, 455, 334, 583),

      box('413', 1030, 205, 1145, 286),
      box('513', 1149, 205, 1204, 286, 15),
      box('613', 1210, 205, 1251, 286, 15),
      box('414', 1030, 304, 1145, 437),
      box('514', 1149, 304, 1204, 437, 15),
      box('614', 1210, 304, 1251, 437, 15),
      box('415', 1030, 455, 1145, 583),
      box('515', 1149, 455, 1204, 583, 15),
      box('615', 1210, 455, 1251, 583, 15),

      box('401', 560, 808, 675, 922),
      box('418', 690, 808, 805, 922),
      box('501', 560, 930, 675, 972, 17),
      box('518', 690, 930, 805, 972, 17),
      box('601', 560, 978, 675, 1012, 16),
      box('618', 690, 978, 805, 1012, 16),

      ...CORNERS.flatMap(({ left, right, points, size }) => [
        shape(left, points, size),
        shape(right, mirror(points), size),
      ]),
    ],
  }
}
