
"use client";

import { ShieldCheck } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function AdminUsersPage() {
  return (
      <Alert variant="destructive">
        <ShieldCheck className="h-4 w-4" />
        <AlertTitle>Funcionalidad Deshabilitada</AlertTitle>
        <AlertDescription>El sistema de autenticación de usuarios ha sido eliminado temporalmente. No se pueden gestionar usuarios.</AlertDescription>
      </Alert>
  );
}
