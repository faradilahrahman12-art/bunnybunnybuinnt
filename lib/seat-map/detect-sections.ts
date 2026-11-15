import type { MapSection, SectionKind } from '@/components/seat-map/types'

export type DetectedLabel = { code: string; kind: SectionKind; x: number; y: number }

type Point = { x: number; y: number }

type Region = {
  id: number
  area: number
  sumX: number
  sumY: number
  startX: number
  startY: number
}

export type DetectOptions = {
  width: number
  height: number
  /** Gaps up to roughly 2 × mergeGap pixels inside a section (row lines, text) are filled in. */
  mergeGap: number
}

export type DetectResult = {
  sections: MapSection[]
  unplacedLabels: string[]
  unnamedCount: number
}

const DX = [1, 1, 0, -1, -1, -1, 0, 1]
const DY = [0, 1, 1, 1, 0, -1, -1, -1]

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Could not load the venue image.'))
    image.src = src
  })
}

/** Downscaled JPEG copy for the AI label reader, small enough for a Server Action body. */
export function imageToCompactDataUrl(image: HTMLImageElement, maxSide = 1400) {
  const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(image.naturalWidth * scale)
  canvas.height = Math.round(image.naturalHeight * scale)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas is not available in this browser.')
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/jpeg', 0.85)
}

function readPixels(image: HTMLImageElement, width: number, height: number) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) throw new Error('Canvas is not available in this browser.')
  ctx.drawImage(image, 0, 0, width, height)
  try {
    return ctx.getImageData(0, 0, width, height).data
  } catch {
    throw new Error('The venue image blocks pixel access. Re-upload it and try again.')
  }
}

function backgroundColor(data: Uint8ClampedArray, width: number, height: number) {
  const samples: [number, number, number][] = []
  const push = (x: number, y: number) => {
    const i = (y * width + x) * 4
    if (data[i + 3] > 20) samples.push([data[i], data[i + 1], data[i + 2]])
  }
  for (let x = 0; x < width; x += 4) {
    push(x, 0)
    push(x, height - 1)
  }
  for (let y = 0; y < height; y += 4) {
    push(0, y)
    push(width - 1, y)
  }
  if (!samples.length) return [255, 255, 255]
  return [0, 1, 2].map((c) => {
    const values = samples.map((s) => s[c]).sort((a, b) => a - b)
    return values[Math.floor(values.length / 2)]
  })
}

function foregroundMask(data: Uint8ClampedArray, width: number, height: number) {
  const [br, bg, bb] = backgroundColor(data, width, height)
  const mask = new Uint8Array(width * height)
  for (let p = 0; p < width * height; p++) {
    const i = p * 4
    if (data[i + 3] < 40) continue
    const diff = Math.max(Math.abs(data[i] - br), Math.abs(data[i + 1] - bg), Math.abs(data[i + 2] - bb))
    if (diff > 26) mask[p] = 1
  }
  return mask
}

function dilate(mask: Uint8Array, width: number, height: number, r: number, value: 0 | 1) {
  const pass = (src: Uint8Array, horizontal: boolean) => {
    const out = new Uint8Array(src.length)
    const lines = horizontal ? height : width
    const len = horizontal ? width : height
    const prefix = new Int32Array(len + 1)
    for (let line = 0; line < lines; line++) {
      const at = (k: number) => (horizontal ? line * width + k : k * width + line)
      for (let k = 0; k < len; k++) prefix[k + 1] = prefix[k] + (src[at(k)] === value ? 1 : 0)
      for (let k = 0; k < len; k++) {
        const hit = prefix[Math.min(len, k + r + 1)] - prefix[Math.max(0, k - r)] > 0
        out[at(k)] = hit ? value : (1 - value) as 0 | 1
      }
    }
    return out
  }
  return pass(pass(mask, true), false)
}

function closeMask(mask: Uint8Array, width: number, height: number, r: number) {
  if (r <= 0) return mask
  return dilate(dilate(mask, width, height, r, 1), width, height, r, 0)
}

function labelRegions(mask: Uint8Array, width: number, height: number) {
  const labels = new Int32Array(width * height)
  const regions: Region[] = []
  const stack = new Int32Array(width * height)
  for (let start = 0; start < mask.length; start++) {
    if (!mask[start] || labels[start]) continue
    const id = regions.length + 1
    const region: Region = { id, area: 0, sumX: 0, sumY: 0, startX: start % width, startY: Math.floor(start / width) }
    let top = 0
    stack[top++] = start
    labels[start] = id
    while (top) {
      const p = stack[--top]
      const x = p % width
      const y = (p - x) / width
      region.area++
      region.sumX += x
      region.sumY += y
      if (x > 0 && mask[p - 1] && !labels[p - 1]) (labels[p - 1] = id), (stack[top++] = p - 1)
      if (x < width - 1 && mask[p + 1] && !labels[p + 1]) (labels[p + 1] = id), (stack[top++] = p + 1)
      if (y > 0 && mask[p - width] && !labels[p - width]) (labels[p - width] = id), (stack[top++] = p - width)
      if (y < height - 1 && mask[p + width] && !labels[p + width]) (labels[p + width] = id), (stack[top++] = p + width)
    }
    regions.push(region)
  }
  return { labels, regions }
}

const COLOR_TOLERANCE = 18
const BRIDGE_RADIUS = 2

/** Builds the dominant fill colours; each pixel maps to a palette entry, or -1 for edges, text and row lines. */
function fillPalette(data: Uint8ClampedArray, fg: Uint8Array) {
  const centers: { r: number; g: number; b: number; n: number }[] = []
  const nearest = (r: number, g: number, b: number) => {
    let best = -1
    let bestDiff = COLOR_TOLERANCE + 1
    for (let k = 0; k < centers.length; k++) {
      const c = centers[k]
      const diff = Math.max(Math.abs(r - c.r), Math.abs(g - c.g), Math.abs(b - c.b))
      if (diff < bestDiff) (bestDiff = diff), (best = k)
    }
    return best
  }
  let samples = 0
  for (let p = 0; p < fg.length; p += 3) {
    if (!fg[p]) continue
    samples++
    const i = p * 4
    const k = nearest(data[i], data[i + 1], data[i + 2])
    if (k < 0) {
      if (centers.length < 256) centers.push({ r: data[i], g: data[i + 1], b: data[i + 2], n: 1 })
      continue
    }
    const c = centers[k]
    c.n++
    c.r += (data[i] - c.r) / c.n
    c.g += (data[i + 1] - c.g) / c.n
    c.b += (data[i + 2] - c.b) / c.n
  }
  const minCount = Math.max(40, samples * 0.002)
  const fills = centers.filter((c) => c.n >= minCount)
  centers.length = 0
  centers.push(...fills)
  const cluster = new Int16Array(fg.length).fill(-1)
  for (let p = 0; p < fg.length; p++) {
    if (!fg[p]) continue
    const i = p * 4
    cluster[p] = nearest(data[i], data[i + 1], data[i + 2])
  }
  return cluster
}

/**
 * Splits connected shapes by fill colour (neighbouring tiers share edges), then rejoins same-colour
 * pieces separated only by thin row lines inside the same shape.
 */
function segment(data: Uint8ClampedArray, fg: Uint8Array, width: number, height: number, mergeGap: number) {
  const shapes = labelRegions(closeMask(fg, width, height, mergeGap), width, height).labels
  const cluster = fillPalette(data, fg)
  const core = new Uint8Array(fg.length)
  for (let p = 0; p < fg.length; p++) if (cluster[p] >= 0) core[p] = 1

  const pieces = new Int32Array(fg.length)
  const stack = new Int32Array(fg.length)
  let count = 0
  for (let start = 0; start < fg.length; start++) {
    if (!core[start] || pieces[start]) continue
    const id = ++count
    const c = cluster[start]
    let top = 0
    stack[top++] = start
    pieces[start] = id
    while (top) {
      const p = stack[--top]
      const x = p % width
      const visit = (q: number) => {
        if (core[q] && !pieces[q] && cluster[q] === c) (pieces[q] = id), (stack[top++] = q)
      }
      if (x > 0) visit(p - 1)
      if (x < width - 1) visit(p + 1)
      if (p >= width) visit(p - width)
      if (p < fg.length - width) visit(p + width)
    }
  }

  // Row lines and anti-aliased borders form thin pieces with no solid interior; treat them as edges.
  const solid = new Uint8Array(count + 1)
  for (let p = 0; p < fg.length; p++) {
    const id = pieces[p]
    if (!id || solid[id]) continue
    const x = p % width
    const y = (p - x) / width
    if (x < 2 || y < 2 || x >= width - 2 || y >= height - 2) continue
    let full = true
    for (let dy = -2; dy <= 2 && full; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        if (pieces[p + dy * width + dx] !== id) {
          full = false
          break
        }
      }
    }
    if (full) solid[id] = 1
  }
  for (let p = 0; p < fg.length; p++) if (pieces[p] && !solid[pieces[p]]) pieces[p] = 0

  const parent = new Int32Array(count + 1)
  for (let i = 0; i <= count; i++) parent[i] = i
  const find = (a: number): number => {
    while (parent[a] !== a) (parent[a] = parent[parent[a]]), (a = parent[a])
    return a
  }
  const nearestPiece = new Int32Array(fg.length)
  const firstByCluster = new Map<number, number>()
  for (let p = 0; p < fg.length; p++) {
    if (!fg[p] || (pieces[p] && core[p] && p % 2)) continue
    const x = p % width
    const y = (p - x) / width
    firstByCluster.clear()
    let any = 0
    for (let dy = -BRIDGE_RADIUS; dy <= BRIDGE_RADIUS; dy++) {
      const yy = y + dy
      if (yy < 0 || yy >= height) continue
      for (let dx = -BRIDGE_RADIUS; dx <= BRIDGE_RADIUS; dx++) {
        const xx = x + dx
        if (xx < 0 || xx >= width) continue
        const q = yy * width + xx
        const piece = pieces[q]
        if (!piece || shapes[q] !== shapes[p]) continue
        if (!any) any = piece
        const first = firstByCluster.get(cluster[q])
        if (first === undefined) firstByCluster.set(cluster[q], piece)
        else if (first !== piece) {
          const ra = find(first)
          const rb = find(piece)
          if (ra !== rb) parent[ra] = rb
        }
      }
    }
    if (!pieces[p]) nearestPiece[p] = any
  }

  const labels = new Int32Array(fg.length)
  const byRoot = new Map<number, Region>()
  const regions: Region[] = []
  for (let p = 0; p < fg.length; p++) {
    const piece = pieces[p] || nearestPiece[p]
    if (!piece) continue
    const root = find(piece)
    let region = byRoot.get(root)
    if (!region) {
      region = { id: regions.length + 1, area: 0, sumX: 0, sumY: 0, startX: p % width, startY: Math.floor(p / width) }
      byRoot.set(root, region)
      regions.push(region)
    }
    labels[p] = region.id
    region.area++
    region.sumX += p % width
    region.sumY += Math.floor(p / width)
  }
  return { labels, regions }
}

function traceOutline(labels: Int32Array, width: number, height: number, region: Region): Point[] {
  const inside = (x: number, y: number) => x >= 0 && y >= 0 && x < width && y < height && labels[y * width + x] === region.id
  const sx = region.startX
  const sy = region.startY
  const next = (x: number, y: number, dir: number) => {
    const from = (dir + 6) % 8
    for (let i = 0; i < 8; i++) {
      const d = (from + i) % 8
      if (inside(x + DX[d], y + DY[d])) return d
    }
    return -1
  }
  const firstDir = next(sx, sy, 0)
  if (firstDir < 0) return [{ x: sx, y: sy }]
  const points: Point[] = [{ x: sx, y: sy }]
  let x = sx + DX[firstDir]
  let y = sy + DY[firstDir]
  let dir = firstDir
  const limit = region.area * 4 + 16
  for (let step = 0; step < limit; step++) {
    const d = next(x, y, dir)
    if (x === sx && y === sy && d === firstDir) break
    points.push({ x, y })
    dir = d
    x += DX[d]
    y += DY[d]
  }
  return points
}

function simplify(points: Point[], epsilon: number): Point[] {
  if (points.length < 4) return points
  const keep = new Uint8Array(points.length)
  keep[0] = 1
  keep[points.length - 1] = 1
  const stack: [number, number][] = [[0, points.length - 1]]
  while (stack.length) {
    const [a, b] = stack.pop()!
    const pa = points[a]
    const pb = points[b]
    const dx = pb.x - pa.x
    const dy = pb.y - pa.y
    const len = Math.hypot(dx, dy) || 1
    let maxDist = 0
    let index = -1
    for (let i = a + 1; i < b; i++) {
      const dist = Math.abs(dy * points[i].x - dx * points[i].y + pb.x * pa.y - pb.y * pa.x) / len
      if (dist > maxDist) (maxDist = dist), (index = i)
    }
    if (index > 0 && maxDist > epsilon) {
      keep[index] = 1
      stack.push([a, index], [index, b])
    }
  }
  return points.filter((_, i) => keep[i])
}

function toPath(points: Point[]) {
  return `M${points.map((p) => `${(p.x + 0.5).toFixed(1)} ${(p.y + 0.5).toFixed(1)}`).join('L')}Z`
}

function regionAt(labels: Int32Array, width: number, height: number, x: number, y: number, radius: number) {
  const cx = Math.round(x)
  const cy = Math.round(y)
  for (let r = 0; r <= radius; r += 2) {
    for (let a = 0; a < (r === 0 ? 1 : 16); a++) {
      const px = Math.round(cx + r * Math.cos((a / 16) * Math.PI * 2))
      const py = Math.round(cy + r * Math.sin((a / 16) * Math.PI * 2))
      if (px < 0 || py < 0 || px >= width || py >= height) continue
      const id = labels[py * width + px]
      if (id) return id
    }
  }
  return 0
}

function interiorPoint(labels: Int32Array, width: number, height: number, region: Region): Point {
  const mean = { x: region.sumX / region.area, y: region.sumY / region.area }
  if (labels[Math.round(mean.y) * width + Math.round(mean.x)] === region.id) return mean
  const id = regionAt(labels, width, height, mean.x, mean.y, Math.max(width, height))
  return id === region.id ? mean : { x: region.startX + 2, y: region.startY + 2 }
}

/** Same-colour neighbours can fuse across narrow gaps; split any shape holding several labels by nearest label. */
function splitByLabels(grid: Int32Array, regions: Region[], labels: DetectedLabel[], width: number, height: number, minArea: number) {
  const byRegion = new Map<number, DetectedLabel[]>()
  for (const label of labels) {
    const id = regionAt(grid, width, height, label.x, label.y, 24)
    if (!id || regions[id - 1].area < minArea) continue
    const list = byRegion.get(id) ?? []
    list.push(label)
    byRegion.set(id, list)
  }
  const targets = new Map<number, { label: DetectedLabel; id: number }[]>()
  for (const [id, list] of byRegion) {
    if (list.length < 2) continue
    targets.set(id, list.map((label, i) => {
      if (i === 0) return { label, id }
      const region: Region = { id: regions.length + 1, area: 0, sumX: 0, sumY: 0, startX: 0, startY: 0 }
      regions.push(region)
      return { label, id: region.id }
    }))
  }
  if (!targets.size) return
  for (const id of targets.keys()) {
    const region = regions[id - 1]
    region.area = 0
    region.sumX = 0
    region.sumY = 0
  }
  const seen = new Set<number>()
  for (let p = 0; p < grid.length; p++) {
    const options = targets.get(grid[p])
    if (!options) continue
    const x = p % width
    const y = (p - x) / width
    let best = options[0]
    let bestDist = Infinity
    for (const option of options) {
      const d = (option.label.x - x) ** 2 + (option.label.y - y) ** 2
      if (d < bestDist) (bestDist = d), (best = option)
    }
    grid[p] = best.id
    const region = regions[best.id - 1]
    if (!seen.has(best.id)) {
      seen.add(best.id)
      region.startX = x
      region.startY = y
    }
    region.area++
    region.sumX += x
    region.sumY += y
  }
}

/** Drops stray fragments so each section is one connected shape traced from its main body. */
function keepLargestComponents(grid: Int32Array, regions: Region[], width: number) {
  const component = new Int32Array(grid.length)
  const stack = new Int32Array(grid.length)
  const best = new Map<number, { comp: number; area: number; start: number }>()
  let comp = 0
  for (let start = 0; start < grid.length; start++) {
    const id = grid[start]
    if (!id || component[start]) continue
    comp++
    let area = 0
    let top = 0
    stack[top++] = start
    component[start] = comp
    while (top) {
      const p = stack[--top]
      area++
      const x = p % width
      const visit = (q: number) => {
        if (grid[q] === id && !component[q]) (component[q] = comp), (stack[top++] = q)
      }
      if (x > 0) visit(p - 1)
      if (x < width - 1) visit(p + 1)
      if (p >= width) visit(p - width)
      if (p < grid.length - width) visit(p + width)
    }
    const current = best.get(id)
    if (!current || area > current.area) best.set(id, { comp, area, start })
  }
  for (const region of regions) (region.area = 0), (region.sumX = 0), (region.sumY = 0)
  for (let p = 0; p < grid.length; p++) {
    const id = grid[p]
    if (!id) continue
    const keep = best.get(id)!
    if (component[p] !== keep.comp) {
      grid[p] = 0
      continue
    }
    const region = regions[id - 1]
    region.area++
    region.sumX += p % width
    region.sumY += Math.floor(p / width)
  }
  for (const [id, keep] of best) {
    regions[id - 1].startX = keep.start % width
    regions[id - 1].startY = Math.floor(keep.start / width)
  }
}

const CODE_CLEAN = /[^A-Z0-9 _-]/g

export function detectSections(image: HTMLImageElement, labels: DetectedLabel[], options: DetectOptions): DetectResult {
  const { width, height, mergeGap } = options
  const data = readPixels(image, width, height)
  const { labels: grid, regions } = segment(data, foregroundMask(data, width, height), width, height, mergeGap)

  const minArea = Math.max(60, width * height * 0.00025)
  const maxArea = width * height * 0.45
  splitByLabels(grid, regions, labels, width, height, minArea)
  keepLargestComponents(grid, regions, width)
  const usable = new Map(regions.filter((r) => r.area >= minArea && r.area <= maxArea).map((r) => [r.id, r]))

  const assigned = new Map<number, { label: DetectedLabel; distance: number }>()
  const unplacedLabels: string[] = []
  for (const label of labels) {
    const id = regionAt(grid, width, height, label.x, label.y, 24)
    const region = usable.get(id)
    if (!region) {
      unplacedLabels.push(label.code)
      continue
    }
    const distance = Math.hypot(label.x - region.sumX / region.area, label.y - region.sumY / region.area)
    const current = assigned.get(id)
    if (!current) assigned.set(id, { label, distance })
    else if (distance < current.distance) {
      unplacedLabels.push(current.label.code)
      assigned.set(id, { label, distance })
    } else unplacedLabels.push(label.code)
  }

  const usedCodes = new Set<string>()
  const sections: MapSection[] = []
  let unnamed = 0
  const ordered = [...usable.values()].sort((a, b) => a.startY - b.startY || a.startX - b.startX)
  for (const region of ordered) {
    const match = assigned.get(region.id)
    let code = match?.label.code.toUpperCase().replace(CODE_CLEAN, '').trim().slice(0, 20) ?? ''
    if (!code || usedCodes.has(code)) {
      do code = `S${++unnamed}`
      while (usedCodes.has(code))
    }
    usedCodes.add(code)
    const outline = simplify(traceOutline(grid, width, height, region), 1.1)
    if (outline.length < 3) continue
    const anchor = match && grid[Math.round(match.label.y) * width + Math.round(match.label.x)] === region.id
      ? { x: match.label.x, y: match.label.y }
      : interiorPoint(grid, width, height, region)
    sections.push({
      code,
      kind: match?.label.kind ?? 'seat',
      path: toPath(outline),
      labelX: Math.round(anchor.x * 10) / 10,
      labelY: Math.round(anchor.y * 10) / 10,
      labelSize: Math.round(Math.min(18, Math.max(10, Math.sqrt(region.area) / 4))),
    })
  }

  return { sections, unplacedLabels, unnamedCount: unnamed }
}
