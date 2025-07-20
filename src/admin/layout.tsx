"use client"; 

import { ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import type { ReactNode } from 'react';

// NOTE: The authentication logic has been temporarily removed to allow access
// while the new authentication system is being built.
export default function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
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
