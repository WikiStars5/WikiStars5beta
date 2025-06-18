
"use client";

import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { NextIntlClientProvider, useMessages } from 'next-intl';

export default function LocaleLayout({
  children,
  params: {locale}
}: {
  children: ReactNode;
  params: {locale: string};
}) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const messages = useMessages();

  useEffect(() => {
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme === 'dark' || storedTheme === 'light') {
      setTheme(storedTheme);
    } else {
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? 'dark' : 'light');
    }
  }, []);

  useEffect(() => {
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
    <NextIntlClientProvider locale={locale} messages={messages}>
      <div className="flex flex-col min-h-screen">
        <Header theme={theme} toggleTheme={toggleTheme} />
        <main className="flex-grow container max-w-screen-2xl py-8">
          {children}
        </main>
        <Footer theme={theme} />
      </div>
    </NextIntlClientProvider>
  );
}
