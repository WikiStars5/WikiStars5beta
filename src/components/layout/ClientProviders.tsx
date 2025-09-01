
"use client";

import { ThemeProvider } from 'next-themes';
import { Toaster } from "@/components/ui/toaster";
import React, { type ReactNode } from 'react';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { PushNotificationManager } from '../shared/PushNotificationManager';
import { Loader2 } from 'lucide-react';

// Este componente hijo se asegura de que la UI solo se renderice
// después de que la autenticación (incluida la anónima) se haya completado.
function AuthGate({ children }: { children: ReactNode }) {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}

export function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
    >
      <AuthProvider>
        <AuthGate>
          <PushNotificationManager />
          {children}
          <Toaster />
        </AuthGate>
      </AuthProvider>
    </ThemeProvider>
  );
}
