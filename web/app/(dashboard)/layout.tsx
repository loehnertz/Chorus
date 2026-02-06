import { requireApprovedUser } from '@/lib/auth/require-approval'
import { Sidebar } from '@/components/sidebar'
import { BottomBar } from '@/components/bottom-bar'

/**
 * Dashboard Layout
 * Wraps all dashboard routes with approval checking
 * Ensures user is authenticated and approved before rendering
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Require user to be authenticated and approved
  const session = await requireApprovedUser()
  const userName = session.user.name?.trim() || 'You'

  // User is authenticated and approved - render dashboard
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Sidebar user={{ id: session.user.id, name: userName }} />
      <main className="md:ml-64 pb-20 md:pb-0">
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-6 md:py-10">{children}</div>
      </main>
      <BottomBar />
    </div>
  )
}

// Force dynamic rendering - don't cache this layout
export const dynamic = 'force-dynamic'
