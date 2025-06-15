
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2 } from 'lucide-react';
import { enrichAndSaveFigureData } from '@/app/actions/enrichFigureAction';
import type { Figure } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

interface EnrichInfoButtonProps {
  figure: Figure;
}

export function EnrichInfoButton({ figure }: EnrichInfoButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const needsEnrichment = !figure.description || !figure.nationality || !figure.occupation || !figure.gender;

  if (!needsEnrichment) {
    return null;
  }

  const handleEnrich = async () => {
    setIsLoading(true);
    try {
      const result = await enrichAndSaveFigureData(figure.id, figure.name, {
        description: figure.description,
        nationality: figure.nationality,
        occupation: figure.occupation,
        gender: figure.gender,
      });

      if (result.success) {
        toast({
          title: 'Información Enriquecida',
          description: result.message,
        });
        router.refresh(); // Refresh the current page to show updated data
      } else {
        toast({
          title: 'Error al Enriquecer',
          description: result.message,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error("Enrichment error:", error);
      toast({
        title: 'Error Inesperado',
        description: 'Ocurrió un error al intentar enriquecer la información.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button onClick={handleEnrich} disabled={isLoading} variant="outline" size="sm" className="mt-4">
      {isLoading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Sparkles className="mr-2 h-4 w-4" />
      )}
      {isLoading ? 'Enriqueciendo...' : 'Autocompletar Información con IA'}
    </Button>
  );
}
