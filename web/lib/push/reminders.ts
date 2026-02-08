import type { Frequency } from '@/types/frequency'

export type ReminderKind = 'morning' | 'evening'

export type IncompleteSchedule = {
  id: string
  scheduledFor: Date
  chore: {
    title: string
    frequency: Frequency
    assignments: Array<{ userId: string }>
  }
}

export function getLocalDayKey(date: Date, timeZone: string): string {
  // YYYY-MM-DD in the provided time zone.
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)

  const year = parts.find((p) => p.type === 'year')?.value
  const month = parts.find((p) => p.type === 'month')?.value
  const day = parts.find((p) => p.type === 'day')?.value
  if (!year || !month || !day) {
    return date.toISOString().slice(0, 10)
  }
  return `${year}-${month}-${day}`
}

export function getLocalTimeHM(date: Date, timeZone: string): { hour: number; minute: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date)

  const hourRaw = parts.find((p) => p.type === 'hour')?.value
  const minuteRaw = parts.find((p) => p.type === 'minute')?.value
  const hour = hourRaw ? Number(hourRaw) : NaN
  const minute = minuteRaw ? Number(minuteRaw) : NaN
  return {
    hour: Number.isFinite(hour) ? hour : date.getUTCHours(),
    minute: Number.isFinite(minute) ? minute : date.getUTCMinutes(),
  }
}

export function shouldSendReminder(now: Date, timeZone: string, kind: ReminderKind): { send: boolean; dayKey: string } {
  const tz = timeZone?.trim() ? timeZone.trim() : 'UTC'
  const dayKey = getLocalDayKey(now, tz)
  const { hour } = getLocalTimeHM(now, tz)

  // Robust windows for 10-minute cron cadence.
  // Morning: 08:00-11:59, Evening: 17:00-20:59
  if (kind === 'morning') {
    return { send: hour >= 8 && hour <= 11, dayKey }
  }

  return { send: hour >= 17 && hour <= 20, dayKey }
}

export function filterSchedulesForUser(schedules: IncompleteSchedule[], userId: string): IncompleteSchedule[] {
  return schedules.filter((s) => {
    const assignees = s.chore.assignments
    if (!assignees || assignees.length === 0) return true
    return assignees.some((a) => a.userId === userId)
  })
}

export function buildReminderNotificationPayload(opts: {
  kind: ReminderKind
  dayKey: string
  incomplete: Array<{ title: string }>
}): {
  title: string
  body: string
  url: string
  tag: string
} {
  const count = opts.incomplete.length
  const top = opts.incomplete.slice(0, 3).map((t) => t.title)

  const title = count === 1 ? 'Chorus: 1 task today' : `Chorus: ${count} tasks today`
  const suffix = count > 3 ? `\n…and ${count - 3} more` : ''
  const body = top.length ? `${top.join('\n')}${suffix}` : 'Open Chorus to plan your day.'
  const url = '/dashboard'
  const tag = `chorus-reminder-${opts.kind}-${opts.dayKey}`

  return { title, body, url, tag }
}
