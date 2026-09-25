'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Logo } from '@/components/site-header'
import { loginAdmin } from '@/app/actions/events'
import { Lock } from 'lucide-react'

export function AdminLogin() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    startTransition(async () => {
      const res = await loginAdmin(username, password)
      if (res?.error) {
        setError(res.error)
      } else {
        router.refresh()
      }
    })
  }

  return (
    <div className="grid min-h-screen place-items-center bg-gradient-to-b from-primary/5 to-background px-4">
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-sm"
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="grid size-12 place-items-center rounded-full bg-primary/10 text-primary">
            <Lock className="size-5" />
          </span>
          <Logo />
          <h1 className="text-lg font-bold">Team Access</h1>
          <p className="text-sm text-muted-foreground">
            Restricted to Bunnyticket team &amp; editors. Sign in with your account.
          </p>
        </div>
        <div className="mt-6 space-y-4 text-left">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="your-username"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <Button type="submit" className="mt-6 w-full" disabled={pending || !username || !password}>
          {pending ? 'Signing in…' : 'Sign In'}
        </Button>
      </form>
    </div>
  )
}
