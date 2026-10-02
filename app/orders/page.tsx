import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { SignInRequired } from '@/components/auth/sign-in-required'
import { OrdersDashboard } from '@/components/orders/orders-dashboard'
import { getMyOrders } from '@/app/actions/orders'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'My Orders — Bunnyticket',
  description: 'View all your orders and track their progress in one place.',
}

export default async function OrdersPage() {
  const session = await auth.api.getSession({ headers: await headers() })

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 px-4 py-8">
        {session?.user ? (
          <OrdersDashboard
            initialOrders={await getMyOrders()}
            user={{ name: session.user.name, email: session.user.email }}
          />
        ) : (
          <SignInRequired redirectTo="/orders" />
        )}
      </main>
      <SiteFooter />
    </div>
  )
}
