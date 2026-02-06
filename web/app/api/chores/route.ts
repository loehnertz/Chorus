import { Frequency, Prisma } from '@prisma/client'
import { requireApprovedUser } from '@/lib/auth/require-approval'
import { db } from '@/lib/db'

interface CreateChorePayload {
  title?: unknown
  description?: unknown
  frequency?: unknown
  assignedUserIds?: unknown
}

function isFrequency(value: string): value is Frequency {
  return value === 'DAILY' || value === 'WEEKLY' || value === 'MONTHLY' || value === 'YEARLY'
}

function normalizeAssignedUserIds(value: unknown): string[] | null {
  if (value === undefined) {
    return []
  }

  if (!Array.isArray(value)) {
    return null
  }

  const ids = value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean)

  return [...new Set(ids)]
}

function serializeChore(chore: Prisma.ChoreGetPayload<{
  include: {
    assignments: {
      include: {
        user: {
          select: {
            id: true
            name: true
            image: true
          }
        }
      }
    }
    _count: {
      select: {
        completions: true
        schedules: true
      }
    }
  }
}>) {
  return {
    ...chore,
    assignments: chore.assignments.map((assignment) => ({
      id: assignment.id,
      userId: assignment.userId,
      user: assignment.user,
    })),
  }
}

export async function GET() {
  await requireApprovedUser()

  const chores = await db.chore.findMany({
    orderBy: [{ frequency: 'asc' }, { title: 'asc' }],
    include: {
      assignments: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      },
      _count: {
        select: {
          completions: true,
          schedules: true,
        },
      },
    },
  })

  return Response.json({ data: chores.map(serializeChore) })
}

export async function POST(request: Request) {
  await requireApprovedUser()

  let payload: CreateChorePayload
  try {
    payload = (await request.json()) as CreateChorePayload
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const title = typeof payload.title === 'string' ? payload.title.trim() : ''
  const descriptionRaw = typeof payload.description === 'string' ? payload.description.trim() : ''
  const frequency = typeof payload.frequency === 'string' ? payload.frequency : ''
  const assignedUserIds = normalizeAssignedUserIds(payload.assignedUserIds)

  if (!title) {
    return Response.json({ error: 'Title is required' }, { status: 400 })
  }

  if (!isFrequency(frequency)) {
    return Response.json({ error: 'Frequency must be DAILY, WEEKLY, MONTHLY, or YEARLY' }, { status: 400 })
  }

  if (!assignedUserIds) {
    return Response.json({ error: 'assignedUserIds must be an array of user IDs' }, { status: 400 })
  }

  try {
    const chore = await db.chore.create({
      data: {
        title,
        description: descriptionRaw || null,
        frequency,
        assignments: assignedUserIds.length > 0
          ? {
            create: assignedUserIds.map((userId) => ({ userId })),
          }
          : undefined,
      },
      include: {
        assignments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
        _count: {
          select: {
            completions: true,
            schedules: true,
          },
        },
      },
    })

    return Response.json({ data: serializeChore(chore) }, { status: 201 })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
      return Response.json({ error: 'One or more assigned user IDs do not exist' }, { status: 400 })
    }

    console.error('Failed to create chore:', error)
    return Response.json({ error: 'Failed to create chore' }, { status: 500 })
  }
}
