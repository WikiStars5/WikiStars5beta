
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getAllFiguresFromFirestore } from "@/lib/placeholder-data"; 
import type { Figure } from "@/lib/types";
import { PlusCircle, Edit3 } from "lucide-react";
import Link from "next/link";
import { AdminFigureImage } from "@/components/admin/AdminFigureImage";
import { AdminDeleteFigureButton } from "@/components/admin/AdminDeleteFigureButton";

export const revalidate = 0; // Ensure data is re-fetched on each request

export default async function AdminFiguresPage() {
  const figures = await getAllFiguresFromFirestore();

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
        {figures.length > 0 ? (
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Imagen</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="text-center w-[120px]">Calif. Prom.</TableHead>
                  <TableHead className="text-right w-[100px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {figures.map((figure) => (
                  <TableRow key={figure.id}>
                    <TableCell>
                      <AdminFigureImage 
                        figure={{
                          name: figure.name,
                          photoUrl: figure.photoUrl
                        }} 
                      />
                    </TableCell>
                    <TableCell className="font-medium">{figure.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground truncate max-w-xs">{figure.description}</TableCell>
                    <TableCell className="text-center">
                      {figure.averageRating.toFixed(1)} ({figure.totalRatings})
                    </TableCell>
                    <TableCell className="text-right">
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
          <p className="text-center text-muted-foreground py-8">No se encontraron figuras en Firestore. ¡Añade una para empezar!</p>
        )}
      </CardContent>
    </Card>
  );
}
