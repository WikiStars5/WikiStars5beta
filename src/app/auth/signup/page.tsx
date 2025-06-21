"use client";

// This page is intentionally left blank to resolve a routing conflict
// with the main signup page at /src/app/(auth)/signup/page.tsx.
// By making this an inert client component, we prevent Next.js from
// entering a redirect loop that causes a "Maximum call stack size exceeded" error.
export default function ConflictingSignupRoute() {
  return null;
}
