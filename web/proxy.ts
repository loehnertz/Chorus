import { neonAuthMiddleware } from '@neondatabase/auth/next/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Next.js Proxy (Route Protection)
 * Checks authentication with Neon Auth
 *
 * Note: User approval checking is done at the application level (dashboard layout)
 * because proxy runs on edge runtime which doesn't support Prisma database queries
 *
 * Public routes (no authentication required):
 * - /sign-in (login page)
 * - /pending-approval (waiting for approval page)
 * - /api/auth/* (authentication API routes)
 * - /manifest.webmanifest (PWA manifest)
 * - /sw.js (service worker)
 * - /~offline (offline fallback)
 * - /robots.txt (crawler directives)
 */

const exactPublicRoutes = new Set([
  '/sign-in',
  '/pending-approval',
  '/manifest.webmanifest',
  '/sw.js',
  '/~offline',
  '/robots.txt',
]);

function isPublicRoute(pathname: string) {
  if (exactPublicRoutes.has(pathname)) return true;
  if (pathname.startsWith('/api/auth')) return true;
  return false;
}

const authMiddleware = neonAuthMiddleware({
  loginUrl: '/sign-in',
});

export default async function middleware(request: NextRequest) {
  // Allow public routes without authentication
  if (isPublicRoute(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  // Apply Neon Auth middleware for all other routes
  return authMiddleware(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
