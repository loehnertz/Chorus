import { dayKeyUtc, startOfTodayUtc } from '@/lib/date'

export function computeStreakDaysUtc(completionDates: Date[], now = new Date()) {
  const uniqueDays = new Set(completionDates.map(dayKeyUtc))

  let streak = 0
  const cursor = startOfTodayUtc(now)

  while (uniqueDays.has(dayKeyUtc(cursor))) {
    streak += 1
    cursor.setUTCDate(cursor.getUTCDate() - 1)
  }

  return streak
}
