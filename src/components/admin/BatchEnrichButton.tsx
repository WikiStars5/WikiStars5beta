

"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { collection, doc, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Figure } from '@/lib/types';
import { useRouter } from 'next/navigation';

export function BatchEnrichButton() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleUpdate = async () => {
    setIsLoading(true);
    toast({
      title: "Función no disponible",
      description: "La funcionalidad de IA para enriquecimiento masivo está temporalmente desactivada.",
      variant: "destructive"
    });
    setIsLoading(false);
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline">
            <Sparkles className="mr-2 h-4 w-4" />
            Enriquecer Perfiles con IA
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Confirmar Enriquecimiento Masivo?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción escaneará todos los perfiles en la base de datos y usará la IA para añadir/actualizar la descripción, categorías, ocupación y más.
            <br/><br/>
            El proceso se saltará los perfiles que ya tengan categorías asignadas para evitar sobrescribir datos. Esta operación puede tardar varios minutos y no se puede deshacer. ¿Deseas continuar?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleUpdate} disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {isLoading ? 'Procesando...' : 'Sí, Enriquecer Todos'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
