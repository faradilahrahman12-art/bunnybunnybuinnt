import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Poppins } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import { SupportButton } from '@/components/support-button'
import { ThemeProvider } from '@/components/theme-provider'
import { AutoTheme } from '@/components/auto-theme'
import './globals.css'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-poppins',
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
    locale: 'en_US',
    images: [
      {
        url: '/bunny-logo.jpg',
        width: 1200,
        height: 630,
        alt: 'BunnyTicket — Concert & Event Ticket Assistance',
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    title: 'BunnyTicket | Concert & Event Ticket Assistance',
    description:
      'Concert and event ticket purchase assistance for local and international events.',
    images: ['/bunny-logo.jpg'],
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },

  // TODO: Paste the verification token from Google Search Console
  // (Settings > Ownership verification > HTML tag) between the quotes below,
  // then redeploy. This confirms you own bunnyticket.store and speeds up indexing.
  verification: {
    google: '',
  },

  generator: 'BunnyTicket',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  colorScheme: 'dark light',
  themeColor: '#1e1424',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) { 
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': 'https://www.bunnyticket.store/#website',
        url: 'https://www.bunnyticket.store/',
        name: 'BunnyTicket',
        alternateName: ['Bunny Ticket', 'BunnyTicket Store', 'bunnyticket'],
        description:
          'Concert and event ticket purchase assistance for local and international events.',
        publisher: {
          '@id': 'https://www.bunnyticket.store/#organization',
        },
        inLanguage: 'en',
      },
      {
        '@type': 'Organization',
        '@id': 'https://www.bunnyticket.store/#organization',
        name: 'BunnyTicket',
        alternateName: ['Bunny Ticket', 'BunnyTicket Store', 'bunnyticket'],
        url: 'https://www.bunnyticket.store/',
        description:
          'BunnyTicket provides concert and event ticket purchase assistance for local and international events.',
        logo: {
          '@type': 'ImageObject',
          '@id': 'https://www.bunnyticket.store/#logo',
          url: 'https://www.bunnyticket.store/bunny-logo.jpg',
          caption: 'BunnyTicket',
        },
        image: {
          '@id': 'https://www.bunnyticket.store/#logo',
        },
        sameAs: [
          'https://www.instagram.com/bunnyticket.main',
        ],
      },
    ],
  }
  return (
    <html lang="en" translate="no" suppressHydrationWarning className={poppins.variable}>
     <head>
  <meta name="google" content="notranslate" />

  <script
    type="application/ld+json"
    dangerouslySetInnerHTML={{
      __html: JSON.stringify(structuredData),
    }}
  />
</head>
      <body className="notranslate font-sans font-medium antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          storageKey="bunnyticket-theme"
          disableTransitionOnChange
        >
          <AutoTheme />
          {children}
          <SupportButton />
          <Toaster />
          {process.env.NODE_ENV === 'production' && <Analytics />}
        </ThemeProvider>
      </body>
    </html>
  )
}
