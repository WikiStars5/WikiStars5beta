
"use client";

import { useState } from 'react';
import type { User } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Heart, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { toggleFavoriteFigure } from '@/app/actions/userActions';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface FavoriteButtonProps {
  figureId: string;
  currentUser: User | null;
  initialIsFavorited: boolean;
}

export default function FavoriteButton({ figureId, currentUser, initialIsFavorited }: FavoriteButtonProps) {
  const { toast } = useToast();
  const [isFavorited, setIsFavorited] = useState(initialIsFavorited);
  const [isLoading, setIsLoading] = useState(false);

  const canFavorite = currentUser && !currentUser.isAnonymous;

  const handleToggleFavorite = async () => {
    if (!canFavorite || !currentUser) {
      toast({
        title: 'Acción Requerida',
        description: (
          <p>
            Debes <Link href="/login" className="font-semibold text-primary hover:underline">iniciar sesión</Link> para guardar favoritos.
          </p>
        ),
      });
      return;
    }

    setIsLoading(true);
    // Optimistic update
    setIsFavorited(!isFavorited);

    const result = await toggleFavoriteFigure(currentUser.uid, figureId);

    if (!result.success) {
      // Revert optimistic update on failure
      setIsFavorited(isFavorited);
      toast({
        title: 'Error',
        description: result.message,
        variant: 'destructive',
      });
    }
    // No success toast to keep it subtle, the UI change is the feedback

    setIsLoading(false);
  };
  
  return (
    <Button
      variant="outline"
      size="default"
      onClick={handleToggleFavorite}
      disabled={isLoading}
      aria-label={isFavorited ? 'Quitar de favoritos' : 'Añadir a favoritos'}
    >
      {isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <Heart
          className={cn(
            "h-5 w-5 transition-all",
            isFavorited
              ? "text-red-500 fill-red-500"
              : "text-foreground/70"
          )}
        />
      )}
      {canFavorite && <span className="ml-2">{isFavorited ? 'Favorito' : 'Añadir a Favoritos'}</span>}
    </Button>
  );
}
