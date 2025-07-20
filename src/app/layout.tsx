
import './globals.css';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import type { ReactNode } from 'react';
import { ClientProviders } from '@/components/layout/ClientProviders';
import type { Metadata } from 'next';
import { PushNotificationManager } from '@/components/shared/PushNotificationManager';
import { NotificationPrompt } from '@/components/shared/NotificationPrompt';

const logoUrl = "https://firebasestorage.googleapis.com/v0/b/wikistars5-2yctr.firebasestorage.app/o/logo%2Flogodia.png?alt=media&token=fc619841-d174-41ce-a613-3cb94cec8194";

export const metadata: Metadata = {
  metadataBase: new URL('https://wikistars5.com'),
  manifest: '/manifest.json',
  title: 'WikiStars5 - Percepción de Figuras Públicas',
  description: 'Califica y discute sobre figuras públicas en WikiStars5.',
  themeColor: '#111827', // Dark theme color
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'WikiStars5',
  },
  icons: {
    icon: {
      url: logoUrl,
      type: 'image/png',
    },
    shortcut: {
      url: logoUrl,
      type: 'image/png',
    },
    apple: {
      url: logoUrl,
      type: 'image/png',
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased bg-background text-foreground">
        <ClientProviders>
          <PushNotificationManager />
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-grow container mx-auto px-4 py-8">
              {children}
            </main>
            <Footer />
          </div>
          <NotificationPrompt />
        </ClientProviders>
      </body>
    </html>
  );
}
