
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * This page has been disabled due to persistent errors and the removal
 * of the "Favorites" feature, which it depended on.
 * It now redirects users to the home page.
 */
export default function DisabledMyActivityPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/home');
  }, [router]);

  return null; 
}
