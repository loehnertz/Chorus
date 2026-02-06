'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChoreCard } from '@/components/chore-card'
import type { ScheduleWithChore } from '@/types'

interface ScheduleCalendarProps {
  schedules: ScheduleWithChore[]
  onComplete: (choreId: string, scheduleId: string) => Promise<void> | void
  onDelete: (scheduleId: string) => Promise<void> | void
}

export function ScheduleCalendar({ schedules, onComplete, onDelete }: ScheduleCalendarProps) {
  const groupedSchedules = useMemo(() => {
    return schedules.reduce<Record<string, ScheduleWithChore[]>>((accumulator, schedule) => {
      const key = new Date(schedule.scheduledFor).toDateString()
      if (!accumulator[key]) {
        accumulator[key] = []
      }

      accumulator[key].push(schedule)
      return accumulator
    }, {})
  }, [schedules])

  const dayKeys = useMemo(() => Object.keys(groupedSchedules), [groupedSchedules])

  if (dayKeys.length === 0) {
    return (
      <Card className="text-center">
        <CardHeader>
          <CardTitle className="text-lg">No scheduled slots yet</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-[var(--color-charcoal)]/70">
          Create a weekly or monthly slot to start pulling chores from your pools.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-7">
      {dayKeys.map((dayKey) => (
        <section key={dayKey} className="space-y-4">
          <h3 className="text-lg font-semibold tracking-tight text-[var(--color-charcoal)] sm:text-xl">
            {new Date(dayKey).toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'short',
              day: 'numeric',
            })}
          </h3>
          <div className="grid gap-5 lg:grid-cols-2">
            {groupedSchedules[dayKey].map((schedule) => (
              <ChoreCard
                key={schedule.id}
                chore={schedule.chore}
                onComplete={(choreId) => onComplete(choreId, schedule.id)}
                onDelete={() => onDelete(schedule.id)}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
