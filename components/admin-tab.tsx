'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import {
  ChevronUp,
  LayoutDashboard,
  Lock,
  PlusCircle,
  Ticket,
  Zap,
  Eye,
} from 'lucide-react'

const ITEMS = [
  {
    href: '/4dminstotor',
    label: 'Admin Dashboard',
    description: 'Manage all events',
    icon: LayoutDashboard,
  },
  {
    href: '/4dminstotor?tab=resale',
    label: 'Resale Events',
    description: 'Edit resale listings',
    icon: Ticket,
  },
  {
    href: '/4dminstotor?tab=help_to_buy',
    label: 'Help to Buy',
    description: 'Edit queue services',
    icon: Zap,
  },
  {
    href: '/4dminstotor?new=1',
    label: 'Add New Event',
    description: 'Create a listing',
    icon: PlusCircle,
  },
  {
    href: '/',
    label: 'View Live Site',
    description: 'See the public page',
    icon: Eye,
  },
]

export function AdminTab() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  return (
    <div ref={ref} className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2">
      {open && (
        <div className="absolute bottom-full left-1/2 mb-2 w-64 -translate-x-1/2 overflow-hidden rounded-2xl border border-border bg-popover shadow-xl">
          <div className="border-b border-border px-4 py-2.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Admin Quick Access
            </p>
          </div>
          <nav className="flex flex-col p-1.5">
            {ITEMS.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-3 py-2 text-left transition hover:bg-accent"
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="size-4" />
                  </span>
                  <span className="flex flex-col">
                    <span className="text-sm font-semibold text-foreground">{item.label}</span>
                    <span className="text-xs text-muted-foreground">{item.description}</span>
                  </span>
                </Link>
              )
            })}
          </nav>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-1.5 rounded-full border border-border bg-background/90 px-4 py-2 text-sm font-semibold text-foreground shadow-lg backdrop-blur transition hover:border-primary hover:text-primary"
      >
        <Lock className="size-3.5" />
        Admin
        <ChevronUp className={`size-3.5 transition-transform ${open ? '' : 'rotate-180'}`} />
      </button>
    </div>
  )
}
