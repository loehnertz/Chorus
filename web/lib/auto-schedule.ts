import { db } from '@/lib/db'
import { startOfTodayUtc } from '@/lib/date'

/**
 * Auto-schedule all DAILY-frequency chores for a date range.
 *
 * When `through` is omitted, only start-of-day UTC for `now` is scheduled.
 * When provided, every day from start-of-day UTC for `now` through start-of-day
 * UTC for `through` (exclusive) gets schedules for all daily chores.
 *
 * Uses createMany with skipDuplicates (backed by the @@unique([choreId, scheduledFor])
 * constraint) so concurrent calls are safe and idempotent.
 *
 * Guardrail: generation is clamped to a maximum horizon to avoid runaway inserts.
 */
export async function ensureDailySchedules(
  now?: Date,
  through?: Date,
): Promise<{ created: number }> {
  const today = startOfTodayUtc(now)

  const maxDays = 90
  const maxThrough = new Date(today)
  maxThrough.setUTCDate(maxThrough.getUTCDate() + maxDays)

  const dailyChores = await db.chore.findMany({
    where: { frequency: 'DAILY' },
    select: { id: true },
  })

  if (dailyChores.length === 0) {
    return { created: 0 }
  }

  const days: Date[] = [today]
  if (through) {
    const end = startOfTodayUtc(through)
    const effectiveEnd = end > maxThrough ? maxThrough : end
    const cursor = new Date(today)
    cursor.setUTCDate(cursor.getUTCDate() + 1)
    while (cursor < effectiveEnd) {
      days.push(new Date(cursor))
      cursor.setUTCDate(cursor.getUTCDate() + 1)
    }
  }

  const data = days.flatMap((day) =>
    dailyChores.map((chore) => ({
      choreId: chore.id,
      scheduledFor: day,
      slotType: 'DAILY' as const,
      suggested: false,
    })),
  )

  const result = await db.schedule.createMany({ data, skipDuplicates: true })

  return { created: result.count }
}
