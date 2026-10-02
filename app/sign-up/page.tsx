import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth, safeRedirect } from '@/lib/auth'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { AuthForm } from '@/components/auth/auth-form'

export const metadata = {
  title: 'Create Account — Bunnyticket',
  description: 'Create an account to book tickets and manage your orders.',
}

export default async function SignUpPage({ searchParams }: { searchParams: Promise<{ redirect?: string }> }) {
  const redirectTo = safeRedirect((await searchParams).redirect)
  const session = await auth.api.getSession({ headers: await headers() })
  if (session?.user) redirect(redirectTo)

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 px-4 py-10 sm:py-16">
        <AuthForm mode="sign-up" redirectTo={redirectTo} />
      </main>
      <SiteFooter />
    </div>
  )
}
