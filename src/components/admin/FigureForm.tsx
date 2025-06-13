"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Figure } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";

const figureSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  photoUrl: z.string().url("Must be a valid URL.").optional().or(z.literal('')),
  description: z.string().optional(),
});

type FigureFormValues = z.infer<typeof figureSchema>;

interface FigureFormProps {
  initialData?: Figure | null;
  onSubmitSuccess?: (figure: Figure) => void;
}

export function FigureForm({ initialData, onSubmitSuccess }: FigureFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FigureFormValues>({
    resolver: zodResolver(figureSchema),
    defaultValues: {
      name: initialData?.name || "",
      photoUrl: initialData?.photoUrl || "",
      description: initialData?.description || "",
    },
  });

  async function onSubmit(values: FigureFormValues) {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const figureData: Partial<Figure> = {
      ...initialData, // keep existing id, ratings etc.
      id: initialData?.id || `figure-${Date.now()}`,
      name: values.name,
      photoUrl: values.photoUrl || 'https://placehold.co/300x400.png', // Default placeholder
      description: values.description,
      // Default values for new figures if not editing
      averageRating: initialData?.averageRating || 0,
      totalRatings: initialData?.totalRatings || 0,
      perceptionCounts: initialData?.perceptionCounts || { neutral: 0, fan: 0, simp: 0, hater: 0 },
    };

    console.log("Figure data submitted:", figureData);
    setIsLoading(false);
    toast({
      title: initialData ? "Figure Updated!" : "Figure Created!",
      description: `${figureData.name}'s profile has been saved.`,
    });

    if (onSubmitSuccess) {
      onSubmitSuccess(figureData as Figure);
    } else {
      router.push(`/admin/figures`); // or to the figure's new page: /figures/${figureData.id}
      router.refresh(); // Important to see changes if data source was updated server-side
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-2xl mx-auto p-6 border rounded-lg shadow-md bg-card">
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
        <FormField
          control={form.control}
          name="photoUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Photo URL</FormLabel>
              <FormControl>
                <Input type="url" placeholder="https://example.com/photo.jpg" {...field} disabled={isLoading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
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
         <Save className="mr-2 h-4 w-4" /> {isLoading ? (initialData ? "Updating..." : "Creating...") : (initialData ? "Save Changes" : "Create Figure")}
        </Button>
      </form>
    </Form>
  );
}
