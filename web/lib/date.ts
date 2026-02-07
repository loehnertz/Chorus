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

function isIsoDateOnly(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
}

function isIsoDateTimeWithTimezone(value: string) {
  // Require an explicit timezone offset or Z to avoid local-time ambiguity.
  return /^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(value)
}

/**
 * Parse a user/API-provided date value into a Date.
 *
 * Accepted inputs:
 * - Date instance
 * - ISO date-only string (YYYY-MM-DD) -> interpreted as UTC midnight
 * - ISO datetime string with explicit timezone (Z or +/-HH:MM)
 *
 * Rejected:
 * - ISO datetime without timezone (e.g. 2026-02-01T00:00:00)
 */
export function parseUtcDateInput(value: unknown): Date | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value
  }

  if (typeof value !== 'string') return null
  const raw = value.trim()
  if (!raw) return null

  if (isIsoDateOnly(raw)) {
    const [y, m, d] = raw.split('-').map((n) => Number(n))
    if (!y || !m || !d) return null
    const dt = new Date(Date.UTC(y, m - 1, d))
    return Number.isNaN(dt.getTime()) ? null : dt
  }

  if (raw.includes('T') && !isIsoDateTimeWithTimezone(raw)) {
    return null
  }

  const dt = new Date(raw)
  return Number.isNaN(dt.getTime()) ? null : dt
}
