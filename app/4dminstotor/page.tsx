import { AdminDashboard } from '@/components/admin/admin-dashboard'
import { getAdminAccount } from '@/lib/admin-auth'
import { getAllEvents } from '@/lib/events'
import { getSubmitContent } from '@/lib/settings'
import { getQrphMerchants } from '@/lib/qrph'
import { getReviews } from '@/lib/reviews'
import { getAllOrders } from '@/app/actions/orders'

export const metadata = {
  title: 'Admin — Bunnyticket',
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; new?: string; section?: string }>
}) {
  const account = await getAdminAccount()
  const [events, orders, submitContent, merchants, reviews] = await Promise.all([
    getAllEvents(),
    getAllOrders(),
    getSubmitContent(),
    getQrphMerchants({ includeInactive: true }),
    getReviews({ includeHidden: true }),
  ])
  const sp = await searchParams
  const initialTab = sp.tab === 'help_to_buy' ? 'help_to_buy' : 'resale'
  const initialSection =
    sp.section === 'orders'
      ? 'orders'
      : sp.section === 'submit'
        ? 'submit'
        : sp.section === 'qrph'
          ? 'qrph'
          : sp.section === 'reviews'
            ? 'reviews'
            : 'events'
  return (
    <AdminDashboard
      account={account}
      events={events}
      orders={orders}
      submitContent={submitContent}
      merchants={merchants}
      reviews={reviews}
      initialTab={initialTab}
      initialSection={initialSection}
      initialAdding={sp.new === '1'}
    />
  )
}
