"use client";

import { Logo } from '@/components/shared/Logo';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-card border-t border-border/40 py-8 mt-auto">
      <div className="w-full max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 px-4">
        <Logo className="text-sm" />
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} WikiStars5. Todos los derechos reservados.
        </p>
        <div className="flex gap-4 text-sm">
          <Link href="/admin/login" className="text-muted-foreground hover:text-foreground transition-colors">Admin Login</Link>
          <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Política de Privacidad</a>
          <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Términos de Servicio</a>
        </div>
      </div>
    </footer>
  );
}
