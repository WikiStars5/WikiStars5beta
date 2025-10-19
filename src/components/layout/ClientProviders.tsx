
"use client";

import { ThemeProvider } from 'next-themes';
import { Toaster } from "@/components/ui/toaster";
import React, { type ReactNode } from 'react';
import { AuthProvider } from '@/hooks/use-auth';
import { CommentThreadProvider } from '@/hooks/use-comment-thread';
import { CommentThreadDialog } from '@/components/comments/CommentThreadDialog';
import { usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

function AuthWrapper({ children }: { children: ReactNode }) {
  const { isLoading } = useAuth();
  const pathname = usePathname();
  
  const isAdminRoute = pathname.startsWith('/admin');

  if (isLoading && !isAdminRoute) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background z-[200]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }
  
  return <>{children}</>;
}


// This component provides client-side context, like the theme and toast notifications.
export function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      forcedTheme="dark"
    >
      <CommentThreadProvider>
        <AuthProvider>
          <AuthWrapper>
            {children}
          </AuthWrapper>
          <CommentThreadDialog />
          <Toaster />
        </AuthProvider>
      </CommentThreadProvider>
    </ThemeProvider>
  );
}
