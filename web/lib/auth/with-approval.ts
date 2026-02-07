import type { NeonAuthSession } from '@/types/auth';

import { isErrorResponse, requireApprovedUserApi } from './require-approval';

/**
 * Wrap a route handler to enforce authentication + approval.
 *
 * Usage:
 * export const GET = withApproval(async (session, request) => { ... })
 */
export function withApproval<Args extends unknown[]>(
  handler: (session: NeonAuthSession, ...args: Args) => Promise<Response>,
) {
  return async (...args: Args): Promise<Response> => {
    const result = await requireApprovedUserApi();
    if (isErrorResponse(result)) return result;
    return handler(result, ...args);
  };
}
