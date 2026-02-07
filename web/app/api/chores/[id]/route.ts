import { db } from '@/lib/db';
import { withApproval } from '@/lib/auth/with-approval';
import { updateChoreSchema, formatValidationError } from '@/lib/validations';

export const runtime = 'nodejs';

export const GET = withApproval(async (
  _session,
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  try {
    const { id } = await params;

    const chore = await db.chore.findUnique({
      where: { id },
      include: {
        assignments: {
          include: {
            user: { select: { id: true, name: true, image: true } },
          },
        },
        completions: {
          orderBy: { completedAt: 'desc' },
          take: 5,
          include: {
            user: { select: { id: true, name: true, image: true } },
          },
        },
        _count: {
          select: { completions: true },
        },
      },
    });

    if (!chore) {
      return Response.json({ error: 'Chore not found' }, { status: 404 });
    }

    return Response.json(chore);
  } catch (error) {
    console.error('Failed to fetch chore:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
});

export const PUT = withApproval(async (
  _session,
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = updateChoreSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(formatValidationError(parsed.error), { status: 400 });
    }

    const { title, frequency, description, assigneeIds } = parsed.data;

    const normalizedAssigneeIds =
      assigneeIds === undefined
        ? undefined
        : Array.from(new Set(assigneeIds.map((id) => id.trim()).filter(Boolean)));

    // Check chore exists
    const existing = await db.chore.findUnique({ where: { id } });
    if (!existing) {
      return Response.json({ error: 'Chore not found' }, { status: 404 });
    }

    // Build update data
    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title;
    if (frequency !== undefined) updateData.frequency = frequency;
    if (description !== undefined) updateData.description = description;

    if (normalizedAssigneeIds !== undefined) {
      if (normalizedAssigneeIds.length) {
        const users = await db.user.findMany({
          where: { id: { in: normalizedAssigneeIds }, approved: true },
          select: { id: true },
        });
        if (users.length !== normalizedAssigneeIds.length) {
          return Response.json(
            {
              error: 'Validation failed',
              details: {
                formErrors: [],
                fieldErrors: {
                  assigneeIds: ['One or more assignees were not found or not approved'],
                },
              },
            },
            { status: 400 },
          );
        }
      }

      // Use transaction to replace assignments atomically
      const chore = await db.$transaction(async (tx) => {
        await tx.choreAssignment.deleteMany({ where: { choreId: id } });
        return tx.chore.update({
          where: { id },
          data: {
            ...updateData,
            ...(normalizedAssigneeIds.length && {
              assignments: {
                create: normalizedAssigneeIds.map((userId: string) => ({ userId })),
              },
            }),
          },
          include: {
            assignments: {
              include: {
                user: { select: { id: true, name: true, image: true } },
              },
            },
          },
        });
      });

      return Response.json(chore);
    }

    const chore = await db.chore.update({
      where: { id },
      data: updateData,
      include: {
        assignments: {
          include: {
            user: { select: { id: true, name: true, image: true } },
          },
        },
      },
    });

    return Response.json(chore);
  } catch (error) {
    console.error('Failed to update chore:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
});

export const DELETE = withApproval(async (
  _session,
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  try {
    const { id } = await params;

    const existing = await db.chore.findUnique({ where: { id } });
    if (!existing) {
      return Response.json({ error: 'Chore not found' }, { status: 404 });
    }

    await db.chore.delete({ where: { id } });

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('Failed to delete chore:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
});
