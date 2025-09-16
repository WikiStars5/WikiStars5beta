
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, Search, Sparkles, User, ImageOff, CheckCircle } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { callFirebaseFunction } from '@/lib/firebase';
import Image from 'next/image';
import { correctMalformedUrl } from '@/lib/utils';
import type { Figure, AttitudeKey, EmotionKey } from '@/lib/types';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import slugify from 'slugify';

interface WikipediaVerificationResult {
  found: boolean;
  title: string;
  imageUrl: string | null;
}

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

const defaultPerceptionCounts: Record<EmotionKey, number> = {
  alegria: 0, envidia: 0, tristeza: 0, miedo: 0, desagrado: 0, furia: 0,
};

const defaultAttitudeCounts: Record<AttitudeKey, number> = {
  neutral: 0, fan: 0, simp: 0, hater: 0,
};

export function CreateProfileFromWikipedia({ onProfileCreated }: { onProfileCreated: () => void }) {
  const [nameInput, setNameInput] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [verificationResult, setVerificationResult] = useState<WikipediaVerificationResult | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) {
        toast({ title: "Nombre Vacío", description: "Por favor, introduce el nombre de una figura pública.", variant: "destructive" });
        return;
    }
    
    setIsVerifying(true);
    setVerificationResult(null);

    try {
      const result: WikipediaVerificationResult = await callFirebaseFunction('verifyWikipediaCharacter', { name: nameInput.trim() });
      if (result.found) {
        setVerificationResult(result);
      } else {
        toast({ title: "No Encontrado", description: `No se encontró una página de Wikipedia para "${nameInput}". Asegúrate de que el nombre esté bien escrito.`, variant: "destructive" });
      }
    } catch (error: any) {
      console.error("Error verifying on Wikipedia:", error);
      toast({ title: "Error de Verificación", description: error.message || "No se pudo contactar con Wikipedia.", variant: "destructive" });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCreate = async () => {
    if (!verificationResult) return;
    setIsCreating(true);

    const { title, imageUrl } = verificationResult;
    const figureId = slugify(title, { lower: true, strict: true });

    try {
        const figureRef = doc(db, 'figures', figureId);
        const nameKeywords = generateNameKeywords(title);

        const figureData: Partial<Figure> & { createdAt: any } = {
            name: title,
            nameSearch: title.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase(),
            nameKeywords: nameKeywords,
            profileType: 'character',
            photoUrl: imageUrl || `https://placehold.co/400x600.png?text=${encodeURIComponent(title)}`,
            description: '',
            isFeatured: false,
            status: 'approved',
            perceptionCounts: defaultPerceptionCounts,
            attitudeCounts: defaultAttitudeCounts,
            createdAt: serverTimestamp(),
            hashtags: [],
            hashtagsLower: [],
            hashtagKeywords: [],
        };
        
        await setDoc(figureRef, figureData, { merge: true });
        
        toast({
            title: "¡Perfil Creado!",
            description: `Se ha creado un perfil para ${title}.`,
        });

        onProfileCreated();
        router.push(`/figures/${figureId}`);

    } catch (error: any) {
        console.error("Error en la creación del perfil:", error);
        toast({ title: "Error Inesperado", description: "No se pudo crear el perfil. Revisa la consola para más detalles.", variant: "destructive" });
    } finally {
        setIsCreating(false);
    }
  };
  
  const resetForm = () => {
    setNameInput('');
    setVerificationResult(null);
    setIsVerifying(false);
    setIsCreating(false);
  }

  if (verificationResult) {
    return (
        <div className="space-y-4 text-center">
            <h3 className="font-semibold">Confirmar Creación</h3>
            <div className="flex flex-col items-center gap-4 p-4 border rounded-lg bg-muted">
                {verificationResult.imageUrl ? (
                    <Image
                        src={correctMalformedUrl(verificationResult.imageUrl)}
                        alt={verificationResult.title}
                        width={128}
                        height={160}
                        className="rounded-md object-cover aspect-[4/5] bg-background"
                    />
                ) : (
                    <div className="w-32 h-40 bg-background rounded-md flex items-center justify-center">
                        <ImageOff className="h-10 w-10 text-muted-foreground" />
                    </div>
                )}
                <div className='text-center'>
                    <p className="font-bold text-lg">{verificationResult.title}</p>
                    <p className="text-sm text-green-500 flex items-center justify-center gap-1"><CheckCircle className="h-4 w-4" /> Verificado en Wikipedia</p>
                </div>
            </div>
            <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={resetForm} disabled={isCreating}>Cancelar</Button>
                <Button onClick={handleCreate} disabled={isCreating}>
                    {isCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                    Crear Perfil
                </Button>
            </div>
        </div>
    );
  }

  return (
    <form onSubmit={handleVerify} className="space-y-4">
        <div>
            <Label htmlFor="character-name">Nombre del Personaje</Label>
            <Input
                id="character-name"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="Ej: Lionel Messi, Superman..."
                disabled={isVerifying}
            />
        </div>
        <Button type="submit" disabled={isVerifying || nameInput.trim().length === 0} className="w-full">
            {isVerifying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
            {isVerifying ? 'Verificando en Wikipedia...' : 'Verificar y Continuar'}
        </Button>
    </form>
  );
}
