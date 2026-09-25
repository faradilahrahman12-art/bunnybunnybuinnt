import { SiteHeader } from '@/components/site-header'
import { Reviews } from '@/components/reviews'
import { SiteFooter } from '@/components/site-footer'
import { AdminTabGate } from '@/components/admin-tab-gate'

export const metadata = {
  title: 'Reviews — Bunnyticket',
  description: 'Real reviews from real fans across 9 countries.',
}

export default function ReviewsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <Reviews />
      </main>
      <SiteFooter />
      <AdminTabGate />
    </div>
  )
}
