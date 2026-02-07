import { authApiHandler } from '@neondatabase/auth/next/server';
import type { NextRequest } from 'next/server';

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
  const pathname = request.nextUrl.pathname;

  // Disable sign-up for this deployment.
  if (pathname.endsWith('/sign-up') || pathname.endsWith('/signup')) {
    return Response.json(
      { error: 'Sign-up is disabled for this household' },
      { status: 403 },
    );
  }

  return handler.POST(request, { params });
}

// Force dynamic rendering
export const dynamic = 'force-dynamic';
