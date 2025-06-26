"use client"; 

import { ShieldCheck, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useToast } from "@/hooks/use-toast";

const ADMIN_UID = 'JZP4A5GvZUbWuT0Y1DIiawWcSUp2'; 

export default function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        if (user.uid === ADMIN_UID) {
          setIsAdmin(true);
        } else {
          toast({ title: "Acceso Denegado", description: "No tienes permiso para acceder al panel de administración.", variant: "destructive"});
          router.replace('/'); 
          setIsAdmin(false);
        }
      } else {
        router.replace('/login?redirect=/admin'); 
        setIsAdmin(false);
      }
      setIsLoading(false);
    });

    return () => unsubscribe(); 
  }, [router, toast]);

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Verificando acceso...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return null; 
  }

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow container max-w-screen-2xl py-8">
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
      </main>
    </div>
  );
}
