// This file handles the absolute root path `/`.
// The middleware should ideally redirect before this page is hit.
// However, as a fallback, this page will redirect to the default locale's home page.

import { redirect } from 'next/navigation';

export default function RootPageRedirect() {
  // Redirect to the default locale's home page.
  // The default locale is 'es' as per middleware.ts.
  redirect('/es/home');
  
  // This part of the code should ideally not be reached due to the redirect.
  // Returning null or an empty fragment is good practice for components that only redirect.
  return null; 
}
