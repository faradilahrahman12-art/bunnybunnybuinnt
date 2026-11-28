'use client'

import { useEffect, useRef, useState, type ReactNode, type SyntheticEvent } from 'react'
import { ShieldCheck } from 'lucide-react'

const BLACKOUT_AFTER_SHORTCUT_MS = 1500

function isCaptureShortcut(e: KeyboardEvent) {
  const key = e.key.toLowerCase()
  if (key === 'printscreen') return true
  const mod = e.ctrlKey || e.metaKey
  if (mod && ['c', 'x', 's', 'p', 'a', 'u'].includes(key)) return true
  // macOS screenshot shortcuts (Cmd+Shift+3/4/5) and Windows Snipping Tool (Win+Shift+S)
  if (e.shiftKey && (e.metaKey || e.getModifierState?.('OS')) && ['3', '4', '5', 's'].includes(key)) return true
  return false
}

export function ProtectedContent({ children }: { children: ReactNode }) {
  const [hidden, setHidden] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const blackout = (ms?: number) => {
      setHidden(true)
      if (timer.current) clearTimeout(timer.current)
      if (ms) timer.current = setTimeout(() => setHidden(false), ms)
    }
    const reveal = () => {
      if (timer.current) clearTimeout(timer.current)
      setHidden(false)
    }

    const onKey = (e: KeyboardEvent) => {
      if (!isCaptureShortcut(e)) return
      e.preventDefault()
      if (e.key.toLowerCase() === 'printscreen') navigator.clipboard?.writeText('').catch(() => {})
      blackout(BLACKOUT_AFTER_SHORTCUT_MS)
    }
    const onVisibility = () => (document.hidden ? blackout() : reveal())
    const onBlur = () => blackout()
    const onFocus = () => reveal()
    const onBeforePrint = () => blackout()
    const onAfterPrint = () => reveal()

    window.addEventListener('keydown', onKey, true)
    window.addEventListener('keyup', onKey, true)
    window.addEventListener('blur', onBlur)
    window.addEventListener('focus', onFocus)
    window.addEventListener('beforeprint', onBeforePrint)
    window.addEventListener('afterprint', onAfterPrint)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.removeEventListener('keydown', onKey, true)
      window.removeEventListener('keyup', onKey, true)
      window.removeEventListener('blur', onBlur)
      window.removeEventListener('focus', onFocus)
      window.removeEventListener('beforeprint', onBeforePrint)
      window.removeEventListener('afterprint', onAfterPrint)
      document.removeEventListener('visibilitychange', onVisibility)
      if (timer.current) clearTimeout(timer.current)
    }
  }, [])

  const block = (e: SyntheticEvent) => e.preventDefault()

  return (
    <div
      className="protected-content relative select-none [-webkit-touch-callout:none] [&_img]:pointer-events-none [&_img]:[-webkit-user-drag:none] [&_video]:[-webkit-touch-callout:none]"
      onContextMenu={block}
      onCopy={block}
      onCut={block}
      onDragStart={block}
    >
      {children}
      <div
        aria-hidden={!hidden}
        className={
          hidden
            ? 'protected-content-shield fixed inset-0 z-[100] flex items-center justify-center bg-black'
            : 'protected-content-shield hidden'
        }
      >
        <p className="flex items-center gap-2 text-sm font-medium text-white/70">
          <ShieldCheck className="size-4" aria-hidden="true" />
          Reviews are protected
        </p>
      </div>
    </div>
  )
}
