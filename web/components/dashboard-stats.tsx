import { cn } from '@/lib/utils'

export type DashboardStatsData = {
  completedTotal: number
  completedThisWeek: number
  streakDays: number
  choresCount: number
}

export interface DashboardStatsProps {
  stats: DashboardStatsData
  className?: string
}

function StatCard({
  label,
  value,
  sub,
  subTone = 'neutral',
}: {
  label: string
  value: number
  sub?: string
  subTone?: 'neutral' | 'positive'
}) {
  return (
    <div className="bg-white rounded-[var(--radius-md)] p-4 shadow-[var(--shadow-soft)] border border-[var(--color-cream)]">
      <p className="text-xs uppercase tracking-wide font-[var(--font-display)] text-[var(--color-charcoal)]/50">
        {label}
      </p>
      <p className="mt-1 text-3xl font-[var(--font-display)] font-bold text-[var(--color-charcoal)]">
        {value}
      </p>
      {sub ? (
        <p
          className={cn(
            'mt-1 text-xs',
            subTone === 'positive'
              ? 'text-[var(--color-sage)]'
              : 'text-[var(--color-charcoal)]/50'
          )}
        >
          {sub}
        </p>
      ) : null}
    </div>
  )
}

export function DashboardStats({ stats, className }: DashboardStatsProps) {
  return (
    <div className={cn('grid grid-cols-2 md:grid-cols-4 gap-4', className)}>
      <StatCard
        label="Completed"
        value={stats.completedTotal}
        sub={`+${stats.completedThisWeek} this week`}
        subTone={stats.completedThisWeek > 0 ? 'positive' : 'neutral'}
      />
      <StatCard label="This Week" value={stats.completedThisWeek} sub="since Monday" />
      <StatCard
        label="Streak"
        value={stats.streakDays}
        sub={stats.streakDays > 0 ? 'consecutive days' : 'start today'}
        subTone={stats.streakDays > 0 ? 'positive' : 'neutral'}
      />
      <StatCard label="Chores" value={stats.choresCount} sub="in the pool" />
    </div>
  )
}
