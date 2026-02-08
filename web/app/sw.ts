import { defaultCache } from '@serwist/next/worker'
import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist'
import { NetworkOnly, Serwist } from 'serwist'

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined
  }
}

declare const self: ServiceWorkerGlobalScope

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    {
      matcher: ({ url }) => url.origin === self.location.origin && url.pathname.startsWith('/api/'),
      handler: new NetworkOnly(),
    },
    ...defaultCache,
  ],
  fallbacks: {
    entries: [
      {
        url: '/~offline',
        matcher({ request }) {
          return request.destination === 'document'
        },
      },
    ],
  },
})

serwist.addEventListeners()

self.addEventListener('push', (event) => {
  const data = (() => {
    try {
      return event.data?.json() as unknown
    } catch {
      return null
    }
  })()

  const payload = (data && typeof data === 'object') ? (data as Record<string, unknown>) : {}
  const title = typeof payload.title === 'string' ? payload.title : 'Chorus'
  const body = typeof payload.body === 'string' ? payload.body : ''
  const url = typeof payload.url === 'string' ? payload.url : '/dashboard'
  const tag = typeof payload.tag === 'string' ? payload.tag : undefined

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag,
      data: { url },
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = (event.notification.data && typeof event.notification.data === 'object')
    ? (event.notification.data as { url?: string }).url
    : undefined

  const target = url && url.startsWith('/') ? url : '/dashboard'

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      for (const client of allClients) {
        if ('focus' in client) {
          // If any Chorus window exists, focus it and optionally navigate.
          await (client as WindowClient).focus()
          if ('navigate' in client) {
            try {
              await (client as WindowClient).navigate(target)
            } catch {
              // Best effort
            }
          }
          return
        }
      }

      await self.clients.openWindow(target)
    })()
  )
})
