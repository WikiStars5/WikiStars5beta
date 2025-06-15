
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Users, ListOrdered, PlusCircle, AlertTriangle } from "lucide-react";
import { getAllFiguresFromFirestore } from "@/lib/placeholder-data";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export const revalidate = 0; // Ensure data is re-fetched

const ADMIN_UID_FOR_MESSAGE = 'JZP4A5GvZUbWuT0Y1DIiawWcSUp2'; // For display in error message

export default async function AdminDashboardPage() {
  let figures = [];
  let totalFigures = 0;
  let fetchError: string | null = null;

  try {
    figures = await getAllFiguresFromFirestore();
    totalFigures = figures.length;
  } catch (error: any) {
    console.error("Error fetching admin dashboard data:", error);
    if (error.code === 'permission-denied' || (error.message && String(error.message).toLowerCase().includes("permission"))) {
      fetchError = `No se pudieron obtener los datos del panel debido a permisos de Firestore faltantes o insuficientes. Por favor, revisa tus Reglas de Seguridad de Firebase en la consola de Firebase. Asegúrate de que el usuario administrador (UID: ${ADMIN_UID_FOR_MESSAGE}) tenga acceso de lectura a las colecciones 'figures'.`;
    } else {
      fetchError = `Ocurrió un error inesperado al obtener los datos del panel: ${error.message || 'Error desconocido'}`;
    }
  }

  const totalUsers = 150; // Placeholder, as user management is not in Firestore yet

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
          <CardDescription>Resumen del estado de la aplicación WikiStars5. Datos de figuras desde Firestore.</CardDescription>
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
                <CardTitle className="text-sm font-medium">Total de Usuarios (Simulado)</CardTitle>
                <Users className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalUsers}</div>
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
           <Button variant="outline" disabled asChild>
            <Link href="/admin/users">Gestionar Usuarios</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
