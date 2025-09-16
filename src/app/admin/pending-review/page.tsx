
"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { getPendingReviewFigures, deleteFigureFromFirestore, updateFigureInFirestore } from "@/lib/placeholder-data";
import type { Figure } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader2, AlertTriangle, CheckCircle, Trash2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AdminFigureImage } from "@/components/admin/AdminFigureImage";

export default function PendingReviewPage() {
  const [figures, setFigures] = useState<Figure[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchFigures = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const pendingFigures = await getPendingReviewFigures();
      setFigures(pendingFigures);
    } catch (err: any) {
      setError("No se pudieron cargar los perfiles pendientes de revisión.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFigures();
  }, []);

  const handleApprove = async (figureId: string) => {
    setIsProcessing(figureId);
    try {
      await updateFigureInFirestore({ id: figureId, status: 'approved' });
      toast({ title: "Perfil Aprobado", description: "El perfil ahora es público." });
      setFigures(prev => prev.filter(f => f.id !== figureId));
    } catch (err: any) {
      toast({ title: "Error", description: "No se pudo aprobar el perfil.", variant: "destructive" });
    } finally {
      setIsProcessing(null);
    }
  };

  const handleDelete = async (figureId: string) => {
    setIsProcessing(figureId);
    try {
      await deleteFigureFromFirestore(figureId);
      toast({ title: "Perfil Eliminado", description: "El perfil ha sido eliminado permanentemente." });
      setFigures(prev => prev.filter(f => f.id !== figureId));
    } catch (err: any) {
      toast({ title: "Error", description: "No se pudo eliminar el perfil.", variant: "destructive" });
    } finally {
      setIsProcessing(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-4 text-muted-foreground">Cargando perfiles...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error de Carga</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Perfiles Pendientes de Revisión</CardTitle>
        <CardDescription>
          Estos perfiles fueron creados manualmente y no alcanzaron los 1,000 votos de actitud en 5 días.
          Puedes aprobarlos para que vuelvan a ser públicos o eliminarlos permanentemente.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {figures.length > 0 ? (
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Imagen</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {figures.map((figure) => (
                  <TableRow key={figure.id}>
                    <TableCell>
                      <AdminFigureImage figure={figure} />
                    </TableCell>
                    <TableCell className="font-medium">{figure.name}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleApprove(figure.id)}
                        disabled={isProcessing === figure.id}
                        className="mr-2 text-green-500 hover:text-green-600 hover:bg-green-500/10"
                      >
                        {isProcessing === figure.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                        <span className="ml-2 hidden sm:inline">Aprobar</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(figure.id)}
                        disabled={isProcessing === figure.id}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        {isProcessing === figure.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        <span className="ml-2 hidden sm:inline">Eliminar</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-10">
            No hay perfiles pendientes de revisión en este momento.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
