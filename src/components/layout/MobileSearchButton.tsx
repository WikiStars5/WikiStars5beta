
"use client";

import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function MobileSearchButton() {
  const { toast } = useToast();

  const handleSearchClick = () => {
    toast({
      title: "Búsqueda No Implementada",
      description: "La búsqueda móvil estará disponible pronto. Por favor, usa la barra de búsqueda en la página de inicio.",
    });
  };

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      className="md:hidden" 
      onClick={handleSearchClick}
      aria-label="Buscar (marcador de posición)"
    >
      <Search className="h-5 w-5" />
      <span className="sr-only">Buscar</span>
    </Button>
  );
}
