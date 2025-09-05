
"use client";

import { useState } from "react";
import { FigureListItem } from "@/components/figures/FigureListItem";
import { SearchBar } from "@/components/shared/SearchBar";
import { Button } from "@/components/ui/button";
import type { Figure, GenderOption } from "@/lib/types";
import { ChevronLeft, ChevronRight, ListFilter, X, Loader2 } from "lucide-react";
import Link from "next/link";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter, SheetClose } from "@/components/ui/sheet";
import { CountryCombobox } from "@/components/shared/CountryCombobox";
import { GENDER_OPTIONS } from "@/config/genderOptions";
import { TAG_OPTIONS } from "@/config/tags";
import { Combobox } from "@/components/shared/Combobox";
import { Badge } from "@/components/ui/badge";
import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";


interface FiguresPageClientProps {
  initialFigures: Figure[];
  hasPrevPage: boolean;
  hasNextPage: boolean;
  startCursor: string | null;
  endCursor: string | null;
}

const searchFiguresByFiltersCallable = httpsCallable(getFunctions(app, 'us-central1'), 'searchFiguresByFilters');

export function FiguresPageClient({
  initialFigures,
  hasPrevPage,
  hasNextPage,
  startCursor,
  endCursor,
}: FiguresPageClientProps) {

  const [figures, setFigures] = useState<Figure[]>(initialFigures);
  const [isFiltering, setIsFiltering] = useState(false);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const { toast } = useToast();

  // Filter states
  const [selectedNationality, setSelectedNationality] = useState<string>('');
  const [selectedGender, setSelectedGender] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState<string | null>(null);
  const [minAge, setMinAge] = useState<string>('');
  const [maxAge, setMaxAge] = useState<string>('');
  const [minHeight, setMinHeight] = useState<string>('');
  const [maxHeight, setMaxHeight] = useState<string>('');


  const genderOptions: GenderOption[] = GENDER_OPTIONS.filter(opt => opt.value === 'male' || opt.value === 'female');
  const tagOptions = TAG_OPTIONS.map(tag => ({ value: tag, label: tag }));

  const activeFilterCount = 
    (selectedNationality ? 1 : 0) + 
    (selectedGender ? 1 : 0) + 
    selectedTags.length +
    (minAge ? 1 : 0) +
    (maxAge ? 1 : 0) +
    (minHeight ? 1 : 0) +
    (maxHeight ? 1 : 0);

  const handleAddTag = () => {
    if (currentTag && !selectedTags.includes(currentTag)) {
      setSelectedTags([...selectedTags, currentTag]);
      setCurrentTag(null);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setSelectedTags(selectedTags.filter(tag => tag !== tagToRemove));
  };

  const handleApplyFilters = async () => {
    setIsFiltering(true);
    setIsFilterSheetOpen(false);

    // Step 1: Backend Query (for indexed fields like nationality or tags)
    // We prioritize the most specific filter to send to the backend.
    const backendFilters: { nationalityCode?: string; tags?: string[] } = {};
    if (selectedNationality) {
      backendFilters.nationalityCode = selectedNationality;
    } else if (selectedTags.length > 0) {
      backendFilters.tags = selectedTags;
    }

    try {
      // If no specific backend filter is set, we still need all figures for client-side filtering.
      // In a real large-scale app, we might prevent this or use a default popular list.
      // For now, we'll call the function even if backendFilters is empty, which will return all figures up to the limit.
      const result = await searchFiguresByFiltersCallable(backendFilters);
      const data = result.data as { success: boolean, figures?: Figure[], error?: string };
      
      if (!data.success || !data.figures) {
        toast({ title: "Error de Búsqueda", description: data.error || "No se pudieron aplicar los filtros.", variant: "destructive" });
        setFigures([]);
        return;
      }
      
      // Step 2: Client-Side Filtering (for all other fields)
      let clientFilteredResults = data.figures;
      const minAgeNum = minAge ? parseInt(minAge) : null;
      const maxAgeNum = maxAge ? parseInt(maxAge) : null;
      const minHeightNum = minHeight ? parseInt(minHeight) : null;
      const maxHeightNum = maxHeight ? parseInt(maxHeight) : null;
      const genderLabel = GENDER_OPTIONS.find(g => g.value === selectedGender)?.label;

      clientFilteredResults = clientFilteredResults.filter(figure => {
          // Gender filter
          if (genderLabel && figure.gender !== genderLabel) return false;

          // Tags filter (if nationality was the backend filter)
          if (selectedNationality && selectedTags.length > 0) {
            if (!selectedTags.every(tag => figure.tags?.includes(tag))) return false;
          }

          // Age range filter
          const age = figure.age;
          const ageMatch = (!minAgeNum || (age && age >= minAgeNum)) && (!maxAgeNum || (age && age <= maxAgeNum));
          if (!ageMatch) return false;

          // Height range filter
          const height = figure.heightCm;
          const heightMatch = (!minHeightNum || (height && height >= minHeightNum)) && (!maxHeightNum || (height && height <= maxHeightNum));
          if (!heightMatch) return false;
          
          return true; // If all filters pass
      });

      setFigures(clientFilteredResults);

    } catch (error: any) {
      console.error("Error calling searchFiguresByFilters:", error);
      let errorMessage = "Ocurrió un error al buscar las figuras.";
      if (error.code === 'functions/internal') {
        errorMessage = "Error interno del servidor. Revisa los logs de la Cloud Function.";
      }
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    } finally {
      setIsFiltering(false);
    }
  };

  const handleClearFilters = () => {
    setSelectedNationality('');
    setSelectedGender('');
    setSelectedTags([]);
    setMinAge('');
    setMaxAge('');
    setMinHeight('');
    setMaxHeight('');
    setFigures(initialFigures); // Reset to initial state
  };

  const renderContent = () => {
    if (isFiltering) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
            <p className="text-lg text-muted-foreground">Buscando perfiles...</p>
        </div>
      );
    }

    if (figures.length > 0) {
      return (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {figures.map((figure) => (
              <FigureListItem key={figure.id} figure={figure} />
            ))}
          </div>
          {/* Pagination is hidden when filters are active */}
          {activeFilterCount === 0 && (
              <div className="flex justify-center pt-6 border-t">
                  <div className="flex items-center gap-2">
                    <Button asChild variant="outline" disabled={!hasPrevPage}>
                        <Link href={`/figures?endBefore=${startCursor}`}>
                        <ChevronLeft className="mr-2 h-4 w-4" />
                        Anterior
                        </Link>
                    </Button>
                    <Button asChild variant="outline" disabled={!hasNextPage}>
                        <Link href={`/figures?startAfter=${endCursor}`}>
                        Siguiente
                        <ChevronRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                  </div>
              </div>
          )}
        </>
      );
    }

    return (
        <Alert>
          <AlertTitle>No se encontraron resultados</AlertTitle>
          <AlertDescription>
            No hay perfiles que coincidan con los filtros seleccionados. Intenta con otros criterios o limpia los filtros.
          </AlertDescription>
        </Alert>
    );
  }

  return (
    <div className="space-y-10">
      <section className="text-center">
        <h1 className="text-4xl font-bold font-headline mb-4">Explorar Todas las Figuras</h1>
        <p className="text-lg text-muted-foreground mb-6">
          Encuentra a tus celebridades, políticos, atletas favoritos y más. Datos cargados desde Firestore.
        </p>
        <div className="max-w-xl mx-auto flex flex-col items-center gap-4">
          <SearchBar />
           <Sheet open={isFilterSheetOpen} onOpenChange={setIsFilterSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="relative">
                  <ListFilter className="mr-2 h-4 w-4" />
                  Filtros
                  {activeFilterCount > 0 && (
                      <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 justify-center p-0">{activeFilterCount}</Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Filtrar Perfiles</SheetTitle>
                </SheetHeader>
                <ScrollArea className="h-[calc(100vh-150px)] pr-4">
                  <div className="space-y-6 py-4">
                      <div>
                          <Label className="font-semibold mb-2 block">Nacionalidad</Label>
                          <CountryCombobox value={selectedNationality} onChange={setSelectedNationality} />
                      </div>

                      <div>
                          <Label className="font-semibold mb-2 block">Género</Label>
                          <Combobox 
                              options={genderOptions}
                              value={selectedGender}
                              onChange={(val) => setSelectedGender(val || '')}
                              placeholder="Selecciona un género..."
                          />
                      </div>

                      <div>
                        <Label className="font-semibold mb-2 block">Rango de Edad</Label>
                        <div className="flex items-center gap-2">
                           <Input type="number" placeholder="Mín." value={minAge} onChange={(e) => setMinAge(e.target.value)} className="w-full"/>
                           <span>-</span>
                           <Input type="number" placeholder="Máx." value={maxAge} onChange={(e) => setMaxAge(e.target.value)} className="w-full"/>
                        </div>
                      </div>

                      <div>
                        <Label className="font-semibold mb-2 block">Rango de Altura (cm)</Label>
                        <div className="flex items-center gap-2">
                           <Input type="number" placeholder="Mín." value={minHeight} onChange={(e) => setMinHeight(e.target.value)} className="w-full"/>
                           <span>-</span>
                           <Input type="number" placeholder="Máx." value={maxHeight} onChange={(e) => setMaxHeight(e.target.value)} className="w-full"/>
                        </div>
                      </div>
                      
                      <div>
                        <Label className="font-semibold mb-2 block">Etiquetas</Label>
                        <div className="flex gap-2">
                           <Combobox
                              options={tagOptions}
                              value={currentTag || ''}
                              onChange={(value) => setCurrentTag(value)}
                              placeholder="Busca y añade etiquetas..."
                            />
                            <Button type="button" onClick={handleAddTag} disabled={!currentTag}>Añadir</Button>
                        </div>
                         <div className="flex flex-wrap gap-1 mt-2">
                          {selectedTags.map(tag => (
                            <Badge key={tag} variant="secondary">
                              {tag}
                              <button onClick={() => handleRemoveTag(tag)} className="ml-1.5 rounded-full hover:bg-destructive/20 text-destructive">
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      </div>
                  </div>
                </ScrollArea>
                <SheetFooter className="mt-4">
                    <SheetClose asChild>
                      <Button variant="ghost">Cerrar</Button>
                    </SheetClose>
                     <div className="flex-grow" />
                    {activeFilterCount > 0 && <Button variant="outline" onClick={handleClearFilters}>Limpiar ({activeFilterCount})</Button>}
                    <Button onClick={handleApplyFilters} disabled={activeFilterCount === 0}>Aplicar Filtros</Button>
                </SheetFooter>
              </SheetContent>
            </Sheet>
        </div>
      </section>

      {renderContent()}
    </div>
  );
}
