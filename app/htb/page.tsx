import { redirect } from 'next/navigation'

export const metadata = {
  robots: { index: false, follow: false },
}

export default function HtbRedirect() {
  redirect('/help-to-buy')
}
