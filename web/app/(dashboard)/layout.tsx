import { requireApprovedUser } from '@/lib/auth/require-approval';
import Link from 'next/link';
import { ToastProvider } from '@/components/toast-provider';
import { PageTransition } from '@/components/page-transition';

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
    <ToastProvider>
      <div className="min-h-screen bg-[var(--color-cream)]/75">
        <header className="sticky top-0 z-40 border-b border-[var(--color-charcoal)]/10 bg-white/85 backdrop-blur">
          <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-8">
            <Link href="/dashboard" className="text-xl font-semibold tracking-tight text-[var(--color-charcoal)] sm:text-2xl">
              Chorus
            </Link>
            <nav className="flex flex-wrap items-center gap-2 rounded-[var(--radius-lg)] bg-[var(--surface-muted)] p-1.5">
              <Link
                href="/dashboard"
                className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-sm)] px-4 py-2 text-sm font-semibold text-[var(--color-charcoal)] transition-colors hover:bg-white"
              >
                Dashboard
              </Link>
              <Link
                href="/dashboard/chores"
                className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-sm)] px-4 py-2 text-sm font-semibold text-[var(--color-charcoal)] transition-colors hover:bg-white"
              >
                Chores
              </Link>
              <Link
                href="/dashboard/schedule"
                className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-sm)] px-4 py-2 text-sm font-semibold text-[var(--color-charcoal)] transition-colors hover:bg-white"
              >
                Schedule
              </Link>
              <Link
                href="/dashboard/history"
                className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-sm)] px-4 py-2 text-sm font-semibold text-[var(--color-charcoal)] transition-colors hover:bg-white"
              >
                History
              </Link>
            </nav>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl px-4 py-7 sm:px-8 sm:py-10">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
    </ToastProvider>
  );
}

// Force dynamic rendering - don't cache this layout
export const dynamic = 'force-dynamic';
