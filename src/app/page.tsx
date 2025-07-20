
"use client";

import React from 'react';
import { SearchBar } from '@/components/shared/SearchBar';

export default function HomePage() {

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-20rem)] text-center px-4">
      <div 
        className="w-full max-w-4xl p-8 md:p-12 rounded-lg bg-gradient-to-br from-card to-background shadow-lg border border-border/20"
      >
        <h1 className="text-5xl md:text-6xl font-bold font-headline mb-4 tracking-tight">
          Bienvenido a <span className="text-yellow-400">WikiStars5</span>
        </h1>
        <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
          La plataforma interactiva para explorar, calificar y debatir sobre la percepción pública de tus figuras favoritas. Descubre perfiles detallados, vota sobre tu actitud y emociones, y únete a la conversación global.
        </p>
        <div className="max-w-xl mx-auto">
          <SearchBar />
           <p className="text-sm text-muted-foreground mt-2">
            Escribe un nombre y presiona enter o haz clic en buscar.
          </p>
        </div>
      </div>
    </div>
  );
}
