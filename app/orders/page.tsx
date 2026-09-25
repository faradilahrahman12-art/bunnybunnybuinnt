import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { OrdersDashboard } from '@/components/orders/orders-dashboard'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'My Orders — Bunnyticket',
  description: 'View all your orders and track their progress in one place.',
}

export default function OrdersPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 px-4 py-8">
        <OrdersDashboard />
      </main>
      <SiteFooter />
    </div>
  )
}
