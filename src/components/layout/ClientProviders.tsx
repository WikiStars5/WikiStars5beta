
"use client";

import { ThemeProvider } from 'next-themes';
import { Toaster } from "@/components/ui/toaster";
import React, { type ReactNode, useState, useEffect } from 'react';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

// Este componente hijo se asegura de que la UI solo se renderice
// después de que la autenticación (incluida la anónima) se haya completado.
function AuthGate({ children }: { children: ReactNode }) {
  const { isLoading } = useAuth();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Show loader only if the component is mounted on the client and auth is still loading.
  // This prevents the hydration mismatch error.
  if (isLoading && isMounted) {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  // If not mounted yet, render nothing or a static placeholder to avoid mismatch.
  // Returning children directly is often fine if the initial server/client states match.
  if (!isMounted) {
    return null;
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
          {children}
          <Toaster />
        </AuthGate>
      </AuthProvider>
    </ThemeProvider>
  );
}
