"use client";

import { Logo } from '@/components/shared/Logo';

interface FooterProps {
  theme: 'light' | 'dark';
}

export function Footer({ theme }: FooterProps) {
  return (
    <footer className="bg-card border-t border-border/40 py-8 mt-auto">
      <div className="container max-w-4xl flex flex-col md:flex-row items-center justify-between gap-4">
        <Logo className="text-sm" theme={theme} />
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} WikiStars5. Todos los derechos reservados.
        </p>
        <div className="flex gap-4 text-sm">
          <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Política de Privacidad</a>
          <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Términos de Servicio</a>
        </div>
      </div>
    </footer>
  );
}
