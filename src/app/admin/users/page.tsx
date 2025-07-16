"use client";

import { useState, useEffect } from 'react';
import AdminUsersPageClient from "@/components/admin/AdminUsersPageClient";
import type { UserProfile } from "@/lib/types";
import { Loader2, ShieldCheck } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '@/lib/firebase';

// This is the new, robust way to fetch user data by calling a Firebase Function.
const getAllUsers = httpsCallable(getFunctions(app), 'getAllUsers');

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await getAllUsers();
        const data = result.data as { success: boolean, users?: UserProfile[], error?: string };
        
        if (data.success && data.users) {
          setUsers(data.users);
        } else {
          let errorMessage = data.error || "No se pudieron cargar los usuarios. Revisa los logs de la función 'getAllUsers'.";
           if (errorMessage.toLowerCase().includes("permission")) {
              errorMessage = "Error de permisos en la Cloud Function. Asegúrate de que la cuenta de servicio tenga los roles necesarios y que el usuario que llama tenga permiso para invocar la función.";
          }
          setError(errorMessage);
        }
      } catch (err: any) {
        console.error("Failed to call 'getAllUsers' function:", err);
        setError(`Error al llamar a la función de Firebase: ${err.message || "Un error inesperado ocurrió."}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-4 text-muted-foreground">Cargando lista de usuarios desde la función...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <ShieldCheck className="h-4 w-4" />
        <AlertTitle>Error de Carga</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return <AdminUsersPageClient initialUsers={users} />;
}
