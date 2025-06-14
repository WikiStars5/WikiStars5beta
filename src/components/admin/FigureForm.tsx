
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

const figureFormSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres."),
  photoUrl: z.string().url("Debe ser una URL válida.").optional().or(z.literal('')),
  // Description is intentionally omitted from the form schema as per previous request
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

  const form = useForm<FigureFormValues>({
    resolver: zodResolver(figureFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      photoUrl: initialData?.photoUrl || "",
    },
  });

  // Effect to reset form when initialData changes
  useEffect(() => {
    console.log("FigureForm - initialData en useEffect:", initialData); // DEBUG as requested
    console.log("FigureForm - initialData.photoUrl en useEffect:", initialData?.photoUrl); // DEBUG as requested
    
    if (initialData) {
      form.reset({
        name: initialData.name || "",
        photoUrl: initialData.photoUrl || "",
      });
      // Reset local file state if initialData is provided (editing existing)
      setSelectedFile(null);
      setPreviewUrlFromFile(null);
    } else {
      // Reset for new form
      form.reset({
        name: "",
        photoUrl: "",
      });
      setSelectedFile(null);
      setPreviewUrlFromFile(null);
    }
  }, [initialData, form.reset]);

  const watchedPhotoUrlInput = form.watch('photoUrl');

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrlFromFile(reader.result as string);
      };
      reader.readAsDataURL(file);
      form.setValue('photoUrl', ''); // Clear external URL if a file is chosen
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
      // Use the URL from the input field if it has changed or was explicitly set
      finalPhotoUrl = values.photoUrl;
    } else if (!initialData && !values.photoUrl && !selectedFile) {
      // Creating new figure, no file, no URL -> use placeholder
      finalPhotoUrl = `https://placehold.co/300x400.png?text=${encodeURIComponent(values.name.substring(0,2))}`;
    }
    // If editing and no new file and values.photoUrl is same as initialData.photoUrl, finalPhotoUrl remains initialData.photoUrl (already set)
    
    const figureId = initialData?.id || `figure-${Date.now()}-${Math.random().toString(36).substring(2,7)}`;
    
    const figureData: Figure = {
      id: figureId,
      name: values.name,
      nameLower: values.name.toLowerCase(),
      photoUrl: finalPhotoUrl,
      description: initialData?.description || "", // Preserve existing description or set empty for new
    };

    try {
      if (initialData) {
        await updateFigureInFirestore(figureData); 
      } else {
        await addFigureToFirestore(figureData); 
      }
      
      toast({
        title: initialData ? "¡Figura Actualizada!" : "¡Figura Creada!",
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
                Pega la URL de una imagen externa. Si también seleccionas un archivo, se priorizará el archivo subido. Si se deja vacío en la creación, se usará una imagen por defecto.
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
          <FormMessage /> {/* Added missing FormMessage for file input, though schema doesn't cover file input directly */}
        </FormItem>
        
        <Button type="submit" className="w-full sm:w-auto" disabled={isLoading}>
         {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
         {isLoading ? (initialData ? "Actualizando..." : "Creando...") : (initialData ? "Guardar Cambios" : "Crear Figura")}
        </Button>
      </form>
    </Form>
  );
}
