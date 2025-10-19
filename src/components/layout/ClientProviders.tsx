
"use client";

import { ThemeProvider } from 'next-themes';
import { Toaster } from "@/components/ui/toaster";
import React, { type ReactNode, Suspense } from 'react';
import { AuthProvider } from '@/hooks/use-auth';
import { CommentThreadProvider } from '@/hooks/use-comment-thread';
import { CommentThreadDialog } from '@/components/comments/CommentThreadDialog';
import { usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';

function LoadingFallback() {
    const pathname = usePathname();
    const isAdminRoute = pathname.startsWith('/admin');

    // Don't show global loader for admin routes as they have their own.
    if (isAdminRoute) {
        return null;
    }
    
    return (
        <div className="fixed inset-0 flex items-center justify-center bg-background z-[200]">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
    );
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
            <Suspense fallback={<LoadingFallback/>}>
              {children}
            </Suspense>
          <CommentThreadDialog />
          <Toaster />
        </AuthProvider>
      </CommentThreadProvider>
    </ThemeProvider>
  );
}
