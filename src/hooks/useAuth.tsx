
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { UserProfile } from '@/lib/types';
import { usePathname } from 'next/navigation';

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
});

async function getSession(): Promise<UserProfile | null> {
    try {
        const res = await fetch('/api/auth/session', { cache: 'no-store' });
        if (!res.ok) return null;
        const data = await res.json();
        return data.session || null;
    } catch (error) {
        console.error("Failed to fetch session:", error);
        return null;
    }
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    const fetchUserSession = async () => {
      setIsLoading(true);
      const sessionUser = await getSession();
      setUser(sessionUser);
      setIsLoading(false);
    };

    fetchUserSession();
  }, [pathname]); // Refetch session on route change

  return (
    <AuthContext.Provider value={{ user, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
