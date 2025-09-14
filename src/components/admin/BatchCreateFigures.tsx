

"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, Sparkles, Film, User } from 'lucide-react';
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
import type { Figure, AttitudeKey, EmotionKey, ProfileType, MediaSubcategory } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

const MEDIA_SUBCATEGORIES: { value: MediaSubcategory, label: string }[] = [
    { value: 'video_game', label: 'Videojuego' },
    { value: 'movie', label: 'Película' },
    { value: 'series', label: 'Serie' },
    { value: 'anime', label: 'Anime' },
    { value: 'manga_comic', label: 'Manga/Cómic' },
    { value: 'book', label: 'Libro/Novela' },
    { value: 'board_game', label: 'Juegos de mesa' },
    { value: 'animal', label: 'Animales' },
    { value: 'company', label: 'Empresa' },
    { value: 'website', label: 'Página Web' },
    { value: 'social_media_platform', label: 'Red Social' },
];


const defaultPerceptionCounts: Record<EmotionKey, number> = {
  alegria: 0, inspiracion: 0, admiracion: 0, diversion: 0, tristeza: 0, decepcion: 0, miedo: 0, desagrado: 0,
};

const defaultAttitudeCounts: Record<AttitudeKey, number> = {
  neutral: 0, fan: 0, simp: 0, hater: 0,
};

const generateNameKeywords = (name: string): string[] => {
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


interface BatchCreateFiguresProps {
  profileType: ProfileType;
}

export function BatchCreateFigures({ profileType }: BatchCreateFiguresProps) {
  const [names, setNames] = useState('');
  const [mediaSubcategory, setMediaSubcategory] = useState<MediaSubcategory | undefined>();
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleCreate = async () => {
    if (profileType === 'media' && !mediaSubcategory) {
      toast({
        title: "Subcategoría Requerida",
        description: "Por favor, selecciona una subcategoría para los perfiles de medios.",
        variant: "destructive",
      });
      return;
    }
      
    setIsProcessing(true);
    const namesList = names.split('\n').map(name => name.trim()).filter(name => name.length > 0);

    if (namesList.length === 0) {
      toast({
        title: "No hay nombres",
        description: "Por favor, introduce al menos un nombre en el área de texto.",
        variant: "destructive",
      });
      setIsProcessing(false);
      return;
    }

    try {
      const batch = writeBatch(db);
      const figuresCollectionRef = collection(db, 'figures');
      let createdCount = 0;

      namesList.forEach(name => {
        const figureId = slugify(name, { lower: true, strict: true });
        if (figureId) {
          const nameTrimmed = name.trim();
          const nameSearch = nameTrimmed.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
          const nameKeywords = generateNameKeywords(nameTrimmed);
          const figureRef = doc(figuresCollectionRef, figureId);
          const attitudeCounts = { ...defaultAttitudeCounts };
          if (profileType === 'media') {
            delete (attitudeCounts as Partial<typeof attitudeCounts>).simp;
          }

          const figureData: Partial<Figure> & { createdAt: any } = {
            name: nameTrimmed,
            nameSearch: nameSearch,
            nameKeywords: nameKeywords,
            profileType: profileType,
            photoUrl: `https://placehold.co/400x600.png?text=${encodeURIComponent(name)}`,
            description: '',
            isFeatured: false,
            status: 'approved',
            perceptionCounts: defaultPerceptionCounts,
            attitudeCounts: attitudeCounts,
            createdAt: serverTimestamp(),
            hashtags: [],
            hashtagsLower: [],
            hashtagKeywords: [],
          };
          
          if (profileType === 'media') {
            figureData.mediaSubcategory = mediaSubcategory;
          }

          batch.set(figureRef, figureData);
          createdCount++;
        }
      });

      await batch.commit();

      toast({
        title: "¡Creación Masiva Completa!",
        description: `Se han creado ${createdCount} nuevos perfiles de ${profileType === 'character' ? 'personajes' : 'medios'}.`,
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
      setIsProcessing(false);
    }
  };
  
  const cardInfo = {
    character: {
      title: "Creación Masiva de Personajes",
      description: "Pega una lista de nombres (uno por línea) para crear perfiles de personajes (humanos, ficticios, etc.).",
      icon: User
    },
    media: {
      title: "Creación Masiva de Medios",
      description: "Elige una subcategoría y pega una lista de títulos (uno por línea) para crear perfiles de medios.",
      icon: Film
    }
  }

  const { title, description, icon: Icon } = cardInfo[profileType];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-headline flex items-center gap-2">
            <Icon className="h-5 w-5" />
            {title}
        </CardTitle>
        <CardDescription>
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {profileType === 'media' && (
          <div>
            <Label htmlFor="media-subcategory-batch">Subcategoría *</Label>
            <Select onValueChange={(v) => setMediaSubcategory(v as MediaSubcategory)} value={mediaSubcategory}>
              <SelectTrigger id="media-subcategory-batch">
                <SelectValue placeholder="Selecciona una subcategoría..." />
              </SelectTrigger>
              <SelectContent>
                {MEDIA_SUBCATEGORIES.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <div>
          <Label htmlFor={`batch-names-${profileType}`} className="sr-only">Nombres de los perfiles</Label>
          <Textarea
            id={`batch-names-${profileType}`}
            value={names}
            onChange={(e) => setNames(e.target.value)}
            placeholder="Lionel Messi\nCristiano Ronaldo\nRihanna\n..."
            rows={6}
            disabled={isProcessing}
          />
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button disabled={isProcessing || names.trim().length === 0 || (profileType === 'media' && !mediaSubcategory)}>
              {isProcessing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              {isProcessing ? 'Procesando...' : 'Crear Perfiles'}
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
              <AlertDialogCancel disabled={isProcessing}>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleCreate} disabled={isProcessing}>
                {isProcessing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {isProcessing ? 'Procesando...' : 'Sí, Crear Perfiles'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
