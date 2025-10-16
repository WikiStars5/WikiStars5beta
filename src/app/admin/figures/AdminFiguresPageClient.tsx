"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import type { Figure } from "@/lib/types";
import { PlusCircle, Star, Search as SearchIcon, ChevronLeft, ChevronRight, Loader2, AlertTriangle, FilePenLine } from "lucide-react";
import Link from "next/link";
import { AdminFigureImage } from "@/components/admin/AdminFigureImage";
import { useSearchParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { getAdminFiguresList } from "@/lib/placeholder-data";


function AdminFiguresPageComponent() {
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

        if (result) {
            setLocalFigures(result.figures);
            setHasPrevPage(result.hasPrevPage);
            setHasNextPage(result.hasNextPage);
            setStartCursor(result.startCursor);
            setEndCursor(result.endCursor);
        } else {
            throw new Error("Respuesta inválida desde el servidor.");
        }
      } catch (err: any) {
        console.error("Failed to fetch figures from client-side logic:", err);
        setError(err.message || "Ocurrió un error desconocido al cargar las figuras.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchFigures();
  }, [startAfter, endBefore]);

  const filteredFigures = useMemo(() => {
    if (!searchTerm) {
      return localFigures;
    }
    return localFigures.filter((figure) =>
      figure.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [localFigures, searchTerm]);

  if (isLoading) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-2xl font-headline">Gestionar Figuras</CardTitle>
                <CardDescription>Crea, edita o elimina perfiles de figuras públicas.</CardDescription>
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
                 <CardDescription>Crea, edita o elimina perfiles de figuras públicas.</CardDescription>
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
          <CardDescription>Crea, edita o elimina perfiles de figuras públicas.</CardDescription>
        </div>
        <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href="/admin/figures/new">
                <PlusCircle className="mr-2 h-4 w-4" /> Añadir Nueva Figura
              </Link>
            </Button>
        </div>
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
                  <TableHead className="text-right w-[100px] p-3">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFigures.map((figure) => (
                  <TableRow key={figure.id}>
                    <TableCell className="p-3">
                      <AdminFigureImage
                        figure={{
                          name: figure.name,
                          photoUrl: figure.photoUrl
                        }}
                      />
                    </TableCell>
                    <TableCell className="font-medium p-3">
                      <div className="flex items-center gap-2">
                        {figure.name}
                        {figure.isFeatured && <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />}
                      </div>
                    </TableCell>
                    <TableCell className="text-right p-3">
                      <Button variant="ghost" size="icon" asChild className="mr-1">
                        <Link href={`/admin/figures/${figure.id}/edit`}>
                          <FilePenLine className="h-4 w-4" />
                          <span className="sr-only">Editar</span>
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">
            {searchTerm ? "No se encontraron figuras con ese nombre." : "No se encontraron figuras. ¡Añade una para empezar!"}
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
  return (
    <Suspense>
      <AdminFiguresPageComponent />
    </Suspense>
  );
}
