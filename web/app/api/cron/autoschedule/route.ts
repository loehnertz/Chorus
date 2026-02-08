import { startOfTodayUtc } from '@/lib/date'
import { ensureBiweeklyPinnedSchedules, ensureDailySchedules, ensureWeeklyPinnedSchedules } from '@/lib/auto-schedule'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const secret = process.env.CHORUS_CRON_SECRET
  if (!secret) {
    return Response.json({ error: 'Cron not configured' }, { status: 503 })
  }

  const provided = request.headers.get('x-chorus-cron-secret')

  const authHeader = request.headers.get('authorization') ?? ''
  const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length).trim() : null

  const ok = (provided && provided === secret) || (bearer && bearer === secret)
  if (!ok) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const start = startOfTodayUtc(now)
  const end = new Date(start)
  end.setUTCDate(end.getUTCDate() + 45)

  try {
    const [daily, weeklyPinned, biweeklyPinned] = await Promise.all([
      ensureDailySchedules(start, end),
      ensureWeeklyPinnedSchedules(start, end),
      ensureBiweeklyPinnedSchedules(start, end),
    ])

    return Response.json({
      ok: true,
      range: { start: start.toISOString(), end: end.toISOString() },
      created: {
        daily: daily.created,
        weeklyPinned: weeklyPinned.created,
        biweeklyPinned: biweeklyPinned.created,
      },
    })
  } catch (error) {
    console.error('Cron autoschedule failed:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
