import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// =============================================================================
// CONFIGURATION
// =============================================================================

const PROTECTED_PASSWORD = 'c0usc0us*2344';
const AUTH_COOKIE_NAME = 'tdp_auth';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days in seconds

// Public paths that don't require authentication
const PUBLIC_PATHS = ['/api/auth', '/login'];

// =============================================================================
// MIDDLEWARE — Password Gate
// =============================================================================

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Allow static files and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/icons') ||
    pathname.startsWith('/manifest.json') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Check for auth cookie
  const authCookie = request.cookies.get(AUTH_COOKIE_NAME);

  if (!authCookie || authCookie.value !== hashPassword(PROTECTED_PASSWORD)) {
    // Redirect to login
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// Simple hash function for cookie validation
function hashPassword(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

// =============================================================================
// MATCHER — Apply to all routes except static files
// =============================================================================

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
