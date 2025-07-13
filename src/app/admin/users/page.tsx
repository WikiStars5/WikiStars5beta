"use client";

import { useState, useEffect } from 'react';
import { getAllUsers } from "@/app/actions/userActions"; // Updated import
import AdminUsersPageClient from "@/components/admin/AdminUsersPageClient";
import type { UserProfile } from "@/lib/types";
import { Loader2, ShieldCheck } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await getAllUsers(); // Updated function call
        if (result.success && result.users) {
          setUsers(result.users);
        } else {
          let errorMessage = result.error || "No se pudieron cargar los usuarios. Asegúrate de que las reglas de seguridad de Firestore permitan al administrador listar usuarios.";
          if (errorMessage.toLowerCase().includes("permission")) {
              errorMessage = "Error de permisos de Firestore. Revisa las reglas de seguridad para la colección 'registered_users' y asegúrate de que tu cuenta de administrador tenga permisos de 'list'.";
          }
          setError(errorMessage);
        }
      } catch (err: any) {
        console.error("Failed to fetch users in AdminUsersPage:", err);
        setError(err.message || "Un error inesperado ocurrió.");
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
        <p className="ml-4 text-muted-foreground">Cargando lista de usuarios...</p>
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
