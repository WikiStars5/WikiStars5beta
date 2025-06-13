
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
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Loader2 } from "lucide-react";
import { addFigure, updateFigure } from "@/lib/placeholder-data"; // Simulated data ops

const figureSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  photoUrl: z.string().url("Must be a valid URL.").optional().or(z.literal('')),
  description: z.string().min(5, "Description must be at least 5 characters.").optional().or(z.literal('')),
  dataAiHint: z.string().optional().refine(value => !value || value.split(' ').length <= 2, {
    message: "AI hint can have at most two words."
  }).or(z.literal('')),
});

type FigureFormValues = z.infer<typeof figureSchema>;

interface FigureFormProps {
  initialData?: Figure | null;
}

export function FigureForm({ initialData }: FigureFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FigureFormValues>({
    resolver: zodResolver(figureSchema),
    defaultValues: {
      name: initialData?.name || "",
      photoUrl: initialData?.photoUrl || "",
      description: initialData?.description || "",
      dataAiHint: initialData?.dataAiHint || "",
    },
  });

  async function onSubmit(values: FigureFormValues) {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const figureData: Figure = {
      id: initialData?.id || `figure-${Date.now()}-${Math.random().toString(36).substring(2,7)}`,
      name: values.name,
      photoUrl: values.photoUrl || `https://placehold.co/300x400.png`,
      description: values.description,
      dataAiHint: values.dataAiHint || values.name.toLowerCase().split(' ').slice(0,2).join(' ') || "person",
      // Default values for new figures if not editing, or carry over existing
      averageRating: initialData?.averageRating || 0,
      totalRatings: initialData?.totalRatings || 0,
      perceptionCounts: initialData?.perceptionCounts || { neutral: 0, fan: 0, simp: 0, hater: 0 },
    };

    if (initialData) {
      updateFigure(figureData); // Simulate update
    } else {
      addFigure(figureData); // Simulate add
    }
    
    console.log("Figure data submitted:", figureData);
    setIsLoading(false);
    toast({
      title: initialData ? "Figure Updated!" : "Figure Created!",
      description: `${figureData.name}'s profile has been saved.`,
    });

    router.push(`/admin/figures`);
    router.refresh(); 
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
              <FormDescription>
                Link to an image of the figure. If left blank, a placeholder will be used.
              </FormDescription>
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
        <FormField
          control={form.control}
          name="dataAiHint"
          render={({ field }) => (
            <FormItem>
              <FormLabel>AI Image Hint</FormLabel>
              <FormControl>
                <Input placeholder="e.g., scientist, athlete (max 2 words)" {...field} disabled={isLoading} />
              </FormControl>
              <FormDescription>
                Optional. One or two keywords for AI image search if a placeholder is used (e.g., &quot;female musician&quot;, &quot;politician&quot;).
              </FormDescription>
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
