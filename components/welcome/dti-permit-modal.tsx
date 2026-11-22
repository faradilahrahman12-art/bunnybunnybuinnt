'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ShieldCheck, X, ZoomIn, ZoomOut } from 'lucide-react'
import { DTI_PERMIT_IMAGE } from '@/lib/business-registration'

export function DtiPermitModal({ onClose }: { onClose: () => void }) {
  const [zoom, setZoom] = useState(1)
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    closeRef.current?.focus()
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="bt-dti-title"
      className="fixed inset-0 z-[110] flex items-center justify-center bg-[#1A0D2E]/70 p-4 backdrop-blur-sm animate-in fade-in duration-200 motion-reduce:animate-none"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[90dvh] w-full max-w-lg flex-col overflow-hidden rounded-[20px] bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-[#EFE7FC] px-4 py-3">
          <h2 id="bt-dti-title" className="flex items-center gap-2 text-sm font-bold text-[#2D1748]">
            <ShieldCheck className="size-4 text-[#6840A8]" aria-hidden="true" />
            DTI Business Registration
          </h2>
          <div className="flex items-center gap-1">
            {DTI_PERMIT_IMAGE && (
              <>
                <button
                  type="button"
                  aria-label="Zoom out"
                  onClick={() => setZoom((z) => Math.max(1, z - 0.5))}
                  className="grid size-8 place-items-center rounded-full text-[#4A2A78] hover:bg-[#F4EEFF]"
                >
                  <ZoomOut className="size-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  aria-label="Zoom in"
                  onClick={() => setZoom((z) => Math.min(3, z + 0.5))}
                  className="grid size-8 place-items-center rounded-full text-[#4A2A78] hover:bg-[#F4EEFF]"
                >
                  <ZoomIn className="size-4" aria-hidden="true" />
                </button>
              </>
            )}
            <button
              ref={closeRef}
              type="button"
              aria-label="Close DTI registration"
              onClick={onClose}
              className="grid size-8 place-items-center rounded-full text-[#4A2A78] hover:bg-[#F4EEFF]"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        {DTI_PERMIT_IMAGE ? (
          <div className="overflow-auto bg-[#F7F2FF] p-3">
            {/* eslint-disable-next-line @next/next/no-img-element -- natural-size zoomable document */}
            <img
              src={DTI_PERMIT_IMAGE}
              alt="BunnyTicket DTI business name registration certificate"
              style={{ width: `${zoom * 100}%` }}
              className="mx-auto h-auto max-w-none rounded-lg transition-[width] duration-200"
            />
          </div>
        ) : (
          <div className="px-5 py-6 text-center">
            <p className="text-sm leading-relaxed text-[#5B5070]">
              Our DTI registration document has not been published on the website yet. For verification,
              please contact us directly or review our business terms.
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <Link
                href="/terms"
                onClick={onClose}
                className="inline-flex h-9 items-center rounded-full bg-[#6840A8] px-4 text-xs font-semibold text-white hover:bg-[#5A3592]"
              >
                View Terms &amp; Conditions
              </Link>
              <a
                href="https://www.instagram.com/bunnyticket.main"
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-9 items-center rounded-full border border-[#C9B2F2] px-4 text-xs font-semibold text-[#4A2A78] hover:bg-[#F4EEFF]"
              >
                Contact on Instagram
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
