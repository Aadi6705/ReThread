import { NextResponse, type NextRequest } from 'next/server';

/**
 * Next.js Edge Middleware for client route guarding.
 * Note: UX optimization to prevent layout flicker on protected routes.
 * The backend FastAPI API remains the authoritative security/authorization boundary.
 */
const PROTECTED_PREFIXES = [
  '/dashboard',
  '/listings',
  '/enquiries',
  '/sales',
  '/messages',
  '/wishlist',
  '/profile',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (isProtected) {
    const accessToken = request.cookies.get('access_token')?.value;

    if (!accessToken) {
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/listings/:path*',
    '/enquiries/:path*',
    '/sales/:path*',
    '/messages/:path*',
    '/wishlist/:path*',
    '/profile/:path*',
  ],
};
