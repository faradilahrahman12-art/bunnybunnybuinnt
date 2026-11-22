'use client'

import { Sparkles, Ticket, X } from 'lucide-react'

type Props = {
  onClose: () => void
  onSelect: (sectionId: 'resale' | 'help-to-buy') => void
}

export function BunnyTicketOrderNowPopup({ onClose, onSelect }: Props) {
  return (
    <aside
      role="dialog"
      aria-labelledby="bt-order-title"
      aria-describedby="bt-order-desc"
      className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-[60] mx-auto max-w-sm animate-in fade-in slide-in-from-bottom-4 duration-300 motion-reduce:animate-none sm:inset-x-auto sm:bottom-6 sm:right-6 sm:mx-0 sm:w-[340px]"
    >
      <div className="relative rounded-[20px] border border-[#C9B2F2] bg-white p-4 shadow-[0_18px_44px_-14px_rgba(104,64,168,0.55)]">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close order popup"
          className="absolute right-2.5 top-2.5 grid size-8 place-items-center rounded-full text-[#6B6080] transition-colors hover:bg-[#F4EEFF] hover:text-[#2D1748]"
        >
          <X className="size-4" aria-hidden="true" />
        </button>

        <div className="flex items-start gap-3 pr-7">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#F1E9FF] text-[#6840A8]">
            <Ticket className="size-4.5" aria-hidden="true" />
          </span>
          <div>
            <h2 id="bt-order-title" className="text-[15px] font-bold leading-tight text-[#4A2A78]">
              Ready for Your Next Concert?
            </h2>
            <p id="bt-order-desc" className="mt-1 text-xs leading-relaxed text-[#5B5070]">
              Find your favorite concert tickets or let BunnyTicket assist you with official ticket sales!
            </p>
          </div>
        </div>

        <div className="mt-3.5 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onSelect('resale')}
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-[#6840A8] px-3 text-xs font-semibold text-white transition-colors hover:bg-[#5A3592]"
          >
            <Ticket className="size-3.5" aria-hidden="true" />
            Browse Resale
          </button>
          <button
            type="button"
            onClick={() => onSelect('help-to-buy')}
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-[#C9B2F2] bg-[#F7F2FF] px-3 text-xs font-semibold text-[#4A2A78] transition-colors hover:bg-[#EEE4FF]"
          >
            <Sparkles className="size-3.5" aria-hidden="true" />
            Help to Buy
          </button>
        </div>
      </div>
    </aside>
  )
}
