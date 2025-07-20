
import {NextRequest, NextResponse} from 'next/server';

// Internationalization has been disabled to fix routing issues.
// This middleware is currently inactive and just passes requests through.
export function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  // By removing the matcher, this middleware will not run on any path.
  // This is the safest way to disable it and avoid any routing conflicts.
  matcher: [],
};
