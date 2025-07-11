
import { NextRequest, NextResponse } from 'next/server';
import { auth } from './lib/firebase-admin';

export async function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get('__session')?.value;

  // Define public routes that don't require authentication.
  const publicPaths = ['/login', '/signup', '/home', '/figures'];
  const isPublicPath = publicPaths.some(path => request.nextUrl.pathname === path || (path === '/figures' && request.nextUrl.pathname.startsWith('/figures/')));

  // Let public paths and API routes pass through without checks.
  if (isPublicPath || request.nextUrl.pathname.startsWith('/api/') || request.nextUrl.pathname.startsWith('/_next/') || request.nextUrl.pathname.includes('.')) {
      return NextResponse.next();
  }

  // If there's no session cookie for a protected route, redirect to login.
  if (!sessionCookie) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // Verify the session cookie for protected routes.
  try {
    await auth.verifySessionCookie(sessionCookie, true);
    // User is authenticated, proceed to the requested page.
    return NextResponse.next();
  } catch (error) {
    // Session cookie is invalid or expired. Redirect to login.
    console.warn("Middleware: Invalid session cookie. Redirecting to login.");
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', request.nextUrl.pathname);
    const response = NextResponse.redirect(url);
    // Clear the invalid cookie.
    response.cookies.delete('__session');
    return response;
  }
}

export const config = {
  // Match all routes except for static files, API routes, and special Next.js paths.
  // This ensures the middleware runs on page navigations.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|manifest.json|firebase-messaging-sw.js).*)'],
};
