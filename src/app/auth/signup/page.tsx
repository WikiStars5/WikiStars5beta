
import { redirect } from 'next/navigation';

/**
 * This page handles the legacy or incorrect `/auth/signup` route.
 * It permanently redirects to the correct signup page at `/signup`
 * to consolidate routing and prevent potential errors or redirect loops.
 */
export default function LegacySignupRedirectPage() {
  redirect('/signup');
}
