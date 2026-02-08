import { db } from '@/lib/db'
import { startOfTodayUtc } from '@/lib/date'

const DAY_MS = 24 * 60 * 60 * 1000

const CREATE_MANY_CHUNK_SIZE = 1000

async function createSchedulesInChunks(
  data: Array<{ choreId: string; scheduledFor: Date; slotType: 'DAILY'; suggested: boolean }>,
) {
  let created = 0
  for (let i = 0; i < data.length; i += CREATE_MANY_CHUNK_SIZE) {
    const chunk = data.slice(i, i + CREATE_MANY_CHUNK_SIZE)
    const result = await db.schedule.createMany({ data: chunk, skipDuplicates: true })
    created += result.count
  }
  return created
}

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
  const profile = process.env.CHORUS_PROFILE === '1'
  const t0 = profile ? performance.now() : 0
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

  // Fast-path: if all (choreId, day) pairs already exist, skip the insert.
  // This avoids repeatedly running a large createMany on every navigation.
  const dailyIds = dailyChores.map((c) => c.id)
  const expectedRows = dailyIds.length * days.length
  const existingRows = await db.schedule.count({
    where: {
      choreId: { in: dailyIds },
      scheduledFor: { in: days },
    },
  })
  if (existingRows === expectedRows) {
    return { created: 0 }
  }

  const data = days.flatMap((day) =>
    dailyChores.map((chore) => ({
      choreId: chore.id,
      scheduledFor: day,
      slotType: 'DAILY' as const,
      suggested: false,
    })),
  )

  const created = await createSchedulesInChunks(data)
  if (profile) {
    console.info(
      `perf: ensureDailySchedules days=${days.length} chores=${dailyIds.length} created=${created} ${(performance.now() - t0).toFixed(1)}ms`,
    )
  }
  return { created }
}

function mondayIndexFromUtcDay(utcDay: number) {
  // Convert JS getUTCDay() (Sun=0..Sat=6) to Monday-first index (Mon=0..Sun=6)
  return (utcDay + 6) % 7
}

/**
 * Auto-schedule WEEKLY chores that have a pinned weekday onto the DAILY schedule.
 *
 * The pinned weekday is stored as a Monday-first index: 0=Mon .. 6=Sun.
 *
 * Uses createMany with skipDuplicates (backed by the @@unique([choreId, scheduledFor])
 * constraint) so concurrent calls are safe and idempotent.
 *
 * If the user removes an auto-planned occurrence, we keep the Schedule row hidden,
 * so it stays removed for that specific day/week.
 */
export async function ensureWeeklyPinnedSchedules(
  now?: Date,
  through?: Date,
): Promise<{ created: number }> {
  const profile = process.env.CHORUS_PROFILE === '1'
  const t0 = profile ? performance.now() : 0
  const today = startOfTodayUtc(now)

  const weeklyPinned = await db.chore.findMany({
    where: {
      frequency: 'WEEKLY',
      weeklyAutoPlanDay: { not: null },
    },
    select: { id: true, weeklyAutoPlanDay: true },
  })

  if (weeklyPinned.length === 0) {
    return { created: 0 }
  }

  const days: Date[] = [today]
  if (through) {
    const end = startOfTodayUtc(through)
    const cursor = new Date(today)
    cursor.setUTCDate(cursor.getUTCDate() + 1)
    while (cursor < end) {
      days.push(new Date(cursor))
      cursor.setUTCDate(cursor.getUTCDate() + 1)
    }
  }

  const data = days.flatMap((day) => {
    const weekday = mondayIndexFromUtcDay(day.getUTCDay())
    return weeklyPinned
      .filter((c) => c.weeklyAutoPlanDay === weekday)
      .map((chore) => ({
        choreId: chore.id,
        scheduledFor: day,
        slotType: 'DAILY' as const,
        suggested: false,
      }))
  })

  if (data.length === 0) {
    return { created: 0 }
  }

  const expectedRows = data.length
  const existingRows = await db.schedule.count({
    where: {
      choreId: { in: Array.from(new Set(data.map((d) => d.choreId))) },
      scheduledFor: { in: Array.from(new Set(data.map((d) => d.scheduledFor))) },
    },
  })
  if (existingRows === expectedRows) {
    return { created: 0 }
  }

  const created = await createSchedulesInChunks(data)
  if (profile) {
    console.info(
      `perf: ensureWeeklyPinnedSchedules days=${days.length} candidates=${weeklyPinned.length} created=${created} ${(performance.now() - t0).toFixed(1)}ms`,
    )
  }
  return { created }
}

function isBiweeklyOccurrenceUtc(day: Date, anchor: Date) {
  const diffDays = Math.floor((day.getTime() - anchor.getTime()) / DAY_MS)
  return diffDays >= 0 && diffDays % 14 === 0
}

/**
 * Auto-schedule BIWEEKLY chores that have a pinned weekday onto the DAILY schedule.
 *
 * The pinned weekday is stored as a Monday-first index: 0=Mon .. 6=Sun.
 * The anchor date defines the first occurrence (start-of-day UTC); subsequent
 * occurrences are every 14 days.
 *
 * Uses createMany with skipDuplicates (backed by the @@unique([choreId, scheduledFor])
 * constraint) so concurrent calls are safe and idempotent.
 *
 * If the user removes an auto-planned occurrence, we keep the Schedule row hidden,
 * so it stays removed for that specific day/occurrence.
 */
export async function ensureBiweeklyPinnedSchedules(
  now?: Date,
  through?: Date,
): Promise<{ created: number }> {
  const profile = process.env.CHORUS_PROFILE === '1'
  const t0 = profile ? performance.now() : 0
  const today = startOfTodayUtc(now)

  const biweeklyPinned = await db.chore.findMany({
    where: {
      frequency: 'BIWEEKLY',
      biweeklyAutoPlanDay: { not: null },
      biweeklyAutoPlanAnchor: { not: null },
    },
    select: { id: true, biweeklyAutoPlanDay: true, biweeklyAutoPlanAnchor: true },
  })

  if (biweeklyPinned.length === 0) {
    return { created: 0 }
  }

  const days: Date[] = [today]
  if (through) {
    const end = startOfTodayUtc(through)
    const cursor = new Date(today)
    cursor.setUTCDate(cursor.getUTCDate() + 1)
    while (cursor < end) {
      days.push(new Date(cursor))
      cursor.setUTCDate(cursor.getUTCDate() + 1)
    }
  }

  const data = days.flatMap((day) => {
    const weekday = mondayIndexFromUtcDay(day.getUTCDay())
    return biweeklyPinned
      .filter((c) => c.biweeklyAutoPlanDay === weekday)
      .filter((c) => isBiweeklyOccurrenceUtc(day, c.biweeklyAutoPlanAnchor!))
      .map((chore) => ({
        choreId: chore.id,
        scheduledFor: day,
        slotType: 'DAILY' as const,
        suggested: false,
      }))
  })

  if (data.length === 0) {
    return { created: 0 }
  }

  const expectedRows = data.length
  const existingRows = await db.schedule.count({
    where: {
      choreId: { in: Array.from(new Set(data.map((d) => d.choreId))) },
      scheduledFor: { in: Array.from(new Set(data.map((d) => d.scheduledFor))) },
    },
  })
  if (existingRows === expectedRows) {
    return { created: 0 }
  }

  const created = await createSchedulesInChunks(data)
  if (profile) {
    console.info(
      `perf: ensureBiweeklyPinnedSchedules days=${days.length} candidates=${biweeklyPinned.length} created=${created} ${(performance.now() - t0).toFixed(1)}ms`,
    )
  }
  return { created }
}
