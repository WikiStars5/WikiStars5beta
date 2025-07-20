
import { NextResponse, type NextRequest } from 'next/server';
import * as jose from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-key-for-wikistars5-app-please-change';
const secret = new TextEncoder().encode(JWT_SECRET);

// 1. Specify protected and public routes
const protectedRoutes = ['/admin', '/profile', '/foryou'];
const publicRoutes = ['/login', '/signup', '/'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const sessionToken = req.cookies.get('session_token')?.value;

  // 2. Decode the session token if it exists
  let sessionPayload = null;
  if (sessionToken) {
    try {
      const { payload } = await jose.jwtVerify(sessionToken, secret);
      sessionPayload = payload;
    } catch (error) {
      // Token is invalid (expired, malformed, etc.)
      console.warn('Invalid session token:', error);
      // Let's clear the invalid cookie
      const response = NextResponse.redirect(new URL('/login', req.url));
      response.cookies.delete('session_token');
      return response;
    }
  }

  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  // 3. Redirect to login if trying to access a protected route without a session
  if (isProtectedRoute && !sessionPayload) {
    return NextResponse.redirect(new URL('/login', req.url));
  }
  
  // 4. If user is logged in, add user data to the request headers
  if (sessionPayload) {
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('x-user-session', JSON.stringify(sessionPayload));
    
    // If the user is logged in and tries to go to login/signup, redirect to home
    if (pathname.startsWith('/login') || pathname.startsWith('/signup')) {
        return NextResponse.redirect(new URL('/', req.url));
    }

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - firebase-messaging-sw.js (Firebase service worker)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|firebase-messaging-sw.js|api/auth).*)',
  ],
};
