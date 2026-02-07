import { db } from '@/lib/db';
import { withApproval } from '@/lib/auth/with-approval';
import { Frequency } from '@prisma/client';
import { createChoreSchema, formatValidationError } from '@/lib/validations';

const VALID_FREQUENCIES = Object.values(Frequency);

export const GET = withApproval(async (_session, request: Request) => {
  try {
    const { searchParams } = new URL(request.url);
    const frequency = searchParams.get('frequency');
    const search = searchParams.get('search');

    // Validate frequency if provided
    if (frequency && !VALID_FREQUENCIES.includes(frequency as Frequency)) {
      return Response.json(
        { error: `Invalid frequency. Must be one of: ${VALID_FREQUENCIES.join(', ')}` },
        { status: 400 },
      );
    }

    const chores = await db.chore.findMany({
      where: {
        ...(frequency && { frequency: frequency as Frequency }),
        ...(search && {
          title: { contains: search, mode: 'insensitive' as const },
        }),
      },
      include: {
        assignments: {
          include: {
            user: { select: { id: true, name: true, image: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return Response.json(chores);
  } catch (error) {
    console.error('Failed to fetch chores:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
});

export const POST = withApproval(async (_session, request: Request) => {
  try {
    const body = await request.json();
    const parsed = createChoreSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(formatValidationError(parsed.error), { status: 400 });
    }

    const { title, frequency, description, assigneeIds } = parsed.data;

    const normalizedAssigneeIds = Array.from(
      new Set((assigneeIds ?? []).map((id) => id.trim()).filter(Boolean)),
    );

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

    const chore = await db.chore.create({
      data: {
        title,
        frequency,
        description: description ?? null,
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

    return Response.json(chore, { status: 201 });
  } catch (error) {
    console.error('Failed to create chore:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
});
