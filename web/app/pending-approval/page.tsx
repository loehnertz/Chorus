'use client';

import { authClient } from '@/lib/auth/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Pending Approval Page
 * Shown to authenticated users who haven't been approved yet
 */
export default function PendingApprovalPage() {
  const session = authClient.useSession();

  const handleSignOut = async () => {
    await authClient.signOut();
    window.location.href = '/sign-in';
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-cream)] px-4 py-8 sm:px-6 sm:py-12">
      <Card className="w-full max-w-lg">
        <CardHeader className="space-y-2">
          <CardTitle className="text-center font-[var(--font-display)] text-3xl">
            Account Pending Approval
          </CardTitle>
          <CardDescription className="text-center text-base">
            Your account is waiting for administrator approval
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="rounded-[var(--radius-md)] border border-[var(--color-sage)]/20 bg-[var(--color-sage)]/10 p-4.5">
            <p className="text-sm text-[var(--color-charcoal)]">
              Hi {session.data?.user?.name || 'there'}! Your account has been created, but you need
              approval from the household administrator before you can access Chorus.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-medium text-[var(--color-charcoal)]">What happens next?</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-[var(--color-charcoal)]/70">
              <li>The administrator will be notified of your account</li>
              <li>They&apos;ll approve your access</li>
              <li>You&apos;ll be able to sign in and use Chorus</li>
            </ol>
          </div>

          <div className="border-t border-[var(--color-charcoal)]/10 pt-5">
            <p className="mb-3 text-center text-xs text-[var(--color-charcoal)]/60">
              If you have any questions, contact your household administrator
            </p>
            <Button variant="tertiary" onClick={handleSignOut} className="w-full justify-center">
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
