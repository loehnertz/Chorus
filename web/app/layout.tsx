import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Chorus',
  description: 'Slot-based chore tracking for households',
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
      <body className="antialiased">{children}</body>
    </html>
  )
}
