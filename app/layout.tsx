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
  metadataBase: new URL('https://www.bunnyticket.store'),

  title: {
    default: 'BunnyTicket | Concert & Event Ticket Assistance',
    template: '%s | BunnyTicket',
  },

  description:
    'BunnyTicket provides concert and event ticket purchase assistance for local and international events. Explore upcoming events and ticketing options.',

  keywords: [
    'BunnyTicket',
    'Bunny Ticket',
    'BunnyTicket Store',
    'bunnyticket.store',
    'concert tickets',
    'concert ticket assistance',
    'event ticket assistance',
    'ticket assistance Philippines',
  ],

  alternates: {
    canonical: '/',
  },

  openGraph: {
    title: 'BunnyTicket | Concert & Event Ticket Assistance',
    description:
      'Concert and event ticket purchase assistance for local and international events.',
    url: 'https://www.bunnyticket.store',
    siteName: 'BunnyTicket',
    type: 'website',
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },

  generator: 'BunnyTicket',
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
