
"use client";

import { ThemeProvider } from 'next-themes';
import { Toaster } from "@/components/ui/toaster";
import type { ReactNode } from 'react';
import { AuthProvider } from '@/hooks/useAuth';
import { PushNotificationManager } from '../shared/PushNotificationManager';

export function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
    >
      <AuthProvider>
        <PushNotificationManager />
        {children}
        <Toaster />
      </AuthProvider>
    </ThemeProvider>
  );
}
