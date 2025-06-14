
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import type { Figure } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { useState, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { Save, Loader2, UploadCloud, Image as ImageIcon } from "lucide-react";
import { addFigureToFirestore, updateFigureInFirestore } from "@/lib/placeholder-data";
import { storage } from "@/lib/firebase"; 
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import Image from "next/image";

const figureFormSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres."),
  description: z.string().min(5, "La descripción debe tener al menos 5 caracteres.").optional().or(z.literal('')),
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
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialData?.photoUrl || null);

  const form = useForm<FigureFormValues>({
    resolver: zodResolver(figureFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
    },
  });

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setSelectedFile(null);
      setPreviewUrl(initialData?.photoUrl || null);
    }
  };

  async function onSubmit(values: FigureFormValues) {
    setIsLoading(true);
    let photoUrlToSave = initialData?.photoUrl || `https://placehold.co/300x400.png?text=${encodeURIComponent(values.name.substring(0,2))}`;

    if (selectedFile) {
      try {
        const filePath = `figures/${Date.now()}_${selectedFile.name}`;
        const storageRef = ref(storage, filePath);
        await uploadBytes(storageRef, selectedFile);
        photoUrlToSave = await getDownloadURL(storageRef);
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
    }
    
    const figureId = initialData?.id || `figure-${Date.now()}-${Math.random().toString(36).substring(2,7)}`;
    
    const figureData: Figure = {
      id: figureId,
      name: values.name,
      nameLower: values.name.toLowerCase(), // Add lowercase name
      photoUrl: photoUrlToSave,
      description: values.description || "",
      // averageRating, totalRatings, and perceptionCounts are removed to align with Figure type
    };

    try {
      if (initialData) {
        // Ensure nameLower is also updated for existing figures
        const dataToUpdate: Partial<Figure> = { 
            ...values, 
            nameLower: values.name.toLowerCase(), 
            photoUrl: photoUrlToSave 
        };
        // Remove fields that are not part of Figure type if they exist in values from form.
        // Or ensure figureData passed to updateFigureInFirestore is strictly of type Figure.
        // The current `figureData` object created above is already correct for the Figure type.
        await updateFigureInFirestore({ ...initialData, ...figureData }); 
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
        
        <FormItem>
          <FormLabel>Foto</FormLabel>
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
            Sube una imagen para la figura. Si no se sube ninguna imagen, se usará un marcador de posición para nuevas figuras o se mantendrá la existente para las ediciones.
          </FormDescription>
          {previewUrl && (
            <div className="mt-4 w-32 h-40 relative rounded-md overflow-hidden border">
              <Image src={previewUrl} alt="Vista Previa" layout="fill" objectFit="cover" />
            </div>
          )}
          {!previewUrl && (
             <div className="mt-4 w-32 h-40 flex items-center justify-center bg-muted rounded-md border">
                <ImageIcon className="w-10 h-10 text-muted-foreground" />
             </div>
          )}
          <FormMessage />
        </FormItem>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción / Categoría</FormLabel>
              <FormControl>
                <Textarea placeholder="ej., Matemática y Escritora" {...field} disabled={isLoading} rows={3} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit" className="w-full sm:w-auto" disabled={isLoading}>
         {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
         {isLoading ? (initialData ? "Actualizando..." : "Creando...") : (initialData ? "Guardar Cambios" : "Crear Figura")}
        </Button>
      </form>
    </Form>
  );
}
