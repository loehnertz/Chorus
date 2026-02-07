import type { NextConfig } from 'next'
import { spawnSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import withSerwistInit from '@serwist/next'

const baseSecurityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
]

const securityHeaders =
  process.env.NODE_ENV === 'production'
    ? [
        ...baseSecurityHeaders,
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=63072000; includeSubDomains; preload',
        },
      ]
    : baseSecurityHeaders

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          ...securityHeaders,
          // Service workers should always be revalidated to pick up updates quickly.
          { key: 'Cache-Control', value: 'no-cache' },
        ],
      },
      {
        source: '/manifest.webmanifest',
        headers: [
          ...securityHeaders,
          // Avoid stale manifest metadata on clients/installers.
          { key: 'Cache-Control', value: 'no-cache' },
        ],
      },
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ]
  },
}

function getGitRevision(): string | null {
  try {
    const out = spawnSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf-8' }).stdout
    const trimmed = out?.trim()
    return trimmed ? trimmed : null
  } catch {
    return null
  }
}

const revision = process.env.VERCEL_GIT_COMMIT_SHA || getGitRevision() || randomUUID()

const withSerwist = withSerwistInit({
  swSrc: 'app/sw.ts',
  swDest: 'public/sw.js',
  additionalPrecacheEntries: [{ url: '/~offline', revision }],
  // Avoid service worker cache surprises in dev.
  // Test PWA behavior with `npm run build && npm run start`.
  disable: process.env.NODE_ENV === 'development',
})

export default withSerwist(nextConfig)
