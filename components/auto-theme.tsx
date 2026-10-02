'use client'

import { useEffect } from 'react'
import { useTheme } from 'next-themes'

// Set once the visitor toggles manually; from then on their choice wins.
export const THEME_MANUAL_KEY = 'bunnyticket-theme-manual'

function themeForLocalTime() {
  const hour = new Date().getHours()
  return hour >= 6 && hour < 18 ? 'light' : 'dark'
}

export function AutoTheme() {
  const { setTheme } = useTheme()

  useEffect(() => {
    if (localStorage.getItem(THEME_MANUAL_KEY) === '1') return

    const apply = () => setTheme(themeForLocalTime())
    apply()

    // Re-check so a tab left open across 6am/6pm switches on its own.
    const interval = window.setInterval(apply, 10 * 60 * 1000)
    return () => window.clearInterval(interval)
  }, [setTheme])

  return null
}
