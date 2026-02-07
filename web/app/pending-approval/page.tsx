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
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center font-[var(--font-display)]">
            Account Pending Approval
          </CardTitle>
          <CardDescription className="text-center">
            Your account is waiting for administrator approval
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="p-4 rounded-[var(--radius-md)] bg-[var(--color-sage)]/10 border border-[var(--color-sage)]/20">
            <p className="text-sm text-[var(--foreground)]">
                Hi {session.data?.user?.name || 'there'}! Your account has been created, but you need
                approval from the household administrator before you can access Chorus.
              </p>
            </div>

          <div className="space-y-2">
            <h3 className="font-medium text-[var(--foreground)]">What happens next?</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-[var(--foreground)]/70">
              <li>The administrator will be notified of your account</li>
              <li>They&apos;ll approve your access</li>
              <li>You&apos;ll be able to sign in and use Chorus</li>
            </ol>
          </div>

          <div className="pt-4 border-t border-[var(--border)]">
            <p className="text-xs text-[var(--foreground)]/60 mb-3 text-center">
              If you have any questions, contact your household administrator
            </p>
            <Button variant="outline" onClick={handleSignOut} className="w-full">
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
