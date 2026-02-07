import { db } from '@/lib/db';
import { withApproval } from '@/lib/auth/with-approval';

export const DELETE = withApproval(async (
  _session,
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  try {
    const { id } = await params;

    const existing = await db.schedule.findUnique({
      where: { id },
      include: {
        chore: { select: { frequency: true } },
      },
    });
    if (!existing) {
      return Response.json({ error: 'Schedule not found' }, { status: 404 });
    }

    const isDailyAutoSlot = existing.slotType === 'DAILY' && existing.chore.frequency === 'DAILY';

    await db.$transaction(async (tx) => {
      // If the schedule item is removed, remove any schedule-specific completion too.
      await tx.choreCompletion.deleteMany({ where: { scheduleId: id } });

      if (isDailyAutoSlot) {
        await tx.schedule.update({ where: { id }, data: { hidden: true } });
        return;
      }

      await tx.schedule.delete({ where: { id } });
    });
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('Failed to delete schedule:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
});
