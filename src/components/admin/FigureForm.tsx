
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
import { addFigureToFirestore, updateFigureInFirestore } from "@/lib/placeholder-data"; // Updated data ops
import { storage } from "@/lib/firebase"; 
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import Image from "next/image";

const figureFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  description: z.string().min(5, "Description must be at least 5 characters.").optional().or(z.literal('')),
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
        toast({ title: "Image Uploaded", description: "Your image has been saved to Firebase Storage." });
      } catch (error) {
        console.error("Error uploading image: ", error);
        toast({
          title: "Image Upload Failed",
          description: "Could not upload image. Please try again.",
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
      photoUrl: photoUrlToSave,
      description: values.description || "",
      averageRating: initialData?.averageRating || 0,
      totalRatings: initialData?.totalRatings || 0,
      perceptionCounts: initialData?.perceptionCounts || { neutral: 0, fan: 0, simp: 0, hater: 0 },
    };

    try {
      if (initialData) {
        await updateFigureInFirestore(figureData); 
      } else {
        await addFigureToFirestore(figureData); 
      }
      
      toast({
        title: initialData ? "Figure Updated!" : "Figure Created!",
        description: `${figureData.name}'s profile has been saved to Firestore.`,
      });

      router.push(`/admin/figures`);
      router.refresh(); // Important to re-fetch data on the admin list page
    } catch (error) {
      console.error("Error saving figure to Firestore: ", error);
      toast({
        title: "Save Failed",
        description: `Could not save ${figureData.name}'s profile to Firestore. Please check console for errors.`,
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
              <FormLabel>Figure Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Ada Lovelace" {...field} disabled={isLoading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormItem>
          <FormLabel>Photo</FormLabel>
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
            Upload an image for the figure. If no image is uploaded, a placeholder will be used for new figures or the existing one kept for edits.
          </FormDescription>
          {previewUrl && (
            <div className="mt-4 w-32 h-40 relative rounded-md overflow-hidden border">
              <Image src={previewUrl} alt="Preview" layout="fill" objectFit="cover" />
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
              <FormLabel>Description / Category</FormLabel>
              <FormControl>
                <Textarea placeholder="e.g., Mathematician and Writer" {...field} disabled={isLoading} rows={3} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit" className="w-full sm:w-auto" disabled={isLoading}>
         {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
         {isLoading ? (initialData ? "Updating..." : "Creating...") : (initialData ? "Save Changes" : "Create Figure")}
        </Button>
      </form>
    </Form>
  );
}
