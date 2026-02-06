import { redirect } from 'next/navigation';
import { auth } from './server';
import { db } from '@/lib/db';
import { syncUser } from './user-sync';

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
  // Get current session
  const { data: session } = await auth.getSession();

  // Redirect to sign-in if not authenticated
  if (!session?.user) {
    redirect('/sign-in');
  }

  // Sync user data from Neon Auth to app database
  await syncUser(session.user);

  // Check if user is approved
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { approved: true },
  });

  // Redirect to pending approval if not approved
  if (!user?.approved) {
    redirect('/pending-approval');
  }

  // User is authenticated and approved
  return session;
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
export async function checkApprovedUser() {
  const { data: session } = await auth.getSession();

  if (!session?.user) {
    return null;
  }

  await syncUser(session.user);

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { approved: true },
  });

  if (!user?.approved) {
    return null;
  }

  return session;
}
