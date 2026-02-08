import { CalendarCheck } from 'lucide-react'
import type { Frequency } from '@/types/frequency'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { DashboardStats, type DashboardStatsData } from '@/components/dashboard-stats'
import { TodaysTasks, type TodaysTask } from '@/components/todays-tasks'
import { DashboardPlanningWarnings } from '@/components/dashboard-planning-warnings'
import { PushRemindersOptIn } from '@/components/pwa/push-reminders-opt-in'
import { FrequencyBadge } from '@/components/ui/frequency-badge'
import { Avatar } from '@/components/ui/avatar'
import { LocalDateTime } from '@/components/ui/local-datetime'
import type { DashboardPlanningWarning } from '@/lib/dashboard-planning-warnings'

export type RecentActivityItem = {
  id: string
  title: string
  frequency: Frequency
  userId: string
  userName: string
  userImage?: string | null
  completedAtIso: string
}

export interface DashboardViewProps {
  userId: string
  stats: DashboardStatsData
  todaysTasks: TodaysTask[]
  recentActivity: RecentActivityItem[]
  planningWarnings?: DashboardPlanningWarning[]
}

export function DashboardView({ userId, stats, todaysTasks, recentActivity, planningWarnings }: DashboardViewProps) {
  return (
    <div className="space-y-7 md:space-y-8">
      <DashboardStats stats={stats} />

      <DashboardPlanningWarnings warnings={planningWarnings ?? []} />

      <PushRemindersOptIn />

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
            <TodaysTasks userId={userId} tasks={todaysTasks} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl md:text-2xl">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {recentActivity.length === 0 ? (
            <p className="text-sm text-[var(--foreground)]/50">No completions yet.</p>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((item) => (
                <div key={item.id} className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-2">
                    <Avatar
                      name={item.userName}
                      userId={item.userId}
                      imageUrl={item.userImage ?? null}
                      size="xs"
                      className="mt-0.5 shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-[var(--font-display)] text-[var(--foreground)]">
                        {item.title}
                      </p>
                      <p className="mt-0.5 text-xs text-[var(--foreground)]/50">
                        {item.userName} · <LocalDateTime iso={item.completedAtIso} />
                      </p>
                    </div>
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
