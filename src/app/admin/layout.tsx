
"use client"; 

import { ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import type { ReactNode } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { ADMIN_UID } from '@/config/admin';


export default function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { currentUser, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Si no está cargando y el usuario no es el admin, redirigir.
    if (!isLoading && currentUser?.uid !== ADMIN_UID) {
      router.push('/');
    }
  }, [currentUser, isLoading, router]);

  if (isLoading) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
            <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Verificando credenciales de administrador...</p>
        </div>
    );
  }

  // Si después de cargar, el usuario no es el admin, no renderizar nada mientras se redirige.
  if (!currentUser || currentUser.uid !== ADMIN_UID) {
    return (
       <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
          <Alert variant="destructive" className="max-w-md">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Acceso Denegado</AlertTitle>
            <AlertDescription>
              No tienes permisos para acceder a esta página. Serás redirigido.
            </AlertDescription>
          </Alert>
       </div>
    );
  }

  // Si el usuario es el admin, mostrar el layout y el contenido.
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
          <Button variant="outline" asChild><Link href="/admin/users">Gestionar Usuarios</Link></Button>
        </nav>
      </div>
      {children}
    </>
  );
}
