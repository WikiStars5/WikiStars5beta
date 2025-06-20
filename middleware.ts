
import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  // A list of all locales that are supported
  locales: ['en', 'es', 'pt'],

  // Used when no locale matches
  defaultLocale: 'es',

  // Strategy for prefixing URLs with locales (e.g. /en/about, /es/about)
  // 'as-needed' will not prefix the defaultLocale
  localePrefix: 'as-needed' 
});

export const config = {
  // Match only internationalized pathnames
  // This regex will match all paths except for:
  // - /api/ (API routes)
  // - /_next/static (static files)
  // - /_next/image (image optimization files)
  // - /favicon.ico (favicon file)
  // - Any paths containing a dot (likely static assets like .png, .jpg)
  matcher: ['/((?!api|_next/static|_next/image|.*\\..*|favicon.ico).*)']
};

