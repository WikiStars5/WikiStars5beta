
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, Sparkles, Users } from 'lucide-react';
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
import { writeBatch, doc, serverTimestamp, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import slugify from 'slugify';
import type { Figure, AttitudeKey, EmotionKey } from '@/lib/types';

const defaultPerceptionCounts: Record<EmotionKey, number> = {
  alegria: 0, envidia: 0, tristeza: 0, miedo: 0, desagrado: 0, furia: 0,
};

const defaultAttitudeCounts: Record<AttitudeKey, number> = {
  neutral: 0, fan: 0, simp: 0, hater: 0,
};

export function BatchCreateFigures() {
  const [names, setNames] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleCreate = async () => {
    setIsLoading(true);
    const namesList = names.split('\n').map(name => name.trim()).filter(name => name.length > 0);

    if (namesList.length === 0) {
      toast({
        title: "No hay nombres",
        description: "Por favor, introduce al menos un nombre en el área de texto.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      const batch = writeBatch(db);
      const figuresCollectionRef = collection(db, 'figures');
      let createdCount = 0;

      namesList.forEach(name => {
        const figureId = slugify(name, { lower: true, strict: true });
        if (figureId) {
          const searchKeywords = name.trim().toLowerCase().split(/\s+/).filter(Boolean);
          const figureRef = doc(figuresCollectionRef, figureId);
          const figureData: Partial<Figure> & { createdAt: any } = {
            name: name,
            nameLower: name.toLowerCase(),
            searchKeywords: searchKeywords,
            photoUrl: `https://placehold.co/400x600.png?text=${encodeURIComponent(name)}`,
            description: '',
            isFeatured: false,
            status: 'approved',
            perceptionCounts: defaultPerceptionCounts,
            attitudeCounts: defaultAttitudeCounts,
            createdAt: serverTimestamp(),
            tags: [],
            tagsLower: [],
          };
          batch.set(figureRef, figureData);
          createdCount++;
        }
      });

      await batch.commit();

      toast({
        title: "¡Creación Masiva Completa!",
        description: `Se han creado ${createdCount} nuevos perfiles.`,
      });

      setNames('');
      router.refresh();

    } catch (error: any) {
      console.error("Error en la creación masiva de perfiles:", error);
      toast({
        title: "Error Inesperado",
        description: "No se pudieron crear los perfiles. Revisa la consola para más detalles.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-headline flex items-center gap-2">
            <Users className="h-5 w-5" />
            Creación Masiva de Perfiles
        </CardTitle>
        <CardDescription>
          Pega una lista de nombres (uno por línea) para crear múltiples perfiles de figuras a la vez.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="batch-names" className="sr-only">Nombres de las figuras</Label>
          <Textarea
            id="batch-names"
            value={names}
            onChange={(e) => setNames(e.target.value)}
            placeholder="Lionel Messi\nCristiano Ronaldo\nRihanna\n..."
            rows={6}
            disabled={isLoading}
          />
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button disabled={isLoading || names.trim().length === 0}>
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              {isLoading ? 'Creando Perfiles...' : 'Crear Perfiles'}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Confirmar Creación Masiva?</AlertDialogTitle>
              <AlertDialogDescription>
                Estás a punto de crear perfiles para cada nombre que has introducido.
                Esta acción no se puede deshacer fácilmente. ¿Deseas continuar?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleCreate} disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {isLoading ? 'Procesando...' : 'Sí, Crear Perfiles'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
