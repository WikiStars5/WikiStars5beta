
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Users, ListOrdered, PlusCircle, AlertTriangle, Loader2 } from "lucide-react";
import { getAllFiguresFromFirestore } from "@/lib/placeholder-data";
import { callFirebaseFunction } from "@/lib/firebase";
import type { Figure, UserProfile } from "@/lib/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { BatchUpdateImagesButton } from "@/components/admin/BatchUpdateImagesButton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { correctMalformedUrl } from "@/lib/utils";

const formatDate = (dateString?: string) => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  } catch (e) { return 'Fecha inválida'; }
};


export default function AdminDashboardPage() {
  const [figures, setFigures] = useState<Figure[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setFetchError(null);
      try {
        const figuresData = await getAllFiguresFromFirestore();
        setFigures(figuresData);
        
        const usersResult = await callFirebaseFunction('getAllUsers');
        if (usersResult.success) {
          // The function now returns users sorted by creation time, descending.
          setUsers(usersResult.users);
        } else {
          throw new Error(usersResult.error || 'No se pudieron cargar los usuarios.');
        }

      } catch (error: any) {
        console.error("Error fetching admin dashboard data:", error);
        setFetchError(error.message || 'Ocurrió un error inesperado al cargar los datos.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);
  
  const totalFigures = figures.length;
  const totalUsers = users.length;
  const recentUsers = users.slice(0, 5);

  return (
    <div className="space-y-8">
      {fetchError && (
        <Alert variant="destructive" className="mb-6 whitespace-pre-wrap">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle>Error de Carga</AlertTitle>
          <AlertDescription>{fetchError}</AlertDescription>
        </Alert>
      )}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-headline">Panel de Administración</CardTitle>
          <CardDescription>Resumen del estado de la aplicación WikiStars5. Datos de figuras y usuarios desde Firestore.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-24">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-4 text-muted-foreground">Cargando datos...</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total de Figuras</CardTitle>
                  <ListOrdered className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalFigures}</div>
                  <p className="text-xs text-muted-foreground">perfiles gestionados en Firestore</p>
                </CardContent>
              </Card>
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Usuarios Registrados</CardTitle>
                  <Users className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalUsers}</div>
                  <p className="text-xs text-muted-foreground">cuentas con email y contraseña</p>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-headline">Usuarios Recientes</CardTitle>
          <CardDescription>Los últimos 5 usuarios que se han registrado en la plataforma.</CardDescription>
        </CardHeader>
        <CardContent>
           {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : recentUsers.length > 0 ? (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60px] p-3"></TableHead>
                    <TableHead className="p-3">Nombre</TableHead>
                    <TableHead className="p-3">Email</TableHead>
                    <TableHead className="p-3 text-right">Fecha de Registro</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentUsers.map((user) => (
                    <TableRow key={user.uid}>
                       <TableCell className="p-2">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={correctMalformedUrl(user.photoURL) || undefined} alt={user.username} data-ai-hint="user avatar" />
                          <AvatarFallback>{user.username ? user.username.charAt(0).toUpperCase() : 'U'}</AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell className="font-medium p-3">{user.username}</TableCell>
                      <TableCell className="text-sm text-muted-foreground p-3">{user.email}</TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground p-3">{formatDate(user.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
             <p className="text-center text-muted-foreground py-8">No hay usuarios registrados.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-headline">Acciones Rápidas</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <Button asChild>
            <Link href="/admin/figures/new"><span className="flex items-center"><PlusCircle /> Añadir Nueva Figura</span></Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/admin/figures"><span className="flex items-center"><ListOrdered /> Gestionar Figuras</span></Link>
          </Button>
           <Button variant="outline" asChild>
            <Link href="/admin/users"><span className="flex items-center"><Users /> Gestionar Usuarios</span></Link>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-headline">Herramientas de Mantenimiento</CardTitle>
          <CardDescription>Ejecuta acciones masivas para corregir datos en la base de datos.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
           <BatchUpdateImagesButton />
        </CardContent>
      </Card>
    </div>
  );
}
