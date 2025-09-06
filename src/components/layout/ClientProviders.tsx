
"use client";

import { ThemeProvider } from 'next-themes';
import { Toaster } from "@/components/ui/toaster";
import React, { type ReactNode } from 'react';

// This component is no longer needed for AuthProvider, but we keep it for ThemeProvider and Toaster.
export function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
    >
      {children}
      <Toaster />
    </ThemeProvider>
  );
}
