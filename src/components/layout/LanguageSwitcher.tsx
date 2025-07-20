
"use client";

import { ThemeProvider } from 'next-themes';
import { Toaster } from "@/components/ui/toaster";
import type { ReactNode } from 'react';
import { AuthProvider } from '@/hooks/useAuth';

// This file is being repurposed to act as the main client-side provider component.
export function LanguageSwitcher({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
    >
      <AuthProvider>
        {children}
        <Toaster />
      </AuthProvider>
    </ThemeProvider>
  );
}
