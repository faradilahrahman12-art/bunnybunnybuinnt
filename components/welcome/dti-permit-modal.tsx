'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Maximize2, ShieldCheck, X, ZoomIn, ZoomOut } from 'lucide-react'
import { DTI_PERMIT_IMAGE } from '@/lib/business-registration'

const MIN_ZOOM = 1
const MAX_ZOOM = 4

export function DtiPermitModal({ onClose }: { onClose: () => void }) {
  const [zoom, setZoom] = useState(MIN_ZOOM)
  const closeRef = useRef<HTMLButtonElement>(null)
  const isZoomed = zoom > MIN_ZOOM

  useEffect(() => {
    closeRef.current?.focus()
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const controlClass =
    'grid size-10 place-items-center rounded-full bg-white/10 text-white ring-1 ring-white/15 transition hover:bg-white/20 disabled:opacity-40 disabled:hover:bg-white/10'

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="bt-dti-title"
      className="fixed inset-0 z-[110] flex flex-col bg-[#0E0619]/95 backdrop-blur-md animate-in fade-in duration-200 motion-reduce:animate-none"
    >
      <header
        className="flex shrink-0 items-center justify-between gap-3 px-4 pb-3"
        style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
      >
        <h2 id="bt-dti-title" className="flex min-w-0 items-center gap-2 text-sm font-semibold text-white">
          <ShieldCheck className="size-4 shrink-0 text-[#C9A8FF]" aria-hidden="true" />
          <span className="truncate">DTI Business Registration</span>
        </h2>
        <div className="flex items-center gap-2">
          {DTI_PERMIT_IMAGE && (
            <>
              <button
                type="button"
                aria-label="Zoom out"
                disabled={!isZoomed}
                onClick={() => setZoom((z) => Math.max(MIN_ZOOM, z - 0.5))}
                className={controlClass}
              >
                <ZoomOut className="size-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                aria-label="Zoom in"
                disabled={zoom >= MAX_ZOOM}
                onClick={() => setZoom((z) => Math.min(MAX_ZOOM, z + 0.5))}
                className={controlClass}
              >
                <ZoomIn className="size-4" aria-hidden="true" />
              </button>
              {isZoomed && (
                <button
                  type="button"
                  aria-label="Fit to screen"
                  onClick={() => setZoom(MIN_ZOOM)}
                  className={controlClass}
                >
                  <Maximize2 className="size-4" aria-hidden="true" />
                </button>
              )}
            </>
          )}
          <button
            ref={closeRef}
            type="button"
            aria-label="Close DTI registration"
            onClick={onClose}
            className="grid size-10 place-items-center rounded-full bg-white text-[#2D1748] transition hover:bg-white/90"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>
      </header>

      {DTI_PERMIT_IMAGE ? (
        <div
          className={`min-h-0 flex-1 overflow-auto overscroll-contain ${isZoomed ? '' : 'flex items-center justify-center'}`}
          style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
          onClick={(event) => event.target === event.currentTarget && onClose()}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- full-resolution zoomable document */}
          <img
            src={DTI_PERMIT_IMAGE}
            alt="BunnyTicket Ticketing Services DTI Certificate of Business Name Registration, Business Name No. 8591695, valid October 29, 2026 to October 29, 2031"
            decoding="async"
            onDoubleClick={() => setZoom((z) => (z > MIN_ZOOM ? MIN_ZOOM : 2))}
            style={isZoomed ? { width: `${zoom * 100}%` } : undefined}
            className={
              isZoomed
                ? 'mx-auto h-auto max-w-none cursor-zoom-out'
                : 'h-full max-h-full w-auto max-w-full cursor-zoom-in rounded-md object-contain px-3 shadow-2xl'
            }
          />
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
          <p className="max-w-sm text-sm leading-relaxed text-white/80">
            Our DTI registration document has not been published on the website yet. For verification, please
            contact us directly or review our business terms.
          </p>
          <Link
            href="/terms"
            onClick={onClose}
            className="inline-flex h-10 items-center rounded-full bg-white px-5 text-sm font-semibold text-[#2D1748]"
          >
            View Terms &amp; Conditions
          </Link>
        </div>
      )}
    </div>
  )
}
