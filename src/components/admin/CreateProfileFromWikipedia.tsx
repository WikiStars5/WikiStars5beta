
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, Search, Sparkles, User, ImageOff, CheckCircle, Link as LinkIcon, AlertTriangle } from 'lucide-react';
import { verifyWikipediaCharacter } from '@/ai/flows/verifyWikipediaCharacter';
import { verifyFamousBirthdaysCharacter } from '@/ai/flows/verifyFamousBirthdaysCharacter';
import Image from 'next/image';
import { correctMalformedUrl } from '@/lib/utils';
import type { Figure, AttitudeKey, EmotionKey, CreationMethod, ProfileType } from '@/lib/types';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import slugify from 'slugify';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';

interface VerificationResult {
  found: boolean;
  title: string;
  imageUrl: string | null;
  method: CreationMethod;
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

function FamousBirthdaysForm({ name, onVerified }: { name: string, onVerified: (result: VerificationResult) => void }) {
    const [url, setUrl] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!url.trim()) {
            toast({ title: "URL Vacía", description: "Por favor, introduce la URL del perfil.", variant: "destructive" });
            return;
        }
        setIsVerifying(true);
        try {
            const result = await verifyFamousBirthdaysCharacter({ name, url });
            if (result.found) {
                onVerified({ ...result, method: 'famous_birthdays' });
            } else {
                toast({ title: "Verificación Fallida", description: `No se pudo verificar el nombre "${name}" en la URL proporcionada. Asegúrate de que el enlace y el nombre son correctos.`, variant: "destructive" });
            }
        } catch (error: any) {
            toast({ title: "Error de Verificación", description: error.message, variant: "destructive" });
        } finally {
            setIsVerifying(false);
        }
    };
    
    return (
        <form onSubmit={handleSubmit} className="space-y-3 pt-4">
            <Label htmlFor="fb-url">URL de FamousBirthdays.com</Label>
            <Input 
                id="fb-url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://es.famousbirthdays.com/people/..."
                disabled={isVerifying}
            />
            <Button type="submit" className="w-full" disabled={isVerifying || !url.trim()}>
                {isVerifying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                Verificar con URL
            </Button>
        </form>
    );
}

export function CreateProfileFromWikipedia({ onProfileCreated }: { onProfileCreated: () => void }) {
  const [nameInput, setNameInput] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [profileType, setProfileType] = useState<ProfileType>('character');
  const [showPlanB, setShowPlanB] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleVerifyWikipedia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) {
        toast({ title: "Nombre Vacío", description: "Por favor, introduce el nombre de una figura pública.", variant: "destructive" });
        return;
    }
    
    setIsVerifying(true);
    setVerificationResult(null);
    setShowPlanB(false);

    try {
      const result = await verifyWikipediaCharacter({ name: nameInput.trim() });
      if (result.found) {
        setVerificationResult({ ...result, method: 'wikipedia' });
      } else {
        toast({ title: "No Encontrado en Wikipedia", description: `Se activó el Plan B para "${nameInput}".`, variant: "default" });
        setShowPlanB(true);
      }
    } catch (error: any) {
      console.error("Error verifying on Wikipedia:", error);
      toast({ title: "Error de Verificación", description: error.message || "No se pudo contactar con Wikipedia.", variant: "destructive" });
      setShowPlanB(true); // Show Plan B on error too
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCreate = async () => {
    if (!verificationResult) return;
    setIsCreating(true);

    const { title, imageUrl, method } = verificationResult;
    const figureId = slugify(title, { lower: true, strict: true });

    try {
        const figureRef = doc(db, 'figures', figureId);
        
        // Check if figure already exists
        const docSnap = await getDoc(figureRef);
        if (docSnap.exists()) {
            toast({
                title: "Perfil Existente",
                description: `El perfil para "${title}" ya existe. Redirigiendo...`,
                variant: "destructive",
            });
            router.push(`/figures/${figureId}`);
            setIsCreating(false);
            return;
        }

        const nameKeywords = generateNameKeywords(title);
        
        const attitudeCounts = { ...defaultAttitudeCounts };
        if(profileType === 'media') {
          delete (attitudeCounts as Partial<typeof attitudeCounts>).simp;
        }

        const figureData: Partial<Figure> & { createdAt: any } = {
            name: title,
            nameSearch: title.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase(),
            nameKeywords: nameKeywords,
            profileType: profileType,
            photoUrl: imageUrl || `https://placehold.co/400x600.png?text=${encodeURIComponent(title)}`,
            description: '',
            isFeatured: false,
            status: 'approved',
            perceptionCounts: defaultPerceptionCounts,
            attitudeCounts: attitudeCounts,
            createdAt: serverTimestamp(),
            hashtags: [],
            hashtagsLower: [],
            hashtagKeywords: [],
            creationMethod: method,
            isCommunityVerified: false, // All new profiles start as not community verified
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
    setShowPlanB(false);
    setProfileType('character');
  }

  if (verificationResult) {
    const sourceText = verificationResult.method === 'wikipedia' ? 'Verificado en Wikipedia' : 'Verificado en FamousBirthdays';
    const SourceIcon = verificationResult.method === 'wikipedia' ? CheckCircle : LinkIcon;

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
                    <p className="text-sm text-green-500 flex items-center justify-center gap-1"><SourceIcon className="h-4 w-4" /> {sourceText}</p>
                </div>
            </div>
            <div className="space-y-3 pt-4 border-t">
              <Label className="font-semibold">¿Qué tipo de perfil es?</Label>
              <RadioGroup
                value={profileType}
                onValueChange={(value) => setProfileType(value as ProfileType)}
                className="flex justify-center gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="character" id="type-character-confirm" />
                  <Label htmlFor="type-character-confirm">Personaje</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="media" id="type-media-confirm" />
                  <Label htmlFor="type-media-confirm">Medio</Label>
                </div>
              </RadioGroup>
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t">
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
    <div className="space-y-4">
      <form onSubmit={handleVerifyWikipedia} className="space-y-3">
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
              {isVerifying ? 'Verificando...' : 'Verificar en Wikipedia'}
          </Button>
      </form>
      {showPlanB && (
        <div className="border-t pt-4">
            <Alert variant="destructive" className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Plan B: Verificación Manual</AlertTitle>
                <AlertDescription>
                    No se encontró en Wikipedia. Pega el enlace de su perfil en <strong>es.famousbirthdays.com</strong> para verificarlo manualmente.
                </AlertDescription>
            </Alert>
            <FamousBirthdaysForm 
                name={nameInput} 
                onVerified={(result) => setVerificationResult(result)}
            />
        </div>
      )}
    </div>
  );
}
