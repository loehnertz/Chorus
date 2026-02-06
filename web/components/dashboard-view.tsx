import { CalendarCheck } from 'lucide-react'
import type { Frequency } from '@/types/frequency'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { DashboardStats, type DashboardStatsData } from '@/components/dashboard-stats'
import { TodaysTasks, type TodaysTask } from '@/components/todays-tasks'
import { FrequencyBadge } from '@/components/ui/frequency-badge'

export type RecentActivityItem = {
  id: string
  title: string
  frequency: Frequency
  userName: string
  completedAtLabel: string
}

export interface DashboardViewProps {
  stats: DashboardStatsData
  todaysTasks: TodaysTask[]
  recentActivity: RecentActivityItem[]
}

export function DashboardView({ stats, todaysTasks, recentActivity }: DashboardViewProps) {
  return (
    <div className="space-y-6">
      <DashboardStats stats={stats} />

      <Card>
        <CardHeader>
          <CardTitle className="text-xl md:text-2xl">{"Today's Tasks"}</CardTitle>
        </CardHeader>
        <CardContent>
          {todaysTasks.length === 0 ? (
            <EmptyState
              icon={CalendarCheck}
              title="All clear!"
              subtitle="No tasks scheduled for today"
            />
          ) : (
            <TodaysTasks tasks={todaysTasks} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl md:text-2xl">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {recentActivity.length === 0 ? (
            <p className="text-sm text-[var(--color-charcoal)]/50">No completions yet.</p>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((item) => (
                <div key={item.id} className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-[var(--font-display)] text-[var(--color-charcoal)]">
                      {item.title}
                    </p>
                    <p className="mt-0.5 text-xs text-[var(--color-charcoal)]/50">
                      {item.userName} · {item.completedAtLabel}
                    </p>
                  </div>
                  <FrequencyBadge frequency={item.frequency} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
