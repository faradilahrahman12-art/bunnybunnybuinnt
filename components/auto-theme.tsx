'use client'

import { useEffect } from 'react'
import { useTheme } from 'next-themes'

// Key used to remember that the visitor manually picked a theme.
// When present, we stop auto-switching and respect their choice.
export const THEME_MANUAL_KEY = 'theme-manual'

function themeForLocalTime() {
  // getHours() uses the browser's own timezone, which reflects
  // whatever country/region the visitor is opening the site from.
  const hour = new Date().getHours()
  const isDaytime = hour >= 6 && hour < 18
  return isDaytime ? 'light' : 'dark'
}

export function AutoTheme() {
  const { setTheme } = useTheme()

  useEffect(() => {
    if (typeof window === 'undefined') return

    // If the visitor manually toggled, don't override their choice.
    if (localStorage.getItem(THEME_MANUAL_KEY) === '1') return

    const apply = () => setTheme(themeForLocalTime())
    apply()

    // Re-evaluate periodically so a page left open across the
    // day/night boundary switches on its own.
    const interval = window.setInterval(apply, 10 * 60 * 1000)
    return () => window.clearInterval(interval)
  }, [setTheme])

  return null
}
