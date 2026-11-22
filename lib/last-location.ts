const LAST_LOCATION_KEY = 'bunnyticket_last_location'
const MAX_AGE_MS = 1000 * 60 * 60 * 24 * 14

export type LastLocation = { path: string; scrollY: number; at: number }

export function saveLastLocation(path: string, scrollY: number) {
  try {
    const value: LastLocation = { path, scrollY: Math.max(0, Math.round(scrollY)), at: Date.now() }
    window.localStorage.setItem(LAST_LOCATION_KEY, JSON.stringify(value))
  } catch {}
}

export function readLastLocation(): LastLocation | null {
  try {
    const raw = window.localStorage.getItem(LAST_LOCATION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<LastLocation>
    if (typeof parsed.path !== 'string' || !parsed.path.startsWith('/') || parsed.path.startsWith('//')) return null
    if (typeof parsed.at !== 'number' || Date.now() - parsed.at > MAX_AGE_MS) return null
    return { path: parsed.path, scrollY: typeof parsed.scrollY === 'number' ? parsed.scrollY : 0, at: parsed.at }
  } catch {
    return null
  }
}

/** Scrolls to y once the page is tall enough (content may still be streaming in after navigation). */
export function restoreScroll(y: number, timeoutMs = 2500) {
  if (y <= 0) {
    window.scrollTo(0, 0)
    return
  }
  const started = performance.now()
  const tick = () => {
    const maxY = document.documentElement.scrollHeight - window.innerHeight
    if (maxY >= y || performance.now() - started > timeoutMs) {
      window.scrollTo(0, Math.min(y, Math.max(maxY, 0)))
      return
    }
    requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
}
