'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { signOut, useSession } from '@/lib/auth-client'

export function SignOutButton() {
  const { data: session } = useSession()
  const router = useRouter()
  const [pending, setPending] = useState(false)

  if (!session?.user) return null

  async function handleSignOut() {
    setPending(true)
    try {
      await signOut()
      router.push('/')
      router.refresh()
    } finally {
      setPending(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="gap-1.5 rounded-full text-muted-foreground"
      onClick={handleSignOut}
      disabled={pending}
      aria-label="Sign out"
    >
      <LogOut className="size-3.5" />
      <span className="hidden sm:inline">{pending ? 'Signing out…' : 'Sign Out'}</span>
    </Button>
  )
}
