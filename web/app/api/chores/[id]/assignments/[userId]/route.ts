import { db } from '@/lib/db';
import { withApproval } from '@/lib/auth/with-approval';

export const DELETE = withApproval(async (
  _session,
  _request: Request,
  { params }: { params: Promise<{ id: string; userId: string }> },
) => {
  try {
    const { id: choreId, userId } = await params;

    const assignment = await db.choreAssignment.findUnique({
      where: { userId_choreId: { userId, choreId } },
    });

    if (!assignment) {
      return Response.json({ error: 'Assignment not found' }, { status: 404 });
    }

    await db.choreAssignment.delete({
      where: { userId_choreId: { userId, choreId } },
    });

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('Failed to unassign chore:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
});
