import { dayKeyUtc, startOfTodayUtc } from '@/lib/date'

export function computeStreakDaysUtc(
  completionDates: Date[],
  now = new Date(),
  holidayDayKeys?: Set<string>,
) {
  const uniqueDays = new Set(completionDates.map(dayKeyUtc))

  let streak = 0
  const cursor = startOfTodayUtc(now)
  let iterations = 0

  while (iterations++ < 400) {
    const key = dayKeyUtc(cursor)
    if (holidayDayKeys?.has(key)) {
      cursor.setUTCDate(cursor.getUTCDate() - 1)
      continue
    }
    if (uniqueDays.has(key)) {
      streak += 1
      cursor.setUTCDate(cursor.getUTCDate() - 1)
    } else {
      break
    }
  }

  return streak
}
