import Link from 'next/link'
import { Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AccountBenefits } from '@/components/auth/account-benefits'

export function SignInRequired({ redirectTo }: { redirectTo: string }) {
  const query = `?redirect=${encodeURIComponent(redirectTo)}`

  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center gap-6 py-10 text-center sm:py-16">
      <div className="grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
        <Lock className="size-6" aria-hidden="true" />
      </div>
      <div className="flex flex-col gap-3">
        <h1 className="text-2xl font-extrabold tracking-tight text-balance sm:text-3xl">Sign in to continue</h1>
        <p className="text-sm leading-relaxed text-muted-foreground text-pretty">
          Create an account or log in before booking your ticket. Your account gives you access to your personal
          dashboard, where you can track your orders, receive order updates, view your ticket details, and leave a
          review after your transaction is completed.
        </p>
      </div>

      <div className="flex w-full flex-col gap-2 sm:flex-row">
        <Button className="h-11 flex-1 rounded-xl font-semibold" render={<Link href={`/sign-in${query}`} />}>
          Log In
        </Button>
        <Button
          variant="outline"
          className="h-11 flex-1 rounded-xl font-semibold"
          render={<Link href={`/sign-up${query}`} />}
        >
          Create Account
        </Button>
      </div>

      <div className="w-full">
        <AccountBenefits />
      </div>
    </div>
  )
}
