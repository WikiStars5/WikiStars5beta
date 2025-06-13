
"use client";

import { useState, useEffect } from 'react';
import type { PerceptionKeys, UserRating, Figure } from '@/lib/types';
import { PERCEPTION_OPTIONS } from '@/lib/placeholder-data';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { submitOrUpdateUserPerception, getUserPerception } from '@/lib/actions/ratingActions';
import { useRouter } from 'next/navigation';
import { getAuth, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import Link from 'next/link';

interface RatingSystemProps {
  figure: Figure; 
}

export function RatingSystem({ figure }: RatingSystemProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [selectedPerception, setSelectedPerception] = useState<PerceptionKeys | null>(null);
  const [currentUserFb, setCurrentUserFb] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState<PerceptionKeys | null>(null); 
  const [isFetchingInitial, setIsFetchingInitial] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUserFb(user);
      setAuthLoading(false);
      if (user) {
        setIsFetchingInitial(true);
        getUserPerception(user.uid, figure.id).then(existingPerceptionData => {
          setSelectedPerception(existingPerceptionData?.perception || null);
          setIsFetchingInitial(false);
        }).catch(() => {
          setIsFetchingInitial(false);
        });
      } else {
        setIsFetchingInitial(false);
        setSelectedPerception(null);
      }
    });
    return () => unsubscribe();
  }, [figure.id]);

  const handlePerceptionClick = async (perceptionKey: PerceptionKeys) => {
    if (!currentUserFb) {
      toast({ title: "Inicio de Sesión Requerido", description: "Por favor, inicia sesión para compartir tu percepción.", variant: "destructive" });
      return;
    }

    setIsLoading(perceptionKey); 

    let newPerceptionToSubmit: PerceptionKeys | null = perceptionKey;
    if (selectedPerception === perceptionKey) {
      newPerceptionToSubmit = null;
    }

    const result = await submitOrUpdateUserPerception(currentUserFb.uid, figure.id, newPerceptionToSubmit, selectedPerception);
    setIsLoading(null); 

    if (result.success) {
      setSelectedPerception(newPerceptionToSubmit);
      // router.refresh() will update perceptionCounts displayed on figure object
      router.refresh(); 
    } else {
      toast({
        title: "Error al Actualizar Percepción",
        description: result.message || "No se pudo actualizar tu percepción.",
        variant: "destructive",
      });
    }
  };
  
  if (authLoading || isFetchingInitial) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="h-24 animate-pulse bg-muted rounded-md flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!currentUserFb) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='font-headline text-2xl'>Tu Percepción de {figure.name}</CardTitle>
          <CardDescription>Inicia sesión para compartir si eres fan, detractor, etc., respecto a {figure.name}.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild><Link href={`/login?redirect=/figures/${figure.id}`}>Inicia Sesión para Compartir Percepción</Link></Button>
        </CardContent>
      </Card>
    );
  }

  const perceptionCounts = figure.perceptionCounts || { neutral: 0, fan: 0, simp: 0, hater: 0 };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Tu Percepción de {figure.name}</CardTitle>
        <CardDescription>Haz clic en un botón para compartir o actualizar tu percepción. Vuelve a hacer clic para eliminarla.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {PERCEPTION_OPTIONS.map((option) => (
              <Button
                key={option.key}
                variant={selectedPerception === option.key ? "default" : "outline"}
                onClick={() => handlePerceptionClick(option.key)}
                className={cn(
                  "flex flex-col h-auto p-3 items-center justify-center space-y-1 text-center transition-all duration-150 ease-in-out transform hover:scale-105",
                  selectedPerception === option.key && "ring-2 ring-primary shadow-md",
                  isLoading === option.key && "opacity-70 cursor-not-allowed"
                )}
                disabled={isLoading !== null && isLoading !== option.key} 
              >
                {isLoading === option.key ? <Loader2 className="w-7 h-7 mb-1 animate-spin" /> : <option.icon className={cn("w-7 h-7 mb-1", selectedPerception === option.key ? "text-primary-foreground" : "text-foreground/80")} />}
                <span className="text-sm font-medium">{option.label}</span>
                <span className="text-xs text-muted-foreground">({perceptionCounts[option.key] || 0})</span>
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
