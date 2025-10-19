
"use client";

import { ThemeProvider } from 'next-themes';
import { Toaster } from "@/components/ui/toaster";
import React, { type ReactNode } from 'react';
import { AuthProvider } from '@/hooks/use-auth';
import { CommentThreadProvider } from '@/hooks/use-comment-thread';
import { CommentThreadDialog } from '@/components/comments/CommentThreadDialog';
import { FirebaseProvider } from './FirebaseProvider';
import { FirebaseClientProvider } from './FirebaseClientProvider';

// This component provides client-side context, like the theme and toast notifications.
export function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      forcedTheme="dark"
    >
      <FirebaseClientProvider>
        <CommentThreadProvider>
          <AuthProvider>
              {children}
              <CommentThreadDialog />
              <Toaster />
          </AuthProvider>
        </CommentThreadProvider>
      </FirebaseClientProvider>
    </ThemeProvider>
  );
}
