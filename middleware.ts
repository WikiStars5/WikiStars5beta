import createMiddleware from 'next-intl/middleware';
import {NextRequest} from 'next/server';

export default async function middleware(request: NextRequest) {
  // Add a few redirects for /auth routes to not show locale prefix
  // For other routes, the middleware will prefix the locale if missing
  const {pathname} = request.nextUrl;

  if (pathname.startsWith('/auth')) {
    // For /auth routes, don't run the next-intl middleware
    // This assumes /auth routes are not localized or handled differently
    return;
  }
  
  const handleI18nRouting = createMiddleware({
    locales: ['es', 'en', 'pt'],
    defaultLocale: 'es',
    localePrefix: 'as-needed' // or 'always' or 'never'
  });

  const response = handleI18nRouting(request);
  return response;
}

export const config = {
  // Match only internationalized pathnames
  matcher: [
    '/', // Root route to redirect to default locale
    '/(es|en|pt)/:path*', // All localized routes
    // Match all pathnames except for
    // - … if they start with `/api`, `/_next` or `/_vercel`
    // - … the ones containing a dot (e.g. `favicon.ico`)
    '/((?!api|_next|_vercel|.*\\..*).*)' 
  ]
};