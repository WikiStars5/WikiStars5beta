import {NextRequest, NextResponse} from 'next/server';

// Internationalization has been disabled to fix routing issues.
// This middleware is currently inactive and just passes requests through.
export function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    // This matcher is intentionally broad but skips internal Next.js paths.
    // It's kept to make re-enabling middleware easier in the future.
    '/((?!_next|api|favicon.ico).*)',
  ],
};
