
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
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Figure } from '@/lib/types';
import { enrichAndSaveFigureData } from '@/app/actions/enrichFigureAction';

interface BatchEnrichButtonProps {
  figures: Figure[];
  onUpdate: (figureId: string, updatedData: Partial<Figure>) => void;
  setEnrichingId: (id: string | null) => void;
}

export function BatchEnrichButton({ figures, onUpdate, setEnrichingId }: BatchEnrichButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleUpdate = async () => {
    setIsLoading(true);
    toast({
      title: "Iniciando Enriquecimiento Masivo...",
      description: "Este proceso puede tardar varios minutos. No cierres esta ventana.",
      duration: 5000
    });

    let updatedCount = 0;
    const figuresToProcess = [...figures].sort((a, b) => a.name.localeCompare(b.name));

    for (const figure of figuresToProcess) {
      // Corrected logic: only process if categories are missing or the array is empty.
      if (figure.categories && figure.categories.length > 0) {
        continue;
      }

      setEnrichingId(figure.id); // Set current enriching ID for live feedback

      try {
        const result = await enrichAndSaveFigureData({ name: figure.name, existingDescription: figure.description });
        
        if (result.success && result.data) {
          const figureRef = doc(db, 'figures', figure.id);
          const updatePayload = { 
            categories: result.data.categories,
          };
          await updateDoc(figureRef, updatePayload);
          onUpdate(figure.id, updatePayload); // Update parent component state
          updatedCount++;
        } else {
           console.warn(`Could not enrich data for ${figure.name} (ID: ${figure.id}). Error: ${result.error}`);
        }
      } catch (e) {
          console.warn(`Could not enrich data for ${figure.name} (ID: ${figure.id}). Skipping. Error:`, e);
      } finally {
        setEnrichingId(null); // Clear enriching ID
      }
    }

    setIsLoading(false);
    setEnrichingId(null);
    toast({
      title: "¡Proceso Completado!",
      description: `Se categorizaron ${updatedCount} perfiles.`,
    });
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            {isLoading ? 'Enriqueciendo...' : 'Enriquecer Perfiles con IA'}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Confirmar Enriquecimiento Masivo?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción escaneará los perfiles en orden alfabético y usará la IA para añadir categorías.
            <br/><br/>
            El proceso se saltará los perfiles que ya tengan categorías asignadas. Esta operación puede tardar varios minutos y no se puede deshacer. ¿Deseas continuar?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleUpdate}>
            Sí, Enriquecer
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
