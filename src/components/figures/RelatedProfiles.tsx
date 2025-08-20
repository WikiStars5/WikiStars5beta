
"use client";

import * as React from 'react';
import { Figure } from '@/lib/types';
import { getFiguresByIds, updateFigureInFirestore } from '@/lib/placeholder-data';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../ui/card';
import { Loader2, PlusCircle, Users, X, ImageOff } from 'lucide-react';
import { Button } from '../ui/button';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { correctMalformedUrl } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { SearchBar } from '../shared/SearchBar';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

interface RelatedProfilesProps {
  figure: Figure;
}

const MAX_RELATED_PROFILES = 10;

export function RelatedProfiles({ figure }: RelatedProfilesProps) {
  const [relatedFigures, setRelatedFigures] = React.useState<Figure[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [isUpdating, setIsUpdating] = React.useState(false);
  const { toast } = useToast();

  React.useEffect(() => {
    const fetchRelated = async () => {
      if (!figure.relatedFigureIds || figure.relatedFigureIds.length === 0) {
        setRelatedFigures([]);
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const figures = await getFiguresByIds(figure.relatedFigureIds);
        setRelatedFigures(figures);
      } catch (error) {
        console.error("Error fetching related profiles:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRelated();
  }, [figure.relatedFigureIds]);

  const handleRemoveProfile = async (profileIdToRemove: string) => {
    if (isUpdating) return;
    setIsUpdating(true);
    try {
      const newIds = figure.relatedFigureIds?.filter(id => id !== profileIdToRemove) || [];
      await updateFigureInFirestore({ id: figure.id, relatedFigureIds: newIds });
      toast({ title: "Perfil Eliminado", description: "El perfil relacionado ha sido eliminado." });
    } catch (error: any) {
      console.error("Error removing related profile:", error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddProfile = async (profileToAdd: Figure) => {
    if (isUpdating) return;
    setIsUpdating(true);
    
    const currentIds = figure.relatedFigureIds || [];

    if (currentIds.length >= MAX_RELATED_PROFILES) {
      toast({ title: "Límite Alcanzado", description: `No se pueden añadir más de ${MAX_RELATED_PROFILES} perfiles relacionados.`, variant: "destructive" });
      setIsUpdating(false);
      return;
    }

    if (currentIds.includes(profileToAdd.id)) {
      toast({ title: "Ya Añadido", description: `${profileToAdd.name} ya está en la lista.`, variant: "destructive" });
      setIsUpdating(false);
      return;
    }
    
    if (profileToAdd.id === figure.id) {
       toast({ title: "Acción no Válida", description: "No puedes añadir un perfil a su propia lista de relacionados.", variant: "destructive" });
       setIsUpdating(false);
       return;
    }

    try {
      const newIds = [...currentIds, profileToAdd.id];
      await updateFigureInFirestore({ id: figure.id, relatedFigureIds: newIds });
      toast({ title: "Perfil Añadido", description: `${profileToAdd.name} ha sido añadido a la lista.` });
      setIsDialogOpen(false);
    } catch (error: any) {
      console.error("Error adding related profile:", error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsUpdating(false);
    }
  };


  return (
    <Card className="border border-white/20 bg-black">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Users />
            Perfiles Relacionados
          </CardTitle>
          <CardDescription>Otros perfiles que podrían interesarte.</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={() => setIsDialogOpen(true)} disabled={(figure.relatedFigureIds?.length || 0) >= MAX_RELATED_PROFILES}>
          <PlusCircle className="mr-2 h-4 w-4" /> Añadir
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : relatedFigures.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {relatedFigures.map(related => {
              const correctedUrl = correctMalformedUrl(related.photoUrl);
              return (
                <div key={related.id} className="relative group">
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 z-10 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleRemoveProfile(related.id)}
                    disabled={isUpdating}
                    aria-label={`Eliminar a ${related.name}`}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <Link href={`/figures/${related.id}`} className="block text-center space-y-2">
                     <div className="relative aspect-square w-full overflow-hidden rounded-md border-2 border-transparent group-hover:border-primary transition-colors bg-muted">
                        {correctedUrl ? (
                            <Image
                                src={correctedUrl}
                                alt={related.name}
                                fill
                                className="object-cover"
                                sizes="(max-width: 640px) 40vw, (max-width: 768px) 30vw, 20vw"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-muted">
                                <ImageOff className="h-8 w-8 text-muted-foreground"/>
                            </div>
                        )}
                    </div>
                    <div>
                      <p className="text-sm font-medium truncate">{related.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{related.category}</p>
                    </div>
                  </Link>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-8 border-2 border-dashed rounded-md">
            <p>No hay perfiles relacionados.</p>
            <p className="text-xs mt-1">¡Añade uno para empezar!</p>
          </div>
        )}
      </CardContent>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Añadir Perfil Relacionado</DialogTitle>
            <DialogDescription>
              Busca una figura para añadirla a la lista de perfiles relacionados de {figure.name}.
            </DialogDescription>
          </DialogHeader>
          <SearchBar onResultClick={(selectedFigure) => handleAddProfile(selectedFigure)} />
        </DialogContent>
      </Dialog>
    </Card>
  );
}

    