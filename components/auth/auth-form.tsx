'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AccountBenefits } from '@/components/auth/account-benefits'

type Mode = 'sign-in' | 'sign-up'

export function AuthForm({ mode, redirectTo }: { mode: Mode; redirectTo: string }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const isSignUp = mode === 'sign-up'
  const query = redirectTo !== '/' ? `?redirect=${encodeURIComponent(redirectTo)}` : ''

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setPending(true)
    const form = new FormData(e.currentTarget)
    const email = String(form.get('email') ?? '').trim()
    const password = String(form.get('password') ?? '')

    const { error: authError } = isSignUp
      ? await authClient.signUp.email({ email, password, name: String(form.get('name') ?? '').trim() || email })
      : await authClient.signIn.email({ email, password })

    if (authError) {
      setPending(false)
      setError(
        isSignUp
          ? 'We couldn\u2019t create your account. Check your details and try again.'
          : 'Incorrect email or password.',
      )
      return
    }
    router.push(redirectTo)
    router.refresh()
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-6">
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-2xl font-extrabold tracking-tight text-balance">
          {isSignUp ? 'Create your account' : 'Welcome back'}
        </h1>
        <p className="text-sm text-muted-foreground text-pretty">
          {isSignUp
            ? 'Sign up to book tickets and manage your orders.'
            : 'Log in to continue booking and manage your orders.'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 sm:p-6">
        {isSignUp && (
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" autoComplete="name" placeholder="Your name" required />
          </div>
        )}
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" required />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete={isSignUp ? 'new-password' : 'current-password'}
            minLength={8}
            required
          />
          {isSignUp && <p className="text-xs text-muted-foreground">At least 8 characters.</p>}
        </div>

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}

        <Button type="submit" className="h-11 w-full rounded-xl font-semibold" disabled={pending}>
          {pending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
          {isSignUp ? 'Create Account' : 'Log In'}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          {isSignUp ? 'Already have an account? ' : 'New here? '}
          <Link
            href={`${isSignUp ? '/sign-in' : '/sign-up'}${query}`}
            className="font-medium text-foreground underline underline-offset-4"
          >
            {isSignUp ? 'Log in' : 'Create an account'}
          </Link>
        </p>
      </form>

      <AccountBenefits />
    </div>
  )
}
