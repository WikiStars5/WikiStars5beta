import { redirect } from 'next/navigation';

// This root layout is no longer directly used for rendering pages.
// It will now redirect to the locale-based layout.
// The new main layout is at `src/app/[locale]/layout.tsx`.
export default function RootLayout() {
  // The middleware will handle the initial redirect. 
  // This is a fallback in case the middleware is bypassed.
  redirect('/es'); // Redirect to the default locale
}
