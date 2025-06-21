import { redirect } from 'next/navigation';

// This file creates a route conflict with /src/app/(auth)/signup/page.tsx
// It is causing a "Maximum call stack size exceeded" error on the browser
// by creating an infinite loop in the Next.js router.
// This redirect points to the correct signup page, resolving the conflict.
export default function ConflictingSignupPage() {
    redirect('/signup');
    return null; // The redirect is sufficient, but a return is needed.
}
