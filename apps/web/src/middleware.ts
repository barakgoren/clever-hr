import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_PATHS = ['/login'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public paths and public job board routes
  if (
    PUBLIC_PATHS.includes(pathname) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    // public job board: /[slug] and /[slug]/[roleId]
    (/^\/[^/]+$/.test(pathname) && !pathname.startsWith('/dashboard')) ||
    (/^\/[^/]+\/[^/]+$/.test(pathname) && !pathname.startsWith('/dashboard'))
  ) {
    return NextResponse.next();
  }

  // For dashboard routes the auth check is done client-side (token in memory).
  // Middleware just passes through — the dashboard layout will redirect if not authed.
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
