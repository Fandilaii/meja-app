import type { Metadata, Viewport } from 'next'
import { Fraunces, DM_Sans } from 'next/font/google'
import Script from 'next/script'
import './globals.css'

const fraunces = Fraunces({
  variable: '--font-fraunces',
  subsets: ['latin'],
  axes: ['opsz', 'SOFT', 'WONK'],
})

const dmSans = DM_Sans({
  variable: '--font-dm-sans',
  subsets: ['latin'],
})

export const viewport: Viewport = {
  themeColor: '#0F0E0D',
}

export const metadata: Metadata = {
  title: 'Meja — Reservasi Restoran Jakarta',
  description: 'Reservasi restoran terbaik Jakarta. Temukan meja yang sempurna.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Meja',
  },
  openGraph: {
    title: 'Meja — Reservasi Restoran Jakarta',
    description: 'Temukan dan reservasi meja di restoran terbaik Jakarta.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="id" className={`${fraunces.variable} ${dmSans.variable} h-full`}>
      <body className="min-h-full antialiased">
        {children}
        <Script
          id="sw-register"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `if ('serviceWorker' in navigator) { navigator.serviceWorker.register('/sw.js') }`,
          }}
        />
      </body>
    </html>
  )
}
