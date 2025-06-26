import {NextRequest, NextResponse} from 'next/server';

// Internationalization has been temporarily disabled to fix a routing issue.
// This middleware is currently inactive.
export function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Skip all internal paths (_next)
    '/((?!_next|api|favicon.ico).*)',
  ],
};
