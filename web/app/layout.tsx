import type { Metadata } from 'next'
import { Merriweather, Outfit } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'

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
  title: 'Chorus',
  description: 'Slot-based chore tracking for your household.',
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
      </body>
    </html>
  )
}
