'use client'

import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChoreCard } from '@/components/chore-card'
import { DashboardStats } from '@/components/dashboard-stats'
import type { ChoreWithMeta, ScheduleWithChore } from '@/types'

interface DashboardOverviewProps {
  userName: string
  initialTodayTasks: ScheduleWithChore[]
  initialAssignedChores: ChoreWithMeta[]
  stats: {
    assignedChores: number
    openToday: number
    completedThisWeek: number
    completedTotal: number
  }
}

export function DashboardOverview({
  userName,
  initialTodayTasks,
  initialAssignedChores,
  stats,
}: DashboardOverviewProps) {
  const [todayTasks, setTodayTasks] = useState(initialTodayTasks)
  const [assignedChores] = useState(initialAssignedChores)
  const [statValues, setStatValues] = useState(stats)
  const [error, setError] = useState('')

  const todayLabel = useMemo(
    () =>
      new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      }),
    []
  )

  const completeChore = async (choreId: string, scheduleId?: string) => {
    setError('')

    const response = await fetch('/api/completions', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ choreId, scheduleId }),
    })

    const payload = await response.json()
    if (!response.ok) {
      setError(payload.error || 'Could not mark chore complete')
      return
    }

    if (scheduleId) {
      setTodayTasks((current) => current.filter((task) => task.id !== scheduleId))
    }

    setStatValues((current) => ({
      ...current,
      openToday: scheduleId ? Math.max(0, current.openToday - 1) : current.openToday,
      completedThisWeek: current.completedThisWeek + 1,
      completedTotal: current.completedTotal + 1,
    }))
  }

  return (
    <div className="space-y-8">
      <section className="space-y-2">
        <h1 className="text-4xl font-semibold text-[var(--color-charcoal)]">Welcome back, {userName}</h1>
        <p className="text-[var(--color-charcoal)]/70">{todayLabel}</p>
      </section>

      <DashboardStats
        assignedChores={statValues.assignedChores}
        openToday={statValues.openToday}
        completedThisWeek={statValues.completedThisWeek}
        completedTotal={statValues.completedTotal}
      />

      {error ? (
        <div className="rounded-[var(--radius-md)] border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      ) : null}

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-[var(--color-charcoal)]">Today&apos;s Tasks</h2>
        {todayTasks.length === 0 ? (
          <Card className="p-4">
            <CardHeader className="mb-0 p-0">
              <CardTitle className="text-lg">All clear</CardTitle>
            </CardHeader>
            <CardContent className="p-0 text-sm text-[var(--color-charcoal)]/70">
              No scheduled tasks for today.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {todayTasks.map((task) => (
              <ChoreCard
                key={task.id}
                chore={task.chore}
                scheduleId={task.id}
                onComplete={completeChore}
              />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-[var(--color-charcoal)]">Your Assigned Chores</h2>
        {assignedChores.length === 0 ? (
          <Card className="p-4">
            <CardHeader className="mb-0 p-0">
              <CardTitle className="text-lg">No assignments yet</CardTitle>
            </CardHeader>
            <CardContent className="p-0 text-sm text-[var(--color-charcoal)]/70">
              Ask your household admin to assign chores to you.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {assignedChores.map((chore) => (
              <ChoreCard key={chore.id} chore={chore} onComplete={completeChore} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
