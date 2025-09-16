
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, Globe, Link as LinkIcon, Sparkles } from 'lucide-react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Figure, AttitudeKey, EmotionKey } from '@/lib/types';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';

const defaultPerceptionCounts: Record<EmotionKey, number> = {
  alegria: 0, envidia: 0, tristeza: 0, miedo: 0, desagrado: 0, furia: 0,
};

const defaultAttitudeCounts: Record<AttitudeKey, number> = {
  neutral: 0, fan: 0, simp: 0, hater: 0,
};

const getRootDomain = (input: string): string | null => {
    try {
        let urlString = input.trim();
        if (!urlString.startsWith('http')) {
            urlString = `https://${urlString}`;
        }
        const url = new URL(urlString);
        const domainParts = url.hostname.split('.').slice(-3);
        if (domainParts.length === 3 && domainParts[1].length <= 3 && domainParts[0] !== 'www') {
             return domainParts.join('.');
        }
        return url.hostname.split('.').slice(-2).join('.');
    } catch (error) {
        return null; // Invalid URL
    }
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

// New, more robust validation function
async function validateDomain(domain: string): Promise<boolean> {
  // 1. Primary Method: Direct HEAD request (lightweight)
  try {
    const response = await fetch(`https://${domain}`, { method: 'HEAD', mode: 'no-cors' });
    // 'no-cors' returns an opaque response, but if it doesn't throw an error,
    // it means a network connection was likely possible.
    return true;
  } catch (e) {
    // This might fail due to CORS even if the site is up. So we try the fallback.
    console.warn(`Direct HEAD request to ${domain} failed, trying fallback. Error:`, e);
  }

  // 2. Fallback Method: Google Favicon service
  try {
    const faviconTestUrl = `https://www.google.com/s2/favicons?sz=16&domain_url=${domain}`;
    const response = await fetch(faviconTestUrl);
    // Check if the response is OK and has content. Some domains might not have a favicon but are valid.
    // A 0-length response often means the domain is invalid.
    return response.ok && Number(response.headers.get('content-length')) > 0;
  } catch (error) {
    console.error(`Favicon fallback for ${domain} also failed. Error:`, error);
    return false;
  }
}


export function CreateWebsiteProfile() {
  const [domainInput, setDomainInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [validatedDomain, setValidatedDomain] = useState<string | null>(null);
  const [faviconUrl, setFaviconUrl] = useState<string | null>(null);
  
  const { toast } = useToast();
  const router = useRouter();

  const handleValidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!domainInput.trim()) {
        toast({ title: "Entrada Vacía", description: "Por favor, introduce un dominio web.", variant: "destructive" });
        return;
    }
    
    setIsProcessing(true);
    const rootDomain = getRootDomain(domainInput);

    if (!rootDomain) {
      toast({ title: "Dominio no válido", description: "Por favor, introduce un formato de dominio válido (ej. google.com).", variant: "destructive" });
      setIsProcessing(false);
      return;
    }

    // Check if profile already exists
    const figureId = rootDomain.replace(/\./g, '-');
    const figureRef = doc(db, 'figures', figureId);
    const docSnap = await getDoc(figureRef);

    if (docSnap.exists()) {
      toast({ title: "Perfil Existente", description: `El perfil para "${rootDomain}" ya existe.` });
      router.push(`/figures/${figureId}`);
      setIsProcessing(false);
      return;
    }

    // Use the new validation logic
    const isDomainValid = await validateDomain(rootDomain);

    if (isDomainValid) {
        const finalFaviconUrl = `https://www.google.com/s2/favicons?sz=64&domain_url=${rootDomain}`;
        setValidatedDomain(rootDomain);
        setFaviconUrl(finalFaviconUrl);
        setShowConfirmation(true);
    } else {
        toast({ title: "Error de Validación", description: `No se pudo validar el dominio "${rootDomain}". Asegúrate de que sea un sitio web activo y accesible.`, variant: "destructive" });
    }
    
    setIsProcessing(false);
  };

  const handleCreate = async () => {
    if (!validatedDomain || !faviconUrl) return;

    setIsProcessing(true);

    try {
      const figureId = validatedDomain.replace(/\./g, '-');
      const figureRef = doc(db, 'figures', figureId);
      
      const attitudeCounts = { ...defaultAttitudeCounts };
      delete (attitudeCounts as Partial<typeof attitudeCounts>).simp;
      
      const figureData: Partial<Figure> & { createdAt: any } = {
        name: validatedDomain,
        nameSearch: validatedDomain.toLowerCase(),
        nameKeywords: generateNameKeywords(validatedDomain),
        profileType: 'media',
        mediaSubcategory: 'website',
        photoUrl: faviconUrl,
        websiteUrl: `https://${validatedDomain}`,
        description: `Perfil para el sitio web ${validatedDomain}.`,
        isFeatured: false,
        status: 'approved',
        perceptionCounts: defaultPerceptionCounts,
        attitudeCounts: attitudeCounts,
        createdAt: serverTimestamp(),
        hashtags: ['website'],
        hashtagsLower: ['website'],
        hashtagKeywords: generateNameKeywords('website'),
      };
      
      await setDoc(figureRef, figureData);
      
      toast({
        title: "¡Perfil Creado!",
        description: `Se ha creado un perfil para ${validatedDomain}.`,
      });

      setShowConfirmation(false);
      setDomainInput('');
      router.push(`/figures/${figureId}`);

    } catch (error: any) {
      console.error("Error en la creación del perfil web:", error);
      toast({ title: "Error Inesperado", description: "No se pudo crear el perfil. Revisa la consola para más detalles.", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleValidate} className="flex flex-col sm:flex-row gap-2">
          <Label htmlFor="domain-input" className="sr-only">Dominio del sitio web</Label>
          <Input
              id="domain-input"
              value={domainInput}
              onChange={(e) => setDomainInput(e.target.value)}
              placeholder="ejemplo.com"
              disabled={isProcessing}
              className="flex-grow"
          />
          <Button type="submit" disabled={isProcessing || domainInput.trim().length === 0}>
              {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              {isProcessing ? 'Validando...' : 'Crear Perfil'}
          </Button>
      </form>

      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
          <AlertDialogContent>
              <AlertDialogHeader>
              <AlertDialogTitle>¿Confirmar creación?</AlertDialogTitle>
              <AlertDialogDescription>
                  Se creará un nuevo perfil para el dominio <strong>{validatedDomain}</strong>. Este será su nombre y su imagen de perfil.
              </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="flex justify-center my-4">
                  {faviconUrl && <img src={faviconUrl} alt={`Favicon de ${validatedDomain}`} className="w-16 h-16 rounded-md border" />}
              </div>
              <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setValidatedDomain(null)} disabled={isProcessing}>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleCreate} disabled={isProcessing}>
                  {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {isProcessing ? 'Creando...' : 'Sí, Crear'}
              </AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
