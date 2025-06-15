
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import type { Figure } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { useState, ChangeEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Save, Loader2, UploadCloud, Image as ImageIcon } from "lucide-react";
import { addFigureToFirestore, updateFigureInFirestore } from "@/lib/placeholder-data";
import { storage } from "@/lib/firebase"; 
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import Image from "next/image";
import { Textarea } from "@/components/ui/textarea";

const figureFormSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres."),
  photoUrl: z.string().url("Debe ser una URL válida.").optional().or(z.literal('')),
  description: z.string().optional(),
  nationality: z.string().optional(),
  occupation: z.string().optional(),
  gender: z.string().optional(),
});

type FigureFormValues = z.infer<typeof figureFormSchema>;

interface FigureFormProps {
  initialData?: Figure | null;
}

export function FigureForm({ initialData }: FigureFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrlFromFile, setPreviewUrlFromFile] = useState<string | null>(null);

  console.log("FigureForm Render - initialData prop:", initialData);
  console.log("FigureForm Render - initialData.photoUrl prop:", initialData?.photoUrl);

  const form = useForm<FigureFormValues>({
    resolver: zodResolver(figureFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      photoUrl: initialData?.photoUrl || "",
      description: initialData?.description || "",
      nationality: initialData?.nationality || "",
      occupation: initialData?.occupation || "",
      gender: initialData?.gender || "",
    },
  });

  console.log("FigureForm Render - useForm defaultValues:", {
    name: initialData?.name || "",
    photoUrl: initialData?.photoUrl || "",
    description: initialData?.description || "",
    nationality: initialData?.nationality || "",
    occupation: initialData?.occupation || "",
    gender: initialData?.gender || "",
  });

  useEffect(() => {
    console.log("FigureForm useEffect [initialData, form.reset] - Executed.");
    console.log("FigureForm useEffect - initialData at start of effect:", initialData);
    console.log("FigureForm useEffect - initialData.photoUrl at start of effect:", initialData?.photoUrl);

    if (initialData) {
      const resetValues = {
        name: initialData.name || "",
        photoUrl: initialData.photoUrl || "",
        description: initialData.description || "",
        nationality: initialData.nationality || "",
        occupation: initialData.occupation || "",
        gender: initialData.gender || "",
      };
      console.log("FigureForm useEffect - Calling form.reset with:", resetValues);
      form.reset(resetValues);
      setSelectedFile(null); 
      setPreviewUrlFromFile(null); 
    } else {
      const resetValues = {
        name: "",
        photoUrl: "",
        description: "",
        nationality: "",
        occupation: "",
        gender: "",
      };
      console.log("FigureForm useEffect - Calling form.reset for new form with:", resetValues);
      form.reset(resetValues);
      setSelectedFile(null);
      setPreviewUrlFromFile(null);
    }
  }, [initialData, form.reset]); 

  const watchedPhotoUrlInput = form.watch('photoUrl');

  console.log("FigureForm Render - form.watch('photoUrl'):", watchedPhotoUrlInput);

  useEffect(() => {
    console.log("FigureForm useEffect [watchedPhotoUrlInput] - Form state photoUrl actual:", watchedPhotoUrlInput);
  }, [watchedPhotoUrlInput]);


  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrlFromFile(reader.result as string);
      };
      reader.readAsDataURL(file);
      form.setValue('photoUrl', ''); 
    } else {
      setSelectedFile(null);
      setPreviewUrlFromFile(null);
    }
  };

  async function onSubmit(values: FigureFormValues) {
    setIsLoading(true);
    let finalPhotoUrl = initialData?.photoUrl || ""; 

    if (selectedFile) {
      try {
        const filePath = `figures/${Date.now()}_${selectedFile.name}`;
        const storageRef = ref(storage, filePath);
        await uploadBytes(storageRef, selectedFile);
        finalPhotoUrl = await getDownloadURL(storageRef);
        toast({ title: "Imagen Subida", description: "Tu imagen ha sido guardada en Firebase Storage." });
      } catch (error) {
        console.error("Error uploading image: ", error);
        toast({
          title: "Error al Subir Imagen",
          description: "No se pudo subir la imagen. Por favor, inténtalo de nuevo.",
          variant: "destructive",
        });
        setIsLoading(false);
        return; 
      }
    } else if (values.photoUrl !== undefined && values.photoUrl !== (initialData?.photoUrl || "")) {
      finalPhotoUrl = values.photoUrl;
    } else if (!values.photoUrl && !selectedFile && !initialData?.id) {
      finalPhotoUrl = `https://placehold.co/300x400.png?text=${encodeURIComponent(values.name.substring(0,2))}`;
    }
    
    const figureId = initialData?.id || `figure-${Date.now()}-${Math.random().toString(36).substring(2,7)}`;
    
    const figureData: Figure = {
      id: figureId,
      name: values.name,
      nameLower: values.name.toLowerCase(),
      photoUrl: finalPhotoUrl,
      description: values.description || initialData?.description || "",
      nationality: values.nationality || initialData?.nationality || "",
      occupation: values.occupation || initialData?.occupation || "",
      gender: values.gender || initialData?.gender || "",
    };

    try {
      if (initialData?.id) { 
        await updateFigureInFirestore(figureData); 
      } else {
        await addFigureToFirestore(figureData); 
      }
      
      toast({
        title: initialData?.id ? "¡Figura Actualizada!" : "¡Figura Creada!",
        description: `El perfil de ${figureData.name} ha sido guardado en Firestore.`,
      });

      router.push(`/admin/figures`);
      router.refresh(); 
    } catch (error) {
      console.error("Error saving figure to Firestore: ", error);
      toast({
        title: "Error al Guardar",
        description: `No se pudo guardar el perfil de ${figureData.name} en Firestore. Por favor, revisa la consola para ver errores.`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }
  
  const currentPhotoForPreview = previewUrlFromFile || watchedPhotoUrlInput || (selectedFile ? null : initialData?.photoUrl);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre de la Figura</FormLabel>
              <FormControl>
                <Input placeholder="ej., Ada Lovelace" {...field} disabled={isLoading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="photoUrl"
          render={({ field }) => ( 
            <FormItem>
              <FormLabel>URL de la Imagen (Opcional)</FormLabel>
              <FormControl>
                <Input 
                  type="url" 
                  placeholder="https://ejemplo.com/imagen.jpg" 
                  {...field} 
                  disabled={isLoading || !!selectedFile} 
                  onChange={(e) => {
                    field.onChange(e); 
                    if (selectedFile) { 
                        setSelectedFile(null);
                        setPreviewUrlFromFile(null);
                    }
                  }}
                />
              </FormControl>
              <FormDescription>
                Pega la URL de una imagen externa. Si también seleccionas un archivo, se priorizará el archivo subido. Si se deja vacío en la creación y no se sube archivo, se usará una imagen por defecto.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormItem>
          <FormLabel>Subir Foto (Opcional)</FormLabel>
          <FormControl>
            <Input 
              type="file" 
              accept="image/*" 
              onChange={handleFileChange} 
              disabled={isLoading} 
              className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
            />
          </FormControl>
          <FormDescription>
            Sube una imagen para la figura. Esto tendrá prioridad sobre la URL de la imagen.
          </FormDescription>
          {currentPhotoForPreview ? (
            <div className="mt-4 w-32 h-40 relative rounded-md overflow-hidden border">
              <Image src={currentPhotoForPreview} alt="Vista Previa" layout="fill" objectFit="cover" data-ai-hint="figure preview" />
            </div>
          ) : (
             <div className="mt-4 w-32 h-40 flex items-center justify-center bg-muted rounded-md border">
                <ImageIcon className="w-10 h-10 text-muted-foreground" data-ai-hint="placeholder icon" />
             </div>
          )}
          <FormMessage />
        </FormItem>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción</FormLabel>
              <FormControl>
                <Textarea placeholder="Breve descripción de la figura pública..." {...field} disabled={isLoading} rows={4} />
              </FormControl>
              <FormDescription>Proporciona un resumen o biografía corta.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="nationality"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nacionalidad (Opcional)</FormLabel>
              <FormControl>
                <Input placeholder="ej., Española" {...field} disabled={isLoading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="occupation"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ocupación (Opcional)</FormLabel>
              <FormControl>
                <Input placeholder="ej., Futbolista, Científica" {...field} disabled={isLoading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="gender"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Género (Opcional)</FormLabel>
              <FormControl>
                <Input placeholder="ej., Masculino, Femenino, No binario" {...field} disabled={isLoading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit" className="w-full sm:w-auto" disabled={isLoading}>
         {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
         {isLoading ? (initialData?.id ? "Actualizando..." : "Creando...") : (initialData?.id ? "Guardar Cambios" : "Crear Figura")}
        </Button>
      </form>
    </Form>
  );
}
