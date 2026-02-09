import { db } from '@/lib/db'
import { withApproval } from '@/lib/auth/with-approval'
import { createHolidaySchema, formatValidationError } from '@/lib/validations'
import { startOfTodayUtc } from '@/lib/date'

export const runtime = 'nodejs'

export const GET = withApproval(async (session) => {
  try {
    const holidays = await db.holiday.findMany({
      where: { userId: session.user.id },
      orderBy: { startDate: 'desc' },
    })
    return Response.json(holidays)
  } catch (error) {
    console.error('Failed to fetch holidays:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
})

export const POST = withApproval(async (session, request: Request) => {
  try {
    const body = await request.json()
    const parsed = createHolidaySchema.safeParse(body)

    if (!parsed.success) {
      return Response.json(formatValidationError(parsed.error), { status: 400 })
    }

    const { startDate, endDate, label } = parsed.data

    // Normalize to UTC midnight
    const start = startOfTodayUtc(startDate)
    const end = startOfTodayUtc(endDate)

    // Check for overlap with existing holidays for this user
    const overlap = await db.holiday.findFirst({
      where: {
        userId: session.user.id,
        startDate: { lte: end },
        endDate: { gte: start },
      },
    })

    if (overlap) {
      return Response.json(
        { error: 'This holiday overlaps with an existing one' },
        { status: 409 },
      )
    }

    const holiday = await db.holiday.create({
      data: {
        userId: session.user.id,
        startDate: start,
        endDate: end,
        label,
      },
    })

    return Response.json(holiday, { status: 201 })
  } catch (error) {
    console.error('Failed to create holiday:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
})
