'use client'

import * as React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { TodayProgress } from '@/lib/gamification'

export type DashboardStatsData = {
  completedTotal: number
  completedThisWeek: number
  streakDays: number
  choresCount: number
}

export interface DashboardStatsProps {
  stats: DashboardStatsData
  todayProgress?: TodayProgress
  isOnHoliday?: boolean
  className?: string
}

function StatCard({
  label,
  value,
  sub,
  subTone = 'neutral',
  href,
  extra,
}: {
  label: string
  value: number
  sub?: string
  subTone?: 'neutral' | 'positive'
  href?: string
  extra?: React.ReactNode
}) {
  const content = (
    <>
      <p className="text-xs uppercase tracking-wide font-[var(--font-display)] text-[var(--foreground)]/50">
        {label}
      </p>
      <p className="mt-1 text-3xl font-[var(--font-display)] font-bold text-[var(--foreground)]">
        {value}
      </p>
      {sub ? (
        <p
          className={cn(
            'mt-1 text-xs',
            subTone === 'positive'
              ? 'text-[var(--color-sage)]'
              : 'text-[var(--foreground)]/50'
          )}
        >
          {sub}
        </p>
      ) : null}
      {extra}
    </>
  )

  const cardClass = cn(
    'bg-[var(--surface)] rounded-[var(--radius-md)] p-4 sm:p-5 shadow-[var(--shadow-soft)] border border-[var(--border)]',
    href && 'hover:shadow-[var(--shadow-lifted)] hover:-translate-y-0.5 transition-all duration-200'
  )

  if (href) {
    return (
      <Link href={href} prefetch={false} className={cardClass}>
        {content}
      </Link>
    )
  }

  return <div className={cardClass}>{content}</div>
}

export function DashboardStats({ stats, todayProgress, isOnHoliday, className }: DashboardStatsProps) {
  const [streakPulse, setStreakPulse] = React.useState(false)
  const prevStreakRef = React.useRef(stats.streakDays)

  React.useEffect(() => {
    const prev = prevStreakRef.current
    prevStreakRef.current = stats.streakDays
    if (stats.streakDays <= prev) return

    setStreakPulse(true)
    const timer = window.setTimeout(() => setStreakPulse(false), 320)
    return () => window.clearTimeout(timer)
  }, [stats.streakDays])

  const streakSub = (() => {
    if (isOnHoliday) return 'on holiday'
    if (stats.streakDays > 0) return 'consecutive days'
    return 'start today'
  })()

  return (
    <div className={cn('grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5', className)}>
      <StatCard
        label="Completed"
        value={stats.completedTotal}
        sub={`+${stats.completedThisWeek} this week`}
        subTone={stats.completedThisWeek > 0 ? 'positive' : 'neutral'}
        extra={
          todayProgress ? (
            <div className="mt-2.5">
              <div className="flex items-center justify-between text-[11px] text-[var(--foreground)]/60">
                <span>Today: {todayProgress.completed} / {todayProgress.total}</span>
                <span>{todayProgress.percent}%</span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[var(--surface-2)]">
                <motion.div
                  className="h-full rounded-full bg-[var(--color-sage)]"
                  initial={false}
                  animate={{ width: `${todayProgress.percent}%` }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                />
              </div>
            </div>
          ) : null
        }
      />
      <StatCard label="This Week" value={stats.completedThisWeek} sub="since Monday" />
      <motion.div
        initial={false}
        animate={streakPulse ? { scale: [1, 1.02, 1] } : { scale: 1 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        <StatCard
          label="Streak"
          value={stats.streakDays}
          sub={streakSub}
          subTone={stats.streakDays > 0 || isOnHoliday ? 'positive' : 'neutral'}
        />
      </motion.div>
      <StatCard label="Chores" value={stats.choresCount} sub="in the pool" href="/chores" />
    </div>
  )
}
