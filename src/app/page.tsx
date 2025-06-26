
import { redirect } from 'next/navigation';

// This page now simply redirects to the default locale's home page.
// The middleware handles this more gracefully, but this is a good fallback.
export default function RootPageRedirect() {
  redirect('/home');
  return null; 
}
