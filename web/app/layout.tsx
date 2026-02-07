import type { Metadata, Viewport } from 'next'
import { Merriweather, Outfit } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'
import { ServiceWorkerRegistration } from '@/components/pwa/service-worker-registration'

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-display',
})

const merriweather = Merriweather({
  subsets: ['latin'],
  weight: ['300', '400', '700'],
  variable: '--font-body',
})

export const metadata: Metadata = {
  applicationName: 'Chorus',
  title: 'Chorus',
  description: 'Slot-based chore tracking for your household.',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Chorus',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F8F7F4' },
    { media: '(prefers-color-scheme: dark)', color: '#1E2030' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    // suppressHydrationWarning on <html> ignores browser extension attributes (e.g., LanguageTool)
    // while still catching real hydration issues elsewhere in the app
    <html lang="en" suppressHydrationWarning>
      <body className={`${outfit.variable} ${merriweather.variable} antialiased`}>
        {children}
        <Toaster />
        <ServiceWorkerRegistration />
      </body>
    </html>
  )
}
