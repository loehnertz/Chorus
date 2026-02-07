import { requireApprovedUserApi, isErrorResponse } from '@/lib/auth/require-approval';
import { formatValidationError, scheduleSuggestSchema } from '@/lib/validations';
import { checkCascadePace, suggestCascadedChore } from '@/lib/suggestions';

export async function POST(request: Request) {
  try {
    const result = await requireApprovedUserApi();
    if (isErrorResponse(result)) return result;

    const body = await request.json();
    const parsed = scheduleSuggestSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(formatValidationError(parsed.error), { status: 400 });
    }

    const { currentFrequency, userId } = parsed.data;
    const [suggestion, paceWarnings] = await Promise.all([
      suggestCascadedChore({ currentFrequency, userId }),
      checkCascadePace(),
    ]);

    return Response.json({ suggestion, paceWarnings });
  } catch (error) {
    console.error('Failed to suggest schedule chore:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
