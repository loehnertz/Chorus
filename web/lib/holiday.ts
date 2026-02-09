import { dayKeyUtc, startOfTodayUtc } from '@/lib/date'
import { db } from '@/lib/db'

export type HolidayRange = { startDate: Date; endDate: Date }

/**
 * Check if a given date falls within any of the provided holiday ranges.
 * All comparisons use UTC day keys (YYYY-MM-DD).
 */
export function isDateInHoliday(date: Date, holidays: HolidayRange[]): boolean {
  const key = dayKeyUtc(date)
  for (const h of holidays) {
    if (key >= dayKeyUtc(h.startDate) && key <= dayKeyUtc(h.endDate)) {
      return true
    }
  }
  return false
}

/**
 * Build a Set of YYYY-MM-DD day keys for all days covered by the given holidays.
 * Includes a safety cap (default 730 days total) to prevent runaway loops.
 */
export function buildHolidayDayKeySet(holidays: HolidayRange[], maxDays = 730): Set<string> {
  const keys = new Set<string>()
  for (const h of holidays) {
    const cursor = new Date(Date.UTC(
      h.startDate.getUTCFullYear(),
      h.startDate.getUTCMonth(),
      h.startDate.getUTCDate(),
    ))
    const endKey = dayKeyUtc(h.endDate)
    let count = 0
    while (dayKeyUtc(cursor) <= endKey && keys.size < maxDays) {
      keys.add(dayKeyUtc(cursor))
      cursor.setUTCDate(cursor.getUTCDate() + 1)
      count++
      if (count > maxDays) break
    }
  }
  return keys
}

/**
 * Fetch holidays for a user, optionally filtered to overlap a date range.
 */
export async function getHolidaysForUser(
  userId: string,
  rangeStart?: Date,
  rangeEnd?: Date,
) {
  const where: Record<string, unknown> = { userId }

  if (rangeStart && rangeEnd) {
    // Overlap condition: holiday.startDate <= rangeEnd AND holiday.endDate >= rangeStart
    where.startDate = { lte: rangeEnd }
    where.endDate = { gte: rangeStart }
  }

  return db.holiday.findMany({
    where,
    orderBy: { startDate: 'desc' },
  })
}

/**
 * Check if a user is currently on holiday (today falls within any holiday range).
 */
export async function isUserOnHoliday(userId: string, now = new Date()): Promise<boolean> {
  const today = startOfTodayUtc(now)
  const count = await db.holiday.count({
    where: {
      userId,
      startDate: { lte: today },
      endDate: { gte: today },
    },
  })
  return count > 0
}

/**
 * Batch query: given a list of user IDs, return the Set of those currently on holiday.
 */
export async function getUsersOnHoliday(userIds: string[], now = new Date()): Promise<Set<string>> {
  if (userIds.length === 0) return new Set()

  const today = startOfTodayUtc(now)
  const holidays = await db.holiday.findMany({
    where: {
      userId: { in: userIds },
      startDate: { lte: today },
      endDate: { gte: today },
    },
    select: { userId: true },
    distinct: ['userId'],
  })

  return new Set(holidays.map((h) => h.userId))
}
