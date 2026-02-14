import { redirect } from 'next/navigation';
import { isSignUpEnabled } from '@/lib/auth/config';
import { auth } from '@/lib/auth/server';
import SignUpClient from './SignUpClient';

/**
 * Sign Up Page
 * Public account creation entry point when CHORUS_SIGN_UP_ENABLED=1.
 */
export default async function SignUpPage() {
  if (!isSignUpEnabled()) {
    redirect('/sign-in');
  }

  const { data: session } = await auth.getSession();
  if (session?.user) {
    redirect('/dashboard');
  }

  return <SignUpClient />;
}

export const dynamic = 'force-dynamic';
