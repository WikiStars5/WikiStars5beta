
"use client";

import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';

export default function MainLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    // This effect should only run on the client
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme === 'dark' || storedTheme === 'light') {
      setTheme(storedTheme);
    } else {
      // If no theme is stored, or if it's invalid, check system preference
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? 'dark' : 'light');
    }
  }, []);

  useEffect(() => {
    // This effect should also only run on the client
    localStorage.setItem('theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header theme={theme} toggleTheme={toggleTheme} />
      <main className="flex-grow container max-w-screen-2xl py-8">
        {children}
      </main>
      <Footer />
    </div>
  );
}
