import type { Frequency } from '@/types/frequency'
import {
  endOfBiweekUtc,
  endOfBimonthUtc,
  endOfHalfYearUtc,
  endOfMonthUtc,
  endOfWeekUtc,
  endOfYearUtc,
  startOfBiweekUtc,
  startOfBimonthUtc,
  startOfHalfYearUtc,
  startOfMonthUtc,
  startOfWeekUtc,
  startOfYearUtc,
} from '@/lib/date'
import { db } from '@/lib/db'

export const DASHBOARD_WARNING_REMAINING_THRESHOLD_DEFAULT = 0.25

export type DashboardPlanningWarning = {
  frequency: Exclude<Frequency, 'DAILY'>
  cycleStart: Date
  cycleEnd: Date
  remainingFraction: number
  unscheduledChores: Array<{ id: string; title: string }>
}

export function getCycleRangeUtc(
  frequency: Exclude<Frequency, 'DAILY'>,
  now: Date
): { start: Date; end: Date } {
  switch (frequency) {
    case 'WEEKLY': {
      const start = startOfWeekUtc(now)
      return { start, end: endOfWeekUtc(now) }
    }
    case 'BIWEEKLY': {
      const start = startOfBiweekUtc(now)
      return { start, end: endOfBiweekUtc(now) }
    }
    case 'MONTHLY': {
      const start = startOfMonthUtc(now)
      return { start, end: endOfMonthUtc(now) }
    }
    case 'BIMONTHLY': {
      const start = startOfBimonthUtc(now)
      return { start, end: endOfBimonthUtc(now) }
    }
    case 'SEMIANNUAL': {
      const start = startOfHalfYearUtc(now)
      return { start, end: endOfHalfYearUtc(now) }
    }
    case 'YEARLY': {
      const start = startOfYearUtc(now)
      return { start, end: endOfYearUtc(now) }
    }
  }
}

export function getRemainingFractionUtc(range: { start: Date; end: Date }, now: Date) {
  const startMs = range.start.getTime()
  const endMs = range.end.getTime()
  const nowMs = now.getTime()
  const total = endMs - startMs
  if (total <= 0) return 0

  const clamped = Math.min(Math.max(nowMs, startMs), endMs)
  const elapsed = (clamped - startMs) / total
  const remaining = 1 - elapsed
  return Math.min(1, Math.max(0, remaining))
}

export function shouldShowPlanningWarning(args: {
  range: { start: Date; end: Date }
  now: Date
  remainingThreshold: number
}) {
  const remaining = getRemainingFractionUtc(args.range, args.now)
  return remaining <= args.remainingThreshold
}

const WARN_FREQUENCIES: Array<Exclude<Frequency, 'DAILY'>> = [
  'WEEKLY',
  'BIWEEKLY',
  'MONTHLY',
  'BIMONTHLY',
  'SEMIANNUAL',
  'YEARLY',
]

export async function getDashboardPlanningWarnings(
  now: Date,
  opts?: { remainingThreshold?: number }
): Promise<DashboardPlanningWarning[]> {
  const remainingThreshold = opts?.remainingThreshold ?? DASHBOARD_WARNING_REMAINING_THRESHOLD_DEFAULT

  const lateFrequencies = WARN_FREQUENCIES.filter((frequency) => {
    const range = getCycleRangeUtc(frequency, now)
    return shouldShowPlanningWarning({ range, now, remainingThreshold })
  })

  if (lateFrequencies.length === 0) return []

  const chores = await db.chore.findMany({
    where: { frequency: { in: lateFrequencies } },
    select: { id: true, title: true, frequency: true },
    orderBy: { title: 'asc' },
  })

  const choresByFreq = new Map<Exclude<Frequency, 'DAILY'>, Array<{ id: string; title: string }>>()
  for (const c of chores) {
    const freq = c.frequency as Exclude<Frequency, 'DAILY'>
    if (!choresByFreq.has(freq)) choresByFreq.set(freq, [])
    choresByFreq.get(freq)!.push({ id: c.id, title: c.title })
  }

  const warnings = await Promise.all(
    lateFrequencies.map(async (frequency) => {
      const cycle = getCycleRangeUtc(frequency, now)

      const allChores = choresByFreq.get(frequency) ?? []
      if (allChores.length === 0) return null

      const scheduled = await db.schedule.findMany({
        where: {
          hidden: false,
          scheduledFor: { gte: cycle.start, lt: cycle.end },
          chore: { frequency },
        },
        distinct: ['choreId'],
        select: { choreId: true },
      })
      const scheduledIds = new Set(scheduled.map((s) => s.choreId))

      const unscheduledChores = allChores.filter((c) => !scheduledIds.has(c.id))
      if (unscheduledChores.length === 0) return null

      return {
        frequency,
        cycleStart: cycle.start,
        cycleEnd: cycle.end,
        remainingFraction: getRemainingFractionUtc(cycle, now),
        unscheduledChores,
      } satisfies DashboardPlanningWarning
    }),
  )

  return warnings.filter((w): w is DashboardPlanningWarning => w !== null)
}
