import { authApiHandler } from '@neondatabase/auth/next/server';
import type { NextRequest } from 'next/server';

import { isSignUpEnabled } from '@/lib/auth/config';
import { rateLimitAuthAction } from '@/lib/auth/rate-limit';

/**
 * Neon Auth API handler
 * Handles all authentication requests.
 *
 * Note: Sign-up is controlled by CHORUS_SIGN_UP_ENABLED.
 * Set CHORUS_SIGN_UP_ENABLED=1 to allow account creation.
 */
const handler = authApiHandler();

export const GET = handler.GET;

function getAuthAction(path: string[] | undefined): 'sign-in' | 'sign-up' | null {
  const action = path?.[0]?.toLowerCase();
  if (action === 'sign-in' || action === 'signin') return 'sign-in';
  if (action === 'sign-up' || action === 'signup') return 'sign-up';
  return null;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const action = getAuthAction(path);

  if (action === 'sign-up' && !isSignUpEnabled()) {
    return Response.json(
      { error: 'Sign-up is disabled for this household' },
      { status: 403 },
    );
  }

  // Rate-limit auth attempts (Upstash, if configured).
  if (action) {
    const limited = await rateLimitAuthAction(request, action);
    if (limited) return limited;
  }

  return handler.POST(request, { params });
}

// Force dynamic rendering
export const dynamic = 'force-dynamic';
