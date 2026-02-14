import { withApproval } from '@/lib/auth/with-approval'
import { db } from '@/lib/db'
import { getApprovedUsersCached, getChoresForScheduleCached } from '@/lib/cached-queries'
import { startOfTodayUtc, startOfBimonthUtc, endOfBimonthUtc, startOfHalfYearUtc, endOfHalfYearUtc } from '@/lib/date'
import { getTodayDayKeyUtc } from '@/lib/calendar'
import {
  ensureBiweeklyPinnedSchedules,
  ensureDailySchedules,
  ensureWeeklyPinnedSchedules,
  rollForwardUnfinishedSchedulesToToday,
} from '@/lib/auto-schedule'
import { getHolidaysForUser } from '@/lib/holiday'

export const runtime = 'nodejs'

function parseMonthParam(raw: string | null): { year: number; monthIndex: number } | null {
  if (!raw) return null
  const m = raw.match(/^(\d{4})-(\d{2})$/)
  if (!m) return null
  const year = Number(m[1])
  const month = Number(m[2])
  if (!Number.isFinite(year) || !Number.isFinite(month)) return null
  if (month < 1 || month > 12) return null
  return { year, monthIndex: month - 1 }
}

function parseDayParam(raw: string | null): string | null {
  if (!raw) return null
  return /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : null
}

export const GET = withApproval(async (session, request: Request) => {
  try {
    const { searchParams } = new URL(request.url)
    const monthRaw = searchParams.get('month')
    const dayRaw = searchParams.get('day')

    const parsedMonth = parseMonthParam(monthRaw)
    if (!parsedMonth) {
      return Response.json({ error: 'Invalid month parameter (expected YYYY-MM)' }, { status: 400 })
    }

    const now = new Date()
    const todayDayKey = getTodayDayKeyUtc(now)
    const initialSelectedDayKey = parseDayParam(dayRaw) ?? todayDayKey

    const { year, monthIndex } = parsedMonth

    const monthStart = new Date(Date.UTC(year, monthIndex, 1))

    // Calendar grid spans 6 full weeks starting Monday.
    const monthStartDow = monthStart.getUTCDay() // 0 (Sun) .. 6 (Sat)
    const daysSinceMonday = (monthStartDow + 6) % 7
    const gridStart = new Date(monthStart)
    gridStart.setUTCDate(gridStart.getUTCDate() - daysSinceMonday)
    const gridEnd = new Date(gridStart)
    gridEnd.setUTCDate(gridEnd.getUTCDate() + 42)

    // Buffer beyond the visible grid so cycle-based logic (notably BIWEEKLY)
    // can see schedules that fall just outside the month grid.
    const queryStart = new Date(gridStart)
    queryStart.setUTCDate(queryStart.getUTCDate() - 14)
    const queryEnd = new Date(gridEnd)
    queryEnd.setUTCDate(queryEnd.getUTCDate() + 14)

    // Auto-schedule daily chores for the visible grid range, but never backfill the past.
    const todayStart = startOfTodayUtc(now)
    const scheduleStart = gridStart < todayStart ? todayStart : gridStart
    await rollForwardUnfinishedSchedulesToToday(now)

    const asyncAutoschedule = process.env.CHORUS_ASYNC_AUTOSCHEDULE === '1'
    const scheduleWork = async () => {
      if (gridEnd > scheduleStart) {
        await Promise.all([
          ensureDailySchedules(scheduleStart, gridEnd),
          ensureWeeklyPinnedSchedules(scheduleStart, gridEnd),
          ensureBiweeklyPinnedSchedules(scheduleStart, gridEnd),
        ])
      } else {
        await Promise.all([
          ensureDailySchedules(scheduleStart),
          ensureWeeklyPinnedSchedules(scheduleStart),
          ensureBiweeklyPinnedSchedules(scheduleStart),
        ])
      }
    }

    if (!asyncAutoschedule) {
      await scheduleWork()
    } else {
      // Best-effort: keep response snappy.
      void scheduleWork().catch((error) => {
        console.error('Failed to auto-schedule schedules:', error)
      })
    }

    const yearStart = new Date(Date.UTC(year, 0, 1))
    const yearEnd = new Date(Date.UTC(year + 1, 0, 1))

    // Use the viewed month to anchor long-range scheduling state.
    const bimonthStart = startOfBimonthUtc(monthStart)
    const bimonthEnd = endOfBimonthUtc(monthStart)
    const halfYearStart = startOfHalfYearUtc(monthStart)
    const halfYearEnd = endOfHalfYearUtc(monthStart)

    const upcomingStart = startOfTodayUtc(now)
    const upcomingEnd = new Date(upcomingStart)
    upcomingEnd.setUTCDate(upcomingEnd.getUTCDate() + 14)

    const [chores, monthSchedulesRaw, upcomingRaw, yearlyScheduledRaw, semiannualScheduledRaw, bimonthlyScheduledRaw, users, holidays] =
      await Promise.all([
        getChoresForScheduleCached(),
        db.schedule.findMany({
          where: { hidden: false, scheduledFor: { gte: queryStart, lt: queryEnd } },
          include: {
            chore: {
              select: {
                id: true,
                title: true,
                description: true,
                frequency: true,
                assignments: { select: { userId: true }, orderBy: [{ createdAt: 'asc' }, { userId: 'asc' }] },
              },
            },
            completion: {
              select: { id: true, userId: true, completedAt: true },
            },
          },
          orderBy: { scheduledFor: 'asc' },
        }),
        db.schedule.findMany({
          where: {
            hidden: false,
            scheduledFor: { gte: upcomingStart, lt: upcomingEnd },
            completion: { is: null },
          },
          include: {
            chore: {
              select: {
                id: true,
                title: true,
                description: true,
                frequency: true,
                assignments: { select: { userId: true }, orderBy: [{ createdAt: 'asc' }, { userId: 'asc' }] },
              },
            },
            completion: {
              select: { id: true, userId: true, completedAt: true },
            },
          },
          orderBy: { scheduledFor: 'asc' },
        }),
        db.schedule.findMany({
          where: {
            hidden: false,
            scheduledFor: { gte: yearStart, lt: yearEnd },
            chore: { frequency: 'YEARLY' },
          },
          distinct: ['choreId'],
          select: { choreId: true },
        }),
        db.schedule.findMany({
          where: {
            hidden: false,
            scheduledFor: { gte: halfYearStart, lt: halfYearEnd },
            chore: { frequency: 'SEMIANNUAL' },
          },
          distinct: ['choreId'],
          select: { choreId: true },
        }),
        db.schedule.findMany({
          where: {
            hidden: false,
            scheduledFor: { gte: bimonthStart, lt: bimonthEnd },
            chore: { frequency: 'BIMONTHLY' },
          },
          distinct: ['choreId'],
          select: { choreId: true },
        }),
        getApprovedUsersCached(),
        getHolidaysForUser(session.user.id, gridStart, gridEnd),
      ])

    const mappedChores = chores.map((c) => ({
      id: c.id,
      title: c.title,
      description: c.description,
      frequency: c.frequency,
      assigneeIds: c.assignments.map((a) => a.userId),
    }))

    const mapSchedule = (s: (typeof monthSchedulesRaw)[number]) => ({
      id: s.id,
      scheduledFor: s.scheduledFor.toISOString(),
      slotType: s.slotType,
      suggested: s.suggested,
      completed: !!s.completion,
      completedByUserId: s.completion?.userId ?? null,
      chore: {
        id: s.chore.id,
        title: s.chore.title,
        description: s.chore.description,
        frequency: s.chore.frequency,
        assigneeIds: s.chore.assignments.map((a) => a.userId),
      },
    })

    return Response.json({
      userId: session.user.id,
      year,
      monthIndex,
      todayDayKey,
      initialSelectedDayKey,
      chores: mappedChores,
      monthSchedules: monthSchedulesRaw.map(mapSchedule),
      upcomingSchedules: upcomingRaw.map(mapSchedule),
      longRangeScheduledChoreIds: {
        YEARLY: yearlyScheduledRaw.map((r) => r.choreId),
        SEMIANNUAL: semiannualScheduledRaw.map((r) => r.choreId),
        BIMONTHLY: bimonthlyScheduledRaw.map((r) => r.choreId),
      },
      users,
      holidays: holidays.map((h) => ({
        id: h.id,
        startDate: h.startDate.toISOString(),
        endDate: h.endDate.toISOString(),
        label: h.label,
      })),
    })
  } catch (error) {
    console.error('Failed to fetch schedule view data:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
})
