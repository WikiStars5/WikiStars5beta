

"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Tags, Loader2 } from 'lucide-react';
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
import { useRouter } from 'next/navigation';

const generateHashtagKeywords = (hashtags: string[]): string[] => {
    if (!hashtags || hashtags.length === 0) return [];
    const keywords = new Set<string>();

    hashtags.forEach(tag => {
        const normalizedTag = tag.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
        if (!normalizedTag) return;
        for (let i = 1; i <= normalizedTag.length; i++) {
            keywords.add(normalizedTag.substring(0, i));
        }
    });

    return Array.from(keywords);
};


export function BatchUpdateTagsButton() {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

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
        const hashtags = figureData.hashtags || [];
        
        // Generate both lowercase list and prefix keywords
        const newHashtagsLower = hashtags.map(t => t.toLowerCase());
        const newHashtagKeywords = generateHashtagKeywords(hashtags);
        
        const currentHashtagsLower = JSON.stringify((figureData.hashtagsLower || []).sort());
        const currentHashtagKeywords = JSON.stringify((figureData.hashtagKeywords || []).sort());

        if (
          JSON.stringify(newHashtagsLower.sort()) !== currentHashtagsLower ||
          JSON.stringify(newHashtagKeywords.sort()) !== currentHashtagKeywords
        ) {
          const figureRef = doc(db, 'figures', docSnap.id);
          batch.update(figureRef, { 
              hashtagsLower: newHashtagsLower,
              hashtagKeywords: newHashtagKeywords,
          });
          updatedCount++;
        }
      });

      if (updatedCount > 0) {
        await batch.commit();
        toast({
          title: "Proceso Completado",
          description: `Se sincronizaron los hashtags y sus palabras clave para ${updatedCount} perfiles.`,
        });
        router.refresh(); 
      } else {
        toast({
          title: "Proceso Exitoso",
          description: "¡Todos los hashtags ya están sincronizados!",
        });
      }
    } catch (error: any) {
      console.error("Failed to run batch tag update from client:", error);
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
              <Tags className="mr-2 h-4 w-4" />
            )}
            {isProcessing ? 'Procesando...' : 'Sincronizar Hashtags'}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Confirmar Sincronización de Hashtags?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción escaneará todas las figuras y (re)generará los campos `hashtagsLower` y `hashtagKeywords` para habilitar búsquedas por autocompletado en hashtags.
            <br/><br/>
            Usa esto si las figuras existentes no aparecen al buscar hashtags. ¿Deseas continuar?
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
