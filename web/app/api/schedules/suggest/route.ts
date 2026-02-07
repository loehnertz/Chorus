import { withApproval } from '@/lib/auth/with-approval';
import { formatValidationError, scheduleSuggestSchema } from '@/lib/validations';
import { checkCascadePace, suggestCascadedChore } from '@/lib/suggestions';

export const POST = withApproval(async (_session, request: Request) => {
  try {
    const body = await request.json();
    const parsed = scheduleSuggestSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(formatValidationError(parsed.error), { status: 400 });
    }

    const { currentFrequency, userId, forDate } = parsed.data;
    const planningDate = forDate ?? new Date();
    const [suggestion, paceWarnings] = await Promise.all([
      suggestCascadedChore({ currentFrequency, userId, now: planningDate }),
      checkCascadePace({ now: planningDate }),
    ]);

    return Response.json({ suggestion, paceWarnings });
  } catch (error) {
    console.error('Failed to suggest schedule chore:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
});
