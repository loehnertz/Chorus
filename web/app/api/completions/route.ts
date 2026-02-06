import { Prisma } from '@prisma/client'
import { requireApprovedUser } from '@/lib/auth/require-approval'
import { db } from '@/lib/db'

interface CreateCompletionPayload {
  choreId?: unknown
  scheduleId?: unknown
  notes?: unknown
}

export async function GET(request: Request) {
  await requireApprovedUser()

  const { searchParams } = new URL(request.url)

  const userId = searchParams.get('userId')
  const choreId = searchParams.get('choreId')
  const scheduleId = searchParams.get('scheduleId')
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  const limitRaw = searchParams.get('limit')

  const where: Prisma.ChoreCompletionWhereInput = {
    ...(userId ? { userId } : {}),
    ...(choreId ? { choreId } : {}),
    ...(scheduleId ? { scheduleId } : {}),
  }

  if (from || to) {
    const completedAt: Prisma.DateTimeFilter = {}

    if (from) {
      const fromDate = new Date(from)
      if (Number.isNaN(fromDate.getTime())) {
        return Response.json({ error: 'Invalid from date' }, { status: 400 })
      }
      completedAt.gte = fromDate
    }

    if (to) {
      const toDate = new Date(to)
      if (Number.isNaN(toDate.getTime())) {
        return Response.json({ error: 'Invalid to date' }, { status: 400 })
      }
      completedAt.lte = toDate
    }

    where.completedAt = completedAt
  }

  const limit = limitRaw ? Number(limitRaw) : 100
  if (!Number.isInteger(limit) || limit <= 0 || limit > 500) {
    return Response.json({ error: 'limit must be an integer between 1 and 500' }, { status: 400 })
  }

  const completions = await db.choreCompletion.findMany({
    where,
    take: limit,
    orderBy: { completedAt: 'desc' },
    include: {
      chore: true,
      user: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
      schedule: true,
    },
  })

  return Response.json({ data: completions })
}

export async function POST(request: Request) {
  const session = await requireApprovedUser()

  let payload: CreateCompletionPayload
  try {
    payload = (await request.json()) as CreateCompletionPayload
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const choreId = typeof payload.choreId === 'string' ? payload.choreId.trim() : ''
  const scheduleId = typeof payload.scheduleId === 'string' ? payload.scheduleId.trim() : null
  const notesValue = typeof payload.notes === 'string' ? payload.notes.trim() : null

  if (!choreId) {
    return Response.json({ error: 'choreId is required' }, { status: 400 })
  }

  const chore = await db.chore.findUnique({
    where: { id: choreId },
    select: { id: true },
  })

  if (!chore) {
    return Response.json({ error: 'Chore not found' }, { status: 404 })
  }

  if (scheduleId) {
    const schedule = await db.schedule.findUnique({
      where: { id: scheduleId },
      select: { id: true, choreId: true },
    })

    if (!schedule) {
      return Response.json({ error: 'Schedule not found' }, { status: 404 })
    }

    if (schedule.choreId !== choreId) {
      return Response.json({ error: 'Schedule does not belong to the provided chore' }, { status: 400 })
    }
  }

  try {
    const completion = await db.choreCompletion.create({
      data: {
        choreId,
        scheduleId,
        userId: session.user.id,
        notes: notesValue || null,
      },
      include: {
        chore: true,
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        schedule: true,
      },
    })

    return Response.json({ data: completion }, { status: 201 })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
      return Response.json({ error: 'Invalid relationship in completion payload' }, { status: 400 })
    }

    console.error('Failed to create completion:', error)
    return Response.json({ error: 'Failed to create completion' }, { status: 500 })
  }
}
