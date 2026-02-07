import { db } from '@/lib/db';
import { withApproval } from '@/lib/auth/with-approval';

export const runtime = 'nodejs';

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
        chore: { select: { frequency: true, weeklyAutoPlanDay: true } },
      },
    });
    if (!existing) {
      return Response.json({ error: 'Schedule not found' }, { status: 404 });
    }

    const isDailyAutoSlot = existing.slotType === 'DAILY' && existing.chore.frequency === 'DAILY';

    const isWeeklyPinnedAutoSlot = (() => {
      if (existing.chore.frequency !== 'WEEKLY') return false
      if (existing.chore.weeklyAutoPlanDay == null) return false

      // Stored as Monday-first index: 0=Mon .. 6=Sun
      const weekday = (existing.scheduledFor.getUTCDay() + 6) % 7
      return existing.chore.weeklyAutoPlanDay === weekday
    })()

    await db.$transaction(async (tx) => {
      // If the schedule item is removed, remove any schedule-specific completion too.
      await tx.choreCompletion.deleteMany({ where: { scheduleId: id } });

      if (isDailyAutoSlot) {
        await tx.schedule.update({ where: { id }, data: { hidden: true } });
        return;
      }

      if (isWeeklyPinnedAutoSlot) {
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
