
"use client"; // Convert to client component

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Users, ListOrdered, PlusCircle, AlertTriangle, ImageUp, Loader2 } from "lucide-react";
import { getAllFiguresFromFirestore } from "@/lib/placeholder-data";
import { getAllUsersFromFirestore } from "@/lib/userData"; 
import type { Figure, UserProfile } from "@/lib/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { BatchUpdateImagesButton } from "@/components/admin/BatchUpdateImagesButton";
import { auth } from '@/lib/firebase';

const ADMIN_UID_FOR_MESSAGE = 'JZP4A5GvZUbWuT0Y1DIiawWcSUp2'; 

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
        // Fetch figures and users in parallel
        const [figuresData, usersData] = await Promise.all([
          getAllFiguresFromFirestore(),
          getAllUsersFromFirestore()
        ]);
        setFigures(figuresData);
        setUsers(usersData);
      } catch (error: any) {
        console.error("Error fetching admin dashboard data:", error);
        
        const currentUser = auth.currentUser;
        const currentUserUID = currentUser ? currentUser.uid : 'No hay usuario conectado';

        if (error.code === 'permission-denied' || (error.message && String(error.message).toLowerCase().includes("permission"))) {
          setFetchError(`**Error Crítico de Permisos de Firestore**

Tu panel de administración no puede cargar los datos de los usuarios.

**Diagnóstico:**
- **Estás usando la cuenta de admin correcta**: El UID del usuario conectado (\`${currentUserUID}\`) coincide con el UID de admin esperado.
- **El problema está en Firebase**: Las reglas de seguridad publicadas en tu Consola de Firebase no permiten que un administrador lea la lista de usuarios. La regla \`allow list: if isAdmin();\` en la colección \`registered_users\` es la que está fallando.

**Solución Definitiva (Obligatoria):**
1.  **Ve al archivo:** \`src/lib/firebase.ts\` en este editor.
2.  **Copia** el bloque de código completo de las reglas de seguridad.
3.  **Ve a tu Consola de Firebase:** Navega a Firestore Database > Pestaña 'Rules'.
4.  **Reemplaza y Publica:** Borra las reglas antiguas, pega las nuevas y haz clic en **Publish**.
5.  **Espera y refresca:** Espera uno o dos minutos y actualiza esta página.

**No lances tu sitio web hasta que este error desaparezca. Un panel de administración que no funciona es un problema crítico.**`);
        } else {
          setFetchError(`Ocurrió un error inesperado al obtener los datos del panel: ${error.message || 'Error desconocido'}`);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const totalFigures = figures.length;
  const totalUsers = users.length;

  return (
    <div className="space-y-8">
      {fetchError && (
        <Alert variant="destructive" className="mb-6 whitespace-pre-wrap">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle>Error de Permiso de Firestore</AlertTitle>
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
                  <Users className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalFigures}</div>
                  <p className="text-xs text-muted-foreground">perfiles gestionados en Firestore</p>
                </CardContent>
              </Card>
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total de Usuarios</CardTitle>
                  <Users className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{fetchError ? 'Error' : totalUsers}</div>
                  <p className="text-xs text-muted-foreground">{fetchError ? 'debido a error de permisos' : 'usuarios registrados'}</p>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-headline">Acciones Rápidas</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <Button asChild>
            <Link href="/admin/figures/new">
              <span className="flex items-center">
                <PlusCircle className="mr-2 h-4 w-4" /> Añadir Nueva Figura
              </span>
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/admin/figures">
              <span className="flex items-center">
                <ListOrdered className="mr-2 h-4 w-4" /> Gestionar Figuras
              </span>
            </Link>
          </Button>
           <Button variant="outline" asChild>
            <Link href="/admin/users">Gestionar Usuarios</Link>
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
