
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { UserProfile } from '@/lib/types';
import { Loader2 } from 'lucide-react';

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await fetch('/api/auth/session');
        if (res.ok) {
          const data = await res.json();
          setUser(data.session || null);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Failed to fetch session:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSession();
  }, []);
  
  const value = { user, isLoading };

  return (
    <AuthContext.Provider value={value}>
      {isLoading ? (
        <div className="flex h-screen items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
