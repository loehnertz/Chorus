'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Dashboard route error:', error)
  }, [error])

  return (
    <div className="rounded-[var(--radius-lg)] border border-red-200 bg-red-50 p-6 text-red-800">
      <h2 className="text-xl font-semibold">Something went wrong</h2>
      <p className="mt-2 text-sm">The dashboard could not be rendered. Please try again.</p>
      <Button type="button" className="mt-4" onClick={reset}>
        Retry
      </Button>
    </div>
  )
}
