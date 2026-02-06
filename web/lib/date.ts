export function startOfTodayUtc(now = new Date()) {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
}

export function startOfTomorrowUtc(now = new Date()) {
  const start = startOfTodayUtc(now)
  const tomorrow = new Date(start)
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)
  return tomorrow
}

export function startOfWeekUtc(now = new Date()) {
  const start = startOfTodayUtc(now)
  const day = start.getUTCDay() // 0 (Sun) .. 6 (Sat)
  const daysSinceMonday = (day + 6) % 7
  start.setUTCDate(start.getUTCDate() - daysSinceMonday)
  return start
}

export function dayKeyUtc(date: Date) {
  return date.toISOString().slice(0, 10)
}
