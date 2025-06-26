
"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search as SearchIcon, User } from "lucide-react";
import type { UserProfile } from "@/lib/types";
import { GENDER_OPTIONS } from "@/config/genderOptions";
import { correctMalformedUrl } from '@/lib/utils';

interface AdminUsersPageClientProps {
  initialUsers: UserProfile[];
}

export default function AdminUsersPageClient({ initialUsers }: AdminUsersPageClientProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const processedUsers = useMemo(() => {
    const realUsers = initialUsers.filter(user => user.email);
    realUsers.sort((a, b) => a.username.localeCompare(b.username));
    return realUsers;
  }, [initialUsers]);

  const filteredUsers = useMemo(() => {
    if (!searchTerm) {
      return processedUsers;
    }
    return processedUsers.filter(
      (user) =>
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [processedUsers, searchTerm]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (e) {
      return 'Fecha inválida';
    }
  };

  const getGenderLabel = (genderValue?: string) => {
    if (!genderValue) return 'No especificado';
    const option = GENDER_OPTIONS.find(opt => opt.value === genderValue);
    return option ? option.label : 'No especificado';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-headline">Gestionar Usuarios</CardTitle>
        <CardDescription>Ver y buscar usuarios registrados en la plataforma. Los usuarios anónimos no se muestran aquí.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              type="search"
              placeholder="Buscar usuarios por nombre o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full sm:w-[350px] h-10 text-sm rounded-md shadow-sm border-input focus:ring-1 focus:ring-primary/50 bg-card"
            />
          </div>
        </div>

        {filteredUsers.length > 0 ? (
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px] p-3"></TableHead>
                  <TableHead className="p-3">Nombre de Usuario</TableHead>
                  <TableHead className="p-3">Email</TableHead>
                  <TableHead className="p-3">País</TableHead>
                  <TableHead className="p-3">Sexo</TableHead>
                  <TableHead className="text-center p-3">Rol</TableHead>
                  <TableHead className="text-right p-3">Último Acceso</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.uid}>
                    <TableCell className="p-2">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={correctMalformedUrl(user.photoURL) || undefined} alt={user.username} data-ai-hint="user avatar" />
                        <AvatarFallback>
                          {user.username ? user.username.charAt(0).toUpperCase() : <User />}
                        </AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell className="font-medium p-3">{user.username}</TableCell>
                    <TableCell className="text-sm text-muted-foreground p-3">{user.email}</TableCell>
                    <TableCell className="text-sm text-muted-foreground p-3">{user.country || 'No especificado'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground p-3">{getGenderLabel(user.gender)}</TableCell>
                    <TableCell className="text-center p-3">
                      <Badge variant={user.role === 'admin' ? 'destructive' : 'secondary'}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground p-3">
                      {formatDate(user.lastLoginAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">
            {searchTerm ? "No se encontraron usuarios." : "No hay usuarios registrados con perfiles en Firestore."}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
