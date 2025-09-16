
"use client"; 

import { ShieldCheck, Hourglass } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import type { ReactNode } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { currentUser, isAdmin, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // If we are on the login page, don't run auth checks.
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-4 text-muted-foreground">Verificando acceso...</p>
      </div>
    );
  }

  if (!currentUser || !isAdmin) {
    // A small delay before redirecting to allow the user to see the message.
    setTimeout(() => {
      router.push('/admin/login');
    }, 2000);

    return (
      <Alert variant="destructive">
        <ShieldCheck className="h-4 w-4" />
        <AlertTitle>Acceso Denegado</AlertTitle>
        <AlertDescription>
          No tienes permisos para acceder a esta sección. Serás redirigido a la página de inicio de sesión.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 pb-4 border-b gap-4">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-headline">Panel de Administración</h1>
        </div>
        <nav className="flex flex-wrap gap-2">
          <Button variant="outline" asChild><Link href="/admin">Panel</Link></Button>
          <Button variant="outline" asChild><Link href="/admin/figures">Gestionar Figuras</Link></Button>
        </nav>
      </div>
      {children}
    </>
  );
}
