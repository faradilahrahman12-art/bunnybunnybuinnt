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

  async function handleGoogleSignIn() {
  setError(null)
  setPending(true)

  try {
    const { error: authError } = await authClient.signIn.social({
      provider: 'google',
      callbackURL: redirectTo,
    })

    if (authError) {
      setError(authError.message ?? 'Google sign-in failed. Please try again.')
      setPending(false)
    }
  } catch {
    setError('Unable to connect to Google. Please try again.')
    setPending(false)
  }
}

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
        authError.code === 'ACCOUNT_SUSPENDED'
          ? authError.message ?? 'Your account has been suspended.'
          : isSignUp
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
          {!isSignUp && (
  <div className="text-right">
    <Link
      href="/forgot-password"
      className="text-sm font-medium text-primary hover:underline"
    >
      Forgot Password?
    </Link>
  </div>
)}
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

<div className="flex items-center gap-3 py-1">
  <div className="h-px flex-1 bg-border" />
  <span className="text-xs text-muted-foreground">OR</span>
  <div className="h-px flex-1 bg-border" />
</div>

<Button
  type="button"
  variant="outline"
  className="h-11 w-full rounded-xl font-semibold"
  disabled={pending}
  onClick={handleGoogleSignIn}
>
  {pending ? (
    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
  ) : (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
      <path fill="#4285F4" d="M21.35 12.22c0-.71-.06-1.39-.18-2.05H12v3.87h5.24a4.48 4.48 0 0 1-1.94 2.94v2.44h3.14c1.84-1.69 2.91-4.18 2.91-7.2Z" />
      <path fill="#34A853" d="M12 21.73c2.63 0 4.84-.87 6.45-2.35l-3.14-2.44c-.87.58-1.98.93-3.31.93-2.55 0-4.72-1.72-5.49-4.03H3.27v2.52A9.74 9.74 0 0 0 12 21.73Z" />
      <path fill="#FBBC05" d="M6.51 13.84a5.86 5.86 0 0 1 0-3.68V7.64H3.27a9.74 9.74 0 0 0 0 8.72l3.24-2.52Z" />
      <path fill="#EA4335" d="M12 6.13c1.43 0 2.72.49 3.73 1.46l2.79-2.79A9.35 9.35 0 0 0 12 2.27a9.74 9.74 0 0 0-8.73 5.37l3.24 2.52C7.28 7.85 9.45 6.13 12 6.13Z" />
    </svg>
  )}
  Continue with Google
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
