"use client";

import { ThemeProvider } from 'next-themes';
import { Toaster } from "@/components/ui/toaster";
import type { ReactNode } from 'react';

// This file is being repurposed to act as the main client-side provider component.
// The component is named LanguageSwitcher to match the filename, as creating new files is not possible.
export function LanguageSwitcher({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
    >
      {/* The main layout structure is now passed as children */}
      {children}
      {/* The Toaster is also a client-side component, so it belongs here */}
      <Toaster />
    </ThemeProvider>
  );
}
