
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { SearchBar } from "@/components/shared/SearchBar";

export function MobileSearchButton() {
  const [isOpen, setIsOpen] = useState(false);

  const handleSearchResultClick = () => {
    setIsOpen(false); // Cierra el sheet cuando se hace clic en un resultado
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="md:hidden text-foreground/70 hover:text-foreground" 
          aria-label="Abrir búsqueda móvil"
        >
          <Search className="h-5 w-5" />
          <span className="sr-only">Buscar</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="top" className="p-4 pt-6 h-auto">
        <SheetHeader className="mb-4">
          <SheetTitle className="text-center text-lg font-semibold">Buscar Figuras</SheetTitle>
          {/* SheetDescription podría ir aquí si se necesita */}
        </SheetHeader>
        <SearchBar 
          onResultClick={handleSearchResultClick} 
          className="w-full"
          initialQuery="" // Asegurarse que no herede querys
        />
        {/* Se puede añadir un botón de cerrar explícito si se desea, aunque Sheet ya lo maneja */}
        {/* <SheetClose asChild><Button variant="outline" className="mt-4 w-full">Cerrar</Button></SheetClose> */}
      </SheetContent>
    </Sheet>
  );
}
