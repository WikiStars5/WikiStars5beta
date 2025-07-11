
"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import type { Figure } from "@/lib/types";
import { PlusCircle, Edit3, MessageSquare, Star, Search as SearchIcon, ChevronLeft, ChevronRight, Loader2, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { AdminFigureImage } from "@/components/admin/AdminFigureImage";
import { AdminDeleteFigureButton } from "@/components/admin/AdminDeleteFigureButton";
import { useSearchParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { toggleFigureFeaturedStatus } from "@/app/actions/adminActions";
import { getAdminFiguresList } from "@/lib/placeholder-data";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";


function AdminFiguresPageComponent({ enrichingId, setFigures }: { enrichingId: string | null, setFigures: React.Dispatch<React.SetStateAction<Figure[]>> }) {
  const { toast } = useToast();
  const searchParams = useSearchParams();

  const [searchTerm, setSearchTerm] = useState("");
  const [localFigures, setLocalFigures] = useState<Figure[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [hasPrevPage, setHasPrevPage] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [startCursor, setStartCursor] = useState<string | null>(null);
  const [endCursor, setEndCursor] = useState<string | null>(null);

  const startAfter = searchParams.get('startAfter');
  const endBefore = searchParams.get('endBefore');

  useEffect(() => {
    const fetchFigures = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await getAdminFiguresList({
          startAfter: startAfter ?? undefined,
          endBefore: endBefore ?? undefined,
        });
        setLocalFigures(result.figures);
        setFigures(result.figures); // Update parent state
        setHasPrevPage(result.hasPrevPage);
        setHasNextPage(result.hasNextPage);
        setStartCursor(result.startCursor);
        setEndCursor(result.endCursor);
      } catch (err: any) {
        console.error("Failed to fetch figures:", err);
        let errorMessage = "No se pudieron cargar las figuras. Revisa tu conexión a internet.";
        if (err.message && String(err.message).toLowerCase().includes("permission")) {
            errorMessage = "Error de permisos de Firestore. Revisa las reglas de seguridad para la colección 'figures' y asegúrate de que tu cuenta de administrador tenga permisos de 'list'.";
        }
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFigures();
  }, [startAfter, endBefore, setFigures]);

  const filteredFigures = useMemo(() => {
    if (!searchTerm) {
      return localFigures;
    }
    return localFigures.filter((figure) =>
      figure.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [localFigures, searchTerm]);

  const handleToggleFeatured = async (figureId: string) => {
    const originalFigures = [...localFigures];
    const updateFunc = (prevFigures: Figure[]) =>
      prevFigures.map(f =>
        f.id === figureId ? { ...f, isFeatured: !(f.isFeatured || false) } : f
      );
    setLocalFigures(updateFunc);
    setFigures(updateFunc); // Update parent state

    const result = await toggleFigureFeaturedStatus(figureId);

    if (result.success) {
      toast({
        title: "Estado Actualizado",
        description: result.message,
      });
    } else {
      setLocalFigures(originalFigures);
      setFigures(originalFigures); // Revert parent state
      toast({
        title: "Error",
        description: result.message || "No se pudo actualizar el estado.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-2xl font-headline">Gestionar Figuras</CardTitle>
                <CardDescription>Crea, edita o elimina perfiles de figuras públicas de Firestore.</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center items-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-4 text-muted-foreground">Cargando figuras...</p>
            </CardContent>
        </Card>
    );
  }

  if (error) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-2xl font-headline">Gestionar Figuras</CardTitle>
                 <CardDescription>Crea, edita o elimina perfiles de figuras públicas de Firestore.</CardDescription>
            </CardHeader>
            <CardContent>
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Error de Carga</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            </CardContent>
        </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <CardTitle className="text-2xl font-headline">Gestionar Figuras</CardTitle>
          <CardDescription>Crea, edita o elimina perfiles de figuras públicas de Firestore.</CardDescription>
        </div>
        <Button asChild>
          <Link href="/admin/figures/new">
            <PlusCircle className="mr-2 h-4 w-4" /> Añadir Nueva Figura
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              type="search"
              placeholder="Buscar figuras por nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full sm:w-[350px] h-10 text-sm rounded-md shadow-sm border-input focus:ring-1 focus:ring-primary/50 bg-card"
            />
          </div>
        </div>

        {filteredFigures.length > 0 ? (
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px] p-3">Imagen</TableHead>
                  <TableHead className="p-3">Nombre</TableHead>
                  <TableHead className="p-3">Categorías</TableHead>
                  <TableHead className="w-[130px] text-center p-3">Destacada</TableHead>
                  <TableHead className="w-[130px] text-center p-3">Comentarios</TableHead>
                  <TableHead className="text-right w-[100px] p-3">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFigures.map((figure) => (
                  <TableRow key={figure.id} className={enrichingId === figure.id ? 'bg-primary/10' : ''}>
                    <TableCell className="p-3">
                      <AdminFigureImage
                        figure={{
                          name: figure.name,
                          photoUrl: figure.photoUrl
                        }}
                      />
                    </TableCell>
                    <TableCell className="font-medium p-3">{figure.name}</TableCell>
                    <TableCell className="p-3 max-w-xs">
                      <div className="flex flex-wrap gap-1 items-center">
                        {enrichingId === figure.id && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                        {figure.categories && figure.categories.length > 0 ? (
                          figure.categories.map(cat => <Badge key={cat} variant="secondary" className="text-xs">{cat}</Badge>)
                        ) : (
                          <span className="text-xs text-muted-foreground">{enrichingId === figure.id ? 'Analizando...' : 'Vacío'}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center p-3">
                      <div className="flex items-center justify-center">
                        <Switch
                          id={`featured-${figure.id}`}
                          checked={figure.isFeatured || false}
                          onCheckedChange={() => handleToggleFeatured(figure.id)}
                          aria-label={figure.isFeatured ? "Desmarcar como destacada" : "Marcar como destacada"}
                        />
                        {figure.isFeatured && <Star className="ml-2 h-4 w-4 text-yellow-400 fill-yellow-400" />}
                      </div>
                    </TableCell>
                    <TableCell className="text-center p-3">
                      <div className="flex items-center justify-center">
                        <MessageSquare className="h-4 w-4 mr-1 text-muted-foreground" />
                        {figure.commentCount || 0}
                      </div>
                    </TableCell>
                    <TableCell className="text-right p-3">
                      <Button variant="ghost" size="icon" asChild className="mr-1">
                        <Link href={`/admin/figures/${figure.id}/edit`}>
                          <Edit3 className="h-4 w-4" />
                          <span className="sr-only">Editar</span>
                        </Link>
                      </Button>
                      <AdminDeleteFigureButton
                        figure={{
                          id: figure.id,
                          name: figure.name
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">
            {searchTerm ? "No se encontraron figuras con ese nombre." : "No se encontraron figuras en Firestore. ¡Añade una para empezar!"}
          </p>
        )}
      </CardContent>
      <CardFooter className="flex justify-end pt-6 border-t">
        <div className="flex items-center gap-2">
            <Button asChild variant="outline" disabled={!hasPrevPage}>
                <Link href={`/admin/figures?endBefore=${startCursor}`}>
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Anterior
                </Link>
            </Button>
            <Button asChild variant="outline" disabled={!hasNextPage}>
                <Link href={`/admin/figures?startAfter=${endCursor}`}>
                    Siguiente
                    <ChevronRight className="ml-2 h-4 w-4" />
                </Link>
            </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

// This component now manages the state that needs to be shared
// between the dashboard and the figures table.
export default function AdminFiguresPageClient() {
  const [figures, setFigures] = useState<Figure[]>([]);
  const [enrichingId, setEnrichingId] = useState<string | null>(null);

  const handleEnrichmentUpdate = (figureId: string, updatedData: Partial<Figure>) => {
    setFigures(prevFigures =>
      prevFigures.map(f => (f.id === figureId ? { ...f, ...updatedData } : f))
    );
  };
  
  return (
    <Suspense>
      <AdminFiguresPageComponent enrichingId={enrichingId} setFigures={setFigures}/>
    </Suspense>
  );
}
