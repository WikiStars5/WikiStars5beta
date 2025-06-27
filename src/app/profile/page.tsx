
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * This page has been disabled due to persistent errors.
 * It now redirects users to the home page.
 */
export default function DisabledProfilePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/home');
  }, [router]);

  return null;
}
