
"use client";

import { useState, useEffect } from 'react';
import type { Figure, UserProfile } from '@/lib/types';
import { getFiguresByIds } from '@/lib/placeholder-data';
import { FigureListItem } from '@/components/figures/FigureListItem';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface FavoriteFiguresListProps {
  userProfile: UserProfile;
}

export default function FavoriteFiguresList({ userProfile }: FavoriteFiguresListProps) {
  const [favoriteFigures, setFavoriteFigures] = useState<Figure[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFavorites = async () => {
      setIsLoading(true);
      if (userProfile.favoriteFigures && userProfile.favoriteFigures.length > 0) {
        const figures = await getFiguresByIds(userProfile.favoriteFigures);
        setFavoriteFigures(figures);
      } else {
        setFavoriteFigures([]);
      }
      setIsLoading(false);
    };

    fetchFavorites();
  }, [userProfile.favoriteFigures]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">Cargando tus favoritos...</p>
      </div>
    );
  }

  if (favoriteFigures.length === 0) {
    return (
      <div className="text-center py-10">
        <h3 className="text-lg font-semibold">Aún no tienes favoritos</h3>
        <p className="text-muted-foreground mt-2">
          Explora las figuras y haz clic en el corazón para guardarlas aquí.
        </p>
        <Button asChild className="mt-4">
          <Link href="/figures">Explorar Figuras</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {favoriteFigures.map((figure) => (
        <FigureListItem key={figure.id} figure={figure} />
      ))}
    </div>
  );
}
