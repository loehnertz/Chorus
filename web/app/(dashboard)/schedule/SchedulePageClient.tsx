'use client'

import * as React from 'react'

import { ScheduleView } from '@/components/schedule-view'
import { ScheduleLoadingSkeleton } from '@/components/schedule-loading-skeleton'

type ApiScheduleViewResponse = React.ComponentProps<typeof ScheduleView> & {
  userId: string
  year: number
  monthIndex: number
  todayDayKey: string
  initialSelectedDayKey: string
}

export function SchedulePageClient(props: { month: string; day?: string | null }) {
  const { month, day } = props
  const [data, setData] = React.useState<ApiScheduleViewResponse | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    let cancelled = false

    const run = async () => {
      setError(null)
      setData(null)
      try {
        const qs = new URLSearchParams()
        qs.set('month', month)
        if (day) qs.set('day', day)
        const res = await fetch(`/api/schedule-view?${qs.toString()}`)
        if (!res.ok) {
          const body = (await res.json().catch(() => null)) as null | { error?: string }
          throw new Error(body?.error || 'Failed to load schedule')
        }

        const next = (await res.json()) as ApiScheduleViewResponse
        if (cancelled) return
        setData(next)
      } catch (e) {
        if (cancelled) return
        setError(e instanceof Error ? e.message : 'Failed to load schedule')
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [month, day])

  if (error) {
    return (
      <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-4">
        <p className="text-sm font-[var(--font-display)] text-[var(--foreground)]">Schedule failed to load</p>
        <p className="mt-1 text-xs text-[var(--foreground)]/60">{error}</p>
      </div>
    )
  }

  if (!data) {
    return <ScheduleLoadingSkeleton />
  }

  return (
    <ScheduleView
      userId={data.userId}
      year={data.year}
      monthIndex={data.monthIndex}
      todayDayKey={data.todayDayKey}
      initialSelectedDayKey={data.initialSelectedDayKey}
      chores={data.chores}
      monthSchedules={data.monthSchedules}
      upcomingSchedules={data.upcomingSchedules}
      longRangeScheduledChoreIds={data.longRangeScheduledChoreIds}
      users={data.users}
    />
  )
}
