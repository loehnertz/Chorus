import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'Chorus',
    short_name: 'Chorus',
    description: 'Slot-based chore tracking for your household.',
    // Use a public, non-redirecting entry point for installability checks.
    // If a user is already authenticated, /sign-in will redirect server-side to /dashboard.
    start_url: '/sign-in',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#F8F7F4',
    theme_color: '#F8F7F4',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon.png',
        sizes: '1024x1024',
        type: 'image/png',
      },
    ],
  }
}
