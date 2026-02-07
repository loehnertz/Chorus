import { authApiHandler } from '@neondatabase/auth/next/server';
import type { NextRequest } from 'next/server';

import { rateLimitAuthAction } from '@/lib/auth/rate-limit';

/**
 * Neon Auth API handler
 * Handles all authentication requests.
 *
 * Note: For launch, sign-up is disabled (invite-only household).
 */
const handler = authApiHandler();

export const GET = handler.GET;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const pathname = new URL(request.url).pathname;

  // Disable sign-up for this deployment.
  if (pathname.endsWith('/sign-up') || pathname.endsWith('/signup')) {
    return Response.json(
      { error: 'Sign-up is disabled for this household' },
      { status: 403 },
    );
  }

  // Rate-limit sign-in attempts (Upstash, if configured).
  if (pathname.includes('/sign-in') || pathname.includes('/signin')) {
    const limited = await rateLimitAuthAction(request, 'sign-in');
    if (limited) return limited;
  }

  return handler.POST(request, { params });
}

// Force dynamic rendering
export const dynamic = 'force-dynamic';
