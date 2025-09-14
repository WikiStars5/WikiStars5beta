

"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { SearchCheck, Loader2 } from 'lucide-react';
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
} from "@/components/ui/alert-dialog"
import { collection, doc, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Figure } from '@/lib/types';

// Generates all possible prefixes for each word in a name.
// E.g., "Lionel Messi" -> ['l', 'li', 'lio', ... 'lionel', 'm', 'me', ... 'messi']
const generateKeywords = (name: string): string[] => {
    if (!name) return [];
    const keywords = new Set<string>();
    const normalizedName = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const words = normalizedName.split(/\s+/).filter(Boolean);

    words.forEach(word => {
        for (let i = 1; i <= word.length; i++) {
            keywords.add(word.substring(0, i));
        }
    });

    return Array.from(keywords);
};


export function BatchUpdateSearchButton() {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleUpdate = async () => {
    setIsProcessing(true);
    try {
      const figuresCollectionRef = collection(db, 'figures');
      const querySnapshot = await getDocs(figuresCollectionRef);
      
      if (querySnapshot.empty) {
        toast({ title: "Proceso Exitoso", description: "No se encontraron figuras para procesar." });
        setIsProcessing(false);
        return;
      }

      const batch = writeBatch(db);
      let updatedCount = 0;

      querySnapshot.forEach(docSnap => {
        const figureData = docSnap.data() as Figure;
        const currentName = figureData.name;
        
        if (currentName) {
            const newSearchName = currentName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
            const newKeywords = generateKeywords(currentName);
            
            // Check if an update is needed
            if (figureData.nameSearch !== newSearchName || JSON.stringify(figureData.nameKeywords) !== JSON.stringify(newKeywords)) {
                const figureRef = doc(db, 'figures', docSnap.id);
                batch.update(figureRef, { 
                    nameSearch: newSearchName,
                    nameKeywords: newKeywords
                });
                updatedCount++;
            }
        }
      });

      if (updatedCount > 0) {
        await batch.commit();
        toast({
          title: "Proceso Completado",
          description: `Se sincronizaron los campos de búsqueda para ${updatedCount} perfiles. El buscador ya debería funcionar para todos.`,
        });
      } else {
        toast({
          title: "Proceso Exitoso",
          description: "¡Todos los perfiles ya estaban sincronizados para la búsqueda!",
        });
      }
    } catch (error: any) {
      console.error("Failed to run batch search update from client:", error);
      let errorMessage = "No se pudo completar la operación.";
      if (error.code === 'permission-denied') {
        errorMessage = "Error de permisos. Asegúrate de que las reglas de Firestore permiten escribir al administrador.";
      } else {
        errorMessage = `Error: ${error.message}`;
      }
      toast({
        title: "Error Inesperado",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" disabled={isProcessing}>
            {isProcessing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <SearchCheck className="mr-2 h-4 w-4" />
            )}
            {isProcessing ? 'Sincronizando...' : 'Sincronizar Búsqueda'}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Confirmar Sincronización de Búsqueda?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción escaneará todas las figuras y (re)generará los campos `nameSearch` y `nameKeywords` para habilitar búsquedas flexibles y por cualquier parte del nombre.
            <br/><br/>
            Usa esto si personajes existentes no aparecen en los resultados. ¿Deseas continuar?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isProcessing}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleUpdate} disabled={isProcessing}>
            {isProcessing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {isProcessing ? 'Sincronizando...' : 'Sí, Sincronizar'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

    