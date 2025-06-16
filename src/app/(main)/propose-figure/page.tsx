
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Send, Lightbulb } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { proposeNewFigure } from '@/app/actions/proposeFigureAction'; // New action

const proposeFigureSchema = z.object({
  name: z.string().min(3, { message: "El nombre debe tener al menos 3 caracteres." }).max(100),
  description: z.string().optional(),
  proposedWikiLink: z.string().url({ message: "Por favor, introduce una URL válida." })
    .refine(link => {
        try {
            const url = new URL(link);
            return url.hostname.endsWith('wikipedia.org') || url.hostname.endsWith('fandom.com');
        } catch {
            return false;
        }
    }, "El enlace debe ser de wikipedia.org o fandom.com."),
  nationality: z.string().optional(),
  occupation: z.string().optional(),
  gender: z.string().optional(),
});

type ProposeFigureFormValues = z.infer<typeof proposeFigureSchema>;

export default function ProposeFigurePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<ProposeFigureFormValues>({
    resolver: zodResolver(proposeFigureSchema),
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
      if (!user || user.isAnonymous) {
        toast({ title: "Acceso Requerido", description: "Debes iniciar sesión con una cuenta para proponer una figura.", variant: "destructive" });
        router.replace('/login?redirect=/propose-figure');
      }
    });
    return () => unsubscribe();
  }, [router, toast]);

  const onSubmit: SubmitHandler<ProposeFigureFormValues> = async (data) => {
    if (!currentUser || currentUser.isAnonymous) {
      toast({ title: "Error", description: "Debes estar autenticado para enviar una propuesta.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await proposeNewFigure(data, currentUser.uid);
      if (result.success) {
        toast({
          title: "Propuesta Enviada",
          description: "Tu propuesta para la figura ha sido enviada para revisión. ¡Gracias!",
        });
        reset(); // Clear the form
        // Optionally redirect or show a success message on page
      } else {
        toast({
          title: "Error en la Propuesta",
          description: result.message || "No se pudo enviar tu propuesta.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error Inesperado",
        description: error.message || "Ocurrió un error al procesar tu propuesta.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Verificando autenticación...</p>
      </div>
    );
  }

  if (!currentUser || currentUser.isAnonymous) {
    // This case is mostly handled by the redirect, but as a fallback.
    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
            <p className="text-muted-foreground">Redirigiendo a inicio de sesión...</p>
        </div>
    );
  }

  return (
    <div className="container py-8">
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">Proponer Nueva Figura Pública</CardTitle>
          <CardDescription>
            Ayúdanos a expandir WikiStars5. Llena los detalles de la figura pública que quieres proponer.
            Un administrador revisará tu propuesta.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <Alert>
              <Lightbulb className="h-4 w-4" />
              <AlertTitle>¡Importante!</AlertTitle>
              <AlertDescription>
                El <strong>Enlace a Wikipedia/Fandom</strong> es obligatorio y debe ser un artículo válido sobre la figura.
                Esto ayuda a verificar la relevancia y existencia de la figura pública.
                No podrás proponer una imagen inicialmente; un administrador la añadirá si la propuesta es aprobada.
              </AlertDescription>
            </Alert>

            <div>
              <Label htmlFor="name">Nombre de la Figura</Label>
              <Input id="name" {...register("name")} placeholder="Ej: Marie Curie" disabled={isSubmitting} />
              {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <Label htmlFor="proposedWikiLink">Enlace a Wikipedia o Fandom (Obligatorio)</Label>
              <Input id="proposedWikiLink" type="url" {...register("proposedWikiLink")} placeholder="Ej: https://es.wikipedia.org/wiki/Marie_Curie" disabled={isSubmitting} />
              {errors.proposedWikiLink && <p className="text-sm text-destructive mt-1">{errors.proposedWikiLink.message}</p>}
            </div>

            <div>
              <Label htmlFor="description">Descripción Breve</Label>
              <Textarea id="description" {...register("description")} placeholder="¿Quién es o qué hizo esta figura?" rows={3} disabled={isSubmitting} />
              {errors.description && <p className="text-sm text-destructive mt-1">{errors.description.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nationality">Nacionalidad</Label>
                <Input id="nationality" {...register("nationality")} placeholder="Ej: Polaca, Francesa" disabled={isSubmitting} />
                {errors.nationality && <p className="text-sm text-destructive mt-1">{errors.nationality.message}</p>}
              </div>
              <div>
                <Label htmlFor="occupation">Ocupación Principal</Label>
                <Input id="occupation" {...register("occupation")} placeholder="Ej: Científica, Física, Química" disabled={isSubmitting} />
                {errors.occupation && <p className="text-sm text-destructive mt-1">{errors.occupation.message}</p>}
              </div>
            </div>
            <div>
              <Label htmlFor="gender">Género</Label>
              <Input id="gender" {...register("gender")} placeholder="Ej: Femenino" disabled={isSubmitting} />
              {errors.gender && <p className="text-sm text-destructive mt-1">{errors.gender.message}</p>}
            </div>

          </CardContent>
          <CardFooter className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              {isSubmitting ? 'Enviando Propuesta...' : 'Enviar Propuesta'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
