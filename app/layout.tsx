import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Plus_Jakarta_Sans, Poppins } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import { SupportButton } from '@/components/support-button'
import './globals.css'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-poppins',
  display: 'swap',
})

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-plus-jakarta-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Bunnyticket — Buy Concert Tickets From a Trusted Source',
  description:
    'Resale K-pop & live event tickets from verified sellers across Asia, plus help-to-buy queuing for sold-out shows. Over 20,000 orders fulfilled across 9 countries.',
  generator: 'v0.app',
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" translate="no" className={`light ${poppins.variable} ${plusJakartaSans.variable}`}>
      <head>
        <meta name="google" content="notranslate" />
      </head>
      <body className="notranslate font-sans font-medium antialiased">
        {children}
        <SupportButton />
        <Toaster />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
