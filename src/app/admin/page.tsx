
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Users, ListOrdered, PlusCircle, AlertTriangle, Wrench } from "lucide-react";
import { getAllFiguresFromFirestore } from "@/lib/placeholder-data";
import { getAllUsersFromFirestore } from "@/lib/userData"; // Import new function
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { BatchUpdateImagesButton } from "@/components/admin/BatchUpdateImagesButton";

export const revalidate = 0; 

const ADMIN_UID_FOR_MESSAGE = 'JZP4A5GvZUbWuT0Y1DIiawWcSUp2'; 

export default async function AdminDashboardPage() {
  let figures = [];
  let totalFigures = 0;
  let fetchError: string | null = null;
  let users = [];
  let totalUsers = 0;

  try {
    // Fetch figures and users in parallel
    [figures, users] = await Promise.all([
      getAllFiguresFromFirestore(),
      getAllUsersFromFirestore()
    ]);
    totalFigures = figures.length;
    totalUsers = users.length;
  } catch (error: any) {
    console.error("Error fetching admin dashboard data:", error);
    if (error.code === 'permission-denied' || (error.message && String(error.message).toLowerCase().includes("permission"))) {
      fetchError = `No se pudieron obtener los datos del panel debido a permisos de Firestore faltantes o insuficientes. Por favor, revisa tus Reglas de Seguridad de Firebase en la consola de Firebase. Asegúrate de que el usuario administrador (UID: ${ADMIN_UID_FOR_MESSAGE}) tenga acceso de lectura a las colecciones 'figures' y 'registered_users'.`;
    } else {
      fetchError = `Ocurrió un error inesperado al obtener los datos del panel: ${error.message || 'Error desconocido'}`;
    }
  }

  return (
    <div className="space-y-8">
      {fetchError && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle>Error de Permiso</AlertTitle>
          <AlertDescription>{fetchError}</AlertDescription>
        </Alert>
      )}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-headline">Panel de Administración</CardTitle>
          <CardDescription>Resumen del estado de la aplicación WikiStars5. Datos de figuras y usuarios desde Firestore.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Figuras</CardTitle>
                <Users className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{fetchError ? 'N/A' : totalFigures}</div>
                <p className="text-xs text-muted-foreground">perfiles gestionados en Firestore</p>
              </CardContent>
            </Card>
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Usuarios</CardTitle>
                <Users className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{fetchError ? 'N/A' : totalUsers}</div>
                <p className="text-xs text-muted-foreground">usuarios registrados</p>
              </CardContent>
            </Card>
          </div>
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
          <CardTitle className="flex items-center text-xl font-headline">
            <Wrench className="mr-2 h-5 w-5" /> Herramientas de Mantenimiento
          </CardTitle>
          <CardDescription>
            Acciones para corregir datos en toda la base de datos. Usar con precaución.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BatchUpdateImagesButton />
        </CardContent>
      </Card>

    </div>
  );
}
