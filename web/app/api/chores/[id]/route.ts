import { Frequency, Prisma } from '@prisma/client'
import { requireApprovedUser } from '@/lib/auth/require-approval'
import { db } from '@/lib/db'

interface RouteContext {
  params: Promise<{ id: string }>
}

interface UpdateChorePayload {
  title?: unknown
  description?: unknown
  frequency?: unknown
  assignedUserIds?: unknown
}

function isFrequency(value: string): value is Frequency {
  return value === 'DAILY' || value === 'WEEKLY' || value === 'MONTHLY' || value === 'YEARLY'
}

function normalizeAssignedUserIds(value: unknown): string[] | null | undefined {
  if (value === undefined) {
    return undefined
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

export async function GET(_request: Request, context: RouteContext) {
  await requireApprovedUser()

  const { id } = await context.params
  if (!id) {
    return Response.json({ error: 'Chore ID is required' }, { status: 400 })
  }

  const chore = await db.chore.findUnique({
    where: { id },
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

  if (!chore) {
    return Response.json({ error: 'Chore not found' }, { status: 404 })
  }

  return Response.json({ data: chore })
}

export async function PUT(request: Request, context: RouteContext) {
  await requireApprovedUser()

  const { id } = await context.params
  if (!id) {
    return Response.json({ error: 'Chore ID is required' }, { status: 400 })
  }

  let payload: UpdateChorePayload
  try {
    payload = (await request.json()) as UpdateChorePayload
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const title = typeof payload.title === 'string' ? payload.title.trim() : undefined
  const description = typeof payload.description === 'string' ? payload.description.trim() : undefined
  const frequency = typeof payload.frequency === 'string' ? payload.frequency : undefined
  const assignedUserIds = normalizeAssignedUserIds(payload.assignedUserIds)

  if (payload.title !== undefined && !title) {
    return Response.json({ error: 'Title cannot be empty' }, { status: 400 })
  }

  if (frequency !== undefined && !isFrequency(frequency)) {
    return Response.json({ error: 'Frequency must be DAILY, WEEKLY, MONTHLY, or YEARLY' }, { status: 400 })
  }

  if (assignedUserIds === null) {
    return Response.json({ error: 'assignedUserIds must be an array of user IDs' }, { status: 400 })
  }

  try {
    const chore = await db.chore.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description: description || null }),
        ...(frequency !== undefined && { frequency }),
        ...(assignedUserIds !== undefined && {
          assignments: {
            deleteMany: {},
            ...(assignedUserIds.length > 0
              ? { create: assignedUserIds.map((userId) => ({ userId })) }
              : {}),
          },
        }),
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

    return Response.json({ data: chore })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return Response.json({ error: 'Chore not found' }, { status: 404 })
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
      return Response.json({ error: 'One or more assigned user IDs do not exist' }, { status: 400 })
    }

    console.error('Failed to update chore:', error)
    return Response.json({ error: 'Failed to update chore' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  await requireApprovedUser()

  const { id } = await context.params
  if (!id) {
    return Response.json({ error: 'Chore ID is required' }, { status: 400 })
  }

  try {
    await db.chore.delete({
      where: { id },
    })

    return Response.json({ success: true })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return Response.json({ error: 'Chore not found' }, { status: 404 })
    }

    console.error('Failed to delete chore:', error)
    return Response.json({ error: 'Failed to delete chore' }, { status: 500 })
  }
}
