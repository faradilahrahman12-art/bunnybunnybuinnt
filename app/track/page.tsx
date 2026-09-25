import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { TrackOrder } from '@/components/track/track-order'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Track Your Order — Bunnyticket',
  description: 'Check your order status and details using your reference number.',
}

export default async function TrackPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>
}) {
  const { ref } = await searchParams

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 px-4 py-10">
        <TrackOrder initialRef={ref ?? ''} />
      </main>
      <SiteFooter />
    </div>
  )
}
