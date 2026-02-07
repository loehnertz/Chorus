let didAttemptRegister = false

type LocationLike = {
  protocol: string
  hostname: string
}

function isProductionBuild(): boolean {
  return process.env.NODE_ENV === 'production'
}

function isSecureContextForServiceWorker(loc: LocationLike): boolean {
  // Chrome allows service workers on localhost over HTTP for development.
  const isLocalhost = loc.hostname === 'localhost' || loc.hostname === '127.0.0.1' || loc.hostname === '::1'

  return loc.protocol === 'https:' || isLocalhost
}

export async function registerServiceWorker(options?: {
  swUrl?: string
  scope?: string
  enabled?: boolean
  location?: LocationLike
}) {
  if (didAttemptRegister) return
  didAttemptRegister = true

  const enabled = options?.enabled ?? isProductionBuild()
  if (!enabled) return

  if (typeof window === 'undefined') return
  if (!('serviceWorker' in navigator)) return

  const loc = options?.location ?? { protocol: window.location.protocol, hostname: window.location.hostname }
  if (!isSecureContextForServiceWorker(loc)) return

  const swUrl = options?.swUrl ?? '/sw.js'
  const scope = options?.scope ?? '/'

  await navigator.serviceWorker.register(swUrl, { scope })
}
