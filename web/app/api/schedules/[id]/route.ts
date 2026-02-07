import { db } from '@/lib/db';
import { withApproval } from '@/lib/auth/with-approval';

export const DELETE = withApproval(async (
  _session,
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  try {
    const { id } = await params;

    const existing = await db.schedule.findUnique({ where: { id } });
    if (!existing) {
      return Response.json({ error: 'Schedule not found' }, { status: 404 });
    }

    await db.schedule.delete({ where: { id } });
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('Failed to delete schedule:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
});
