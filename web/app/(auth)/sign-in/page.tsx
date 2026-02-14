import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/server';
import { isSignUpEnabled } from '@/lib/auth/config';
import SignInClient from './SignInClient';

/**
 * Sign In Page
 * Public authentication entry point. The installed PWA now launches at
 * /dashboard, and unauthenticated users are redirected here.
 */
export default async function SignInPage() {
  const { data: session } = await auth.getSession();
  const signUpEnabled = isSignUpEnabled();

  if (session?.user) {
    redirect('/dashboard');
  }

  return <SignInClient signUpEnabled={signUpEnabled} />;
}

export const dynamic = 'force-dynamic';
