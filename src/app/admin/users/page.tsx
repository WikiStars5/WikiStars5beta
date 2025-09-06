
"use client";

import { useState, useEffect, Suspense } from 'react';
import { callFirebaseFunction } from '@/lib/firebase';
import type { UserProfile } from '@/lib/types';
import AdminUsersPageClient from '@/components/admin/AdminUsersPageClient';
import { Loader2, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';


function AdminUsersPageComponent() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await callFirebaseFunction('getAllUsers');
        if (result.success) {
          setUsers(result.users);
        } else {
          throw new Error(result.error || 'Unknown error fetching users.');
        }
      } catch (err: any) {
        console.error("Failed to fetch users:", err);
        setError(err.message || "No se pudieron cargar los usuarios.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchUsers();
  }, []);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
            <CardTitle className="text-2xl font-headline">Gestionar Usuarios</CardTitle>
            <CardDescription>Ver y buscar usuarios registrados en la plataforma.</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-4 text-muted-foreground">Cargando usuarios...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
          <CardHeader>
              <CardTitle className="text-2xl font-headline">Gestionar Usuarios</CardTitle>
              <CardDescription>Ver y buscar usuarios registrados en la plataforma.</CardDescription>
          </CardHeader>
          <CardContent>
              <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Error de Carga</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
              </Alert>
          </CardContent>
      </Card>
    );
  }

  return <AdminUsersPageClient initialUsers={users} />;
}

export default function AdminUsersPage() {
    return (
        <Suspense>
            <AdminUsersPageComponent />
        </Suspense>
    )
}
