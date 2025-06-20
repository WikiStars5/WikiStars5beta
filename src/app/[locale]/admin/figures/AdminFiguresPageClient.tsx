"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import type { Figure } from "@/lib/types";
import { PlusCircle, Edit3, MessageSquare, Star, Search as SearchIcon } from "lucide-react";
import Link from "next/link";
import { AdminFigureImage } from "@/components/admin/AdminFigureImage";
import { AdminDeleteFigureButton } from "@/components/admin/AdminDeleteFigureButton";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { toggleFigureFeaturedStatus } from "@/app/actions/adminActions";

interface AdminFiguresPageClientProps {
  initialFigures: Figure[];
}

export default function AdminFiguresPageClient({ initialFigures }: AdminFiguresPageClientProps) {
  const [searchTerm, setSearchTerm] = useState("");
  // Local state for figures to allow optimistic updates for the Switch
  const [figures, setFigures] = useState<Figure[]>(initialFigures);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    // This ensures that if the initialFigures prop changes (e.g. after router.refresh from parent),
    // the local state is updated.
    setFigures(initialFigures);
  }, [initialFigures]);

  const filteredFigures = useMemo(() => {
    if (!searchTerm) {
      return figures;
    }
    return figures.filter((figure) =>
      figure.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [figures, searchTerm]);

  const handleToggleFeatured = async (figureId: string) => {
    // Optimistic update
    const originalFigures = [...figures];
    setFigures(prevFigures =>
      prevFigures.map(f =>
        f.id === figureId ? { ...f, isFeatured: !(f.isFeatured || false) } : f
      )
    );

    const result = await toggleFigureFeaturedStatus(figureId);

    if (result.success) {
      toast({
        title: "Estado Actualizado",
        description: result.message,
      });
      // No need to setFigures again if optimistic update matches,
      // but router.refresh() will ensure consistency if something went wrong or for other clients
      router.refresh();
    } else {
      // Revert optimistic update on error
      setFigures(originalFigures);
      toast({
        title: "Error",
        description: result.message || "No se pudo actualizar el estado.",
        variant: "destructive",
      });
    }
  };


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
                  <TableHead className="p-3 max-w-xs">Descripción</TableHead>
                  <TableHead className="w-[130px] text-center p-3">Destacada</TableHead>
                  <TableHead className="w-[130px] text-center p-3">Comentarios</TableHead>
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
                    <TableCell className="font-medium p-3">{figure.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground truncate max-w-xs p-3">{figure.description}</TableCell>
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
    </Card>
  );
}
