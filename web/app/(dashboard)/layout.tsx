import { requireApprovedUser } from '@/lib/auth/require-approval';

/**
 * Dashboard Layout
 * Wraps all dashboard routes with approval checking
 * Ensures user is authenticated and approved before rendering
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Require user to be authenticated and approved
  await requireApprovedUser();

  // User is authenticated and approved - render dashboard
  return <>{children}</>;
}

// Force dynamic rendering - don't cache this layout
export const dynamic = 'force-dynamic';
