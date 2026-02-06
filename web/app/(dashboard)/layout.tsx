import { requireApprovedUser } from '@/lib/auth/require-approval';
import Link from 'next/link';

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

  return (
    <div className="min-h-screen bg-[var(--color-cream)]">
      <header className="border-b border-[var(--color-charcoal)]/10 bg-white/90">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <Link href="/dashboard" className="text-xl font-semibold text-[var(--color-charcoal)]">
            Chorus
          </Link>
          <nav className="flex flex-wrap gap-2">
            <Link
              href="/dashboard"
              className="min-h-11 rounded-[var(--radius-sm)] px-3 py-2 text-sm font-medium text-[var(--color-charcoal)] hover:bg-[var(--color-cream)]"
            >
              Dashboard
            </Link>
            <Link
              href="/dashboard/chores"
              className="min-h-11 rounded-[var(--radius-sm)] px-3 py-2 text-sm font-medium text-[var(--color-charcoal)] hover:bg-[var(--color-cream)]"
            >
              Chores
            </Link>
            <Link
              href="/dashboard/schedule"
              className="min-h-11 rounded-[var(--radius-sm)] px-3 py-2 text-sm font-medium text-[var(--color-charcoal)] hover:bg-[var(--color-cream)]"
            >
              Schedule
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}

// Force dynamic rendering - don't cache this layout
export const dynamic = 'force-dynamic';
