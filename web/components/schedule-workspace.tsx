'use client'

import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScheduleCalendar } from '@/components/schedule-calendar'
import { SlotPicker } from '@/components/slot-picker'
import { useToast } from '@/components/toast-provider'
import type { ScheduleWithChore } from '@/types'
import { Frequency } from '@prisma/client'

interface ScheduleWorkspaceProps {
  initialSchedules: ScheduleWithChore[]
  availableChores: Array<{
    id: string
    title: string
    frequency: Frequency
  }>
}

export function ScheduleWorkspace({ initialSchedules, availableChores }: ScheduleWorkspaceProps) {
  const [schedules, setSchedules] = useState(
    [...initialSchedules].sort(
      (left, right) => new Date(left.scheduledFor).getTime() - new Date(right.scheduledFor).getTime()
    )
  )
  const [celebration, setCelebration] = useState<string | null>(null)
  const { showToast } = useToast()

  const upcomingCount = useMemo(() => schedules.length, [schedules])

  const handleScheduleCreated = (schedule: ScheduleWithChore) => {
    setSchedules((current) =>
      [...current, schedule].sort(
        (left, right) => new Date(left.scheduledFor).getTime() - new Date(right.scheduledFor).getTime()
      )
    )
  }

  const handleCompletion = async (choreId: string, scheduleId: string) => {
    const response = await fetch('/api/completions', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ choreId, scheduleId }),
    })

    const payload = await response.json()
    if (!response.ok) {
      showToast(payload.error || 'Could not complete scheduled chore', 'error')
      return
    }

    setSchedules((current) => current.filter((schedule) => schedule.id !== scheduleId))
    setCelebration('Scheduled task completed.')
    setTimeout(() => setCelebration(null), 1800)
  }

  const handleDelete = async (scheduleId: string) => {
    const response = await fetch(`/api/schedules/${scheduleId}`, {
      method: 'DELETE',
    })

    const payload = await response.json()
    if (!response.ok) {
      showToast(payload.error || 'Could not delete schedule', 'error')
      return
    }

    setSchedules((current) => current.filter((schedule) => schedule.id !== scheduleId))
    showToast('Schedule removed')
  }

  return (
    <motion.div className="space-y-6" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <AnimatePresence>
        {celebration ? (
          <motion.p
            key={celebration}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="rounded-[var(--radius-md)] border border-[var(--color-sage)]/40 bg-[var(--color-sage)]/15 p-3 text-sm text-[var(--color-charcoal)]"
          >
            {celebration}
          </motion.p>
        ) : null}
      </AnimatePresence>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Create Slot</CardTitle>
        </CardHeader>
        <CardContent>
          <SlotPicker availableChores={availableChores} onScheduleCreated={handleScheduleCreated} />
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-[var(--color-charcoal)]">Upcoming Schedule</h2>
        <span className="text-sm text-[var(--color-charcoal)]/70">{upcomingCount} slots</span>
      </div>

      <ScheduleCalendar schedules={schedules} onComplete={handleCompletion} onDelete={handleDelete} />
    </motion.div>
  )
}
