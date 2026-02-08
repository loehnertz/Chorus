import { redirect } from 'next/navigation';
import { auth } from './server';
import { db } from '@/lib/db';
import { syncUser } from './user-sync';
import type { NeonAuthSession } from '@/types/auth';

type ApprovalResult =
  | { kind: 'unauthenticated' }
  | { kind: 'unapproved'; session: NeonAuthSession }
  | { kind: 'approved'; session: NeonAuthSession };

async function getApprovalResult(): Promise<ApprovalResult> {
  const { data: session } = await auth.getSession();

  if (!session?.user) {
    return { kind: 'unauthenticated' };
  }

  await syncUser(session.user);

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { approved: true },
  });

  if (!user?.approved) {
    return { kind: 'unapproved', session: session as unknown as NeonAuthSession };
  }

  return { kind: 'approved', session: session as unknown as NeonAuthSession };
}

/**
 * Require user approval for data access
 *
 * This utility ensures the current user is:
 * 1. Authenticated (has a valid session)
 * 2. Synced to the app database
 * 3. Approved by an administrator
 *
 * Use this in any server component, server action, or API route
 * that reads or writes data.
 *
 * @throws Redirects to /sign-in if not authenticated
 * @throws Redirects to /pending-approval if not approved
 * @returns The authenticated and approved user's session
 *
 * @example
 * ```tsx
 * // In a server component
 * export default async function ChoresPage() {
 *   const session = await requireApprovedUser();
 *   // Now you can safely access data
 *   const chores = await db.chore.findMany();
 *   return <ChoreList chores={chores} />;
 * }
 * ```
 *
 * @example
 * ```tsx
 * // In an API route
 * export async function GET() {
 *   const session = await requireApprovedUser();
 *   const chores = await db.chore.findMany();
 *   return Response.json(chores);
 * }
 * ```
 *
 * @example
 * ```tsx
 * // In a server action
 * 'use server';
 * export async function createChore(formData: FormData) {
 *   const session = await requireApprovedUser();
 *   const chore = await db.chore.create({ ... });
 *   return chore;
 * }
 * ```
 */
export async function requireApprovedUser() {
  const result = await getApprovalResult();

  if (result.kind === 'unauthenticated') {
    redirect('/sign-in');
  }

  if (result.kind === 'unapproved') {
    redirect('/pending-approval');
  }

  return result.session;
}

/**
 * Check if current user is approved (without redirecting)
 *
 * Use this when you need to conditionally show/hide content
 * based on approval status without forcing a redirect.
 *
 * @returns The session if user is approved, null otherwise
 *
 * @example
 * ```tsx
 * export default async function Header() {
 *   const session = await checkApprovedUser();
 *   if (!session) return <div>Please sign in</div>;
 *   return <div>Welcome {session.user.name}</div>;
 * }
 * ```
 */
/**
 * Require user approval for API routes (returns JSON errors instead of redirects)
 *
 * Use this in API route handlers where redirects are not appropriate.
 * Returns a Response with JSON error on failure, or the session on success.
 *
 * @returns Response (error) or NeonAuthSession (success)
 *
 * @example
 * ```typescript
 * export async function GET() {
 *   const result = await requireApprovedUserApi();
 *   if (isErrorResponse(result)) return result;
 *   const session = result;
 *   // ... handle request
 * }
 * ```
 */
export async function requireApprovedUserApi(): Promise<Response | NeonAuthSession> {
  const result = await getApprovalResult();

  if (result.kind === 'unauthenticated') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (result.kind === 'unapproved') {
    return Response.json({ error: 'User not approved' }, { status: 403 });
  }

  return result.session;
}

/**
 * Type guard to check if the result from requireApprovedUserApi is an error Response
 */
export function isErrorResponse(result: Response | NeonAuthSession): result is Response {
  return result instanceof Response;
}

export async function checkApprovedUser() {
  const result = await getApprovalResult();
  if (result.kind !== 'approved') return null;
  return result.session;
}
