import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/server';
import SignInClient from './SignInClient';

/**
 * Sign In Page
 * Keeps /sign-in as a stable PWA start_url while still redirecting
 * authenticated users straight to the dashboard.
 */
export default async function SignInPage() {
  const { data: session } = await auth.getSession();
  if (session?.user) {
    redirect('/dashboard');
  }

  return <SignInClient />;
}

export const dynamic = 'force-dynamic';
