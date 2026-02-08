'use client'

import * as React from 'react'
import { toast } from 'sonner'
import { Bell, BellOff, Info } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

function base64UrlToUint8Array(base64Url: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64Url.length % 4)) % 4)
  const base64 = (base64Url + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const buf = new ArrayBuffer(raw.length)
  const out = new Uint8Array(buf)
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i)
  return out
}

async function getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined') return null
  if (!('serviceWorker' in navigator)) return null
  try {
    return await navigator.serviceWorker.ready
  } catch {
    return null
  }
}

export interface PushRemindersOptInProps {
  className?: string
}

export function PushRemindersOptIn({ className }: PushRemindersOptInProps) {
  const [supported, setSupported] = React.useState<boolean>(true)
  const [permission, setPermission] = React.useState<NotificationPermission | 'unsupported'>('default')
  const [enabled, setEnabled] = React.useState<boolean>(false)
  const [busy, setBusy] = React.useState<boolean>(false)

  React.useEffect(() => {
    const hasPush = typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator
    const hasManager = typeof window !== 'undefined' && 'PushManager' in window

    if (!hasPush || !hasManager) {
      setSupported(false)
      setPermission('unsupported')
      return
    }

    setPermission(Notification.permission)

    fetch('/api/push/subscription', { method: 'GET' })
      .then(async (r) => {
        if (!r.ok) return
        const data = (await r.json()) as { enabled?: boolean }
        setEnabled(Boolean(data.enabled))
      })
      .catch(() => {
        // Best effort.
      })
  }, [])

  const enable = async () => {
    if (busy) return
    setBusy(true)
    try {
      if (process.env.NODE_ENV === 'development') {
        toast.message('Push reminders are easiest to test in production build (service worker is disabled in dev).')
      }

      const reg = await getServiceWorkerRegistration()
      if (!reg) {
        toast.error('Push is not ready yet. Try again after the app finishes loading.')
        return
      }

      const result = await Notification.requestPermission()
      setPermission(result)
      if (result !== 'granted') {
        toast.error('Notifications not enabled')
        return
      }

      const publicKey = process.env.NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY
      if (!publicKey) {
        toast.error('Missing VAPID public key (NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY)')
        return
      }

      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: base64UrlToUint8Array(publicKey),
      })

      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone

      const res = await fetch('/api/push/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          timezone,
        }),
      })

      if (!res.ok) {
        toast.error('Failed to enable reminders')
        return
      }

      setEnabled(true)
      toast.success('Reminders enabled')
    } catch {
      toast.error('Failed to enable reminders')
    } finally {
      setBusy(false)
    }
  }

  const disable = async () => {
    if (busy) return
    setBusy(true)
    try {
      const reg = await getServiceWorkerRegistration()
      if (!reg) {
        // Still attempt DB cleanup.
        await fetch('/api/push/subscription', { method: 'DELETE' })
        setEnabled(false)
        toast.message('Reminders disabled')
        return
      }

      const sub = await reg.pushManager.getSubscription()
      const endpoint = sub?.endpoint

      try {
        await sub?.unsubscribe()
      } catch {
        // Best effort
      }

      const res = await fetch('/api/push/subscription', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: endpoint ? JSON.stringify({ endpoint }) : JSON.stringify({}),
      })

      if (!res.ok && res.status !== 204) {
        toast.error('Failed to disable reminders')
        return
      }

      setEnabled(false)
      toast.message('Reminders disabled')
    } catch {
      toast.error('Failed to disable reminders')
    } finally {
      setBusy(false)
    }
  }

  const statusLabel = (() => {
    if (!supported) return 'Not supported on this device/browser'
    if (permission === 'denied') return 'Blocked in browser settings'
    if (enabled) return 'Enabled'
    return 'Off'
  })()

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle className="text-xl md:text-2xl">Reminders</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-3 text-sm text-[var(--foreground)]/70">
          <Info className="mt-0.5 h-4 w-4 text-[var(--color-terracotta)]" aria-hidden="true" />
          <p>
            Get a daily reminder when you still have tasks scheduled for today.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs uppercase tracking-wide font-[var(--font-display)] text-[var(--foreground)]/50">
            Status: {statusLabel}
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              onClick={enable}
              disabled={!supported || busy || enabled || permission === 'denied'}
              className={cn(!enabled && 'gap-2')}
            >
              <Bell className="h-4 w-4" aria-hidden="true" />
              Enable
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={disable}
              disabled={!supported || busy || !enabled}
              className="gap-2"
            >
              <BellOff className="h-4 w-4" aria-hidden="true" />
              Disable
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
