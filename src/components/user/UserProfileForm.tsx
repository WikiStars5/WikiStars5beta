
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { UserProfile, Country } from '@/lib/types';
import { COUNTRIES } from '@/config/countries';
import { updateUserProfile } from '@/lib/userData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';

interface UserProfileFormProps {
  initialProfile: UserProfile;
}

const UserProfileForm: React.FC<UserProfileFormProps> = ({ initialProfile }) => {
  const router = useRouter();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);

  const [username, setUsername] = useState(initialProfile.username || '');
  const [selectedCountryCode, setSelectedCountryCode] = useState(initialProfile.countryCode || '');
  
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (initialProfile) {
      setUsername(initialProfile.username || '');
      setSelectedCountryCode(initialProfile.countryCode || '');
    }
  }, [initialProfile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || currentUser.isAnonymous) {
      setError("Debes iniciar sesión con una cuenta para guardar tu perfil.");
      return;
    }
    if (!username.trim()) {
      setError("El nombre de usuario no puede estar vacío.");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const selectedCountry = COUNTRIES.find(c => c.code === selectedCountryCode);
      const profileUpdateData: Partial<Pick<UserProfile, 'username' | 'country' | 'countryCode'>> = {
        username: username.trim(),
        country: selectedCountry ? selectedCountry.name : '',
        countryCode: selectedCountry ? selectedCountry.code : '',
      };

      await updateUserProfile(currentUser.uid, profileUpdateData);
      toast({
        title: "Perfil Actualizado",
        description: "Tu información de perfil ha sido guardada.",
      });
      router.refresh(); // Re-fetch server-side props, or consider client-side update
    } catch (err: any) {
      console.error("Error saving profile:", err);
      setError(err.message || "No se pudo guardar el perfil.");
      toast({
        title: "Error al Guardar",
        description: err.message || "No se pudo guardar el perfil.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (initialProfile) {
      setUsername(initialProfile.username || '');
      setSelectedCountryCode(initialProfile.countryCode || '');
    }
    setError(null);
  };

  if (!initialProfile) {
    // This case should ideally be handled by the parent page showing a loader or error
    return <p>Cargando perfil...</p>;
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-headline">Editar Perfil</CardTitle>
        <CardDescription>Actualiza tu nombre de usuario y país.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSave}>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="username">Nombre de Usuario</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Tu nombre público"
              required
              disabled={isSaving}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="country">País</Label>
            <Select
              value={selectedCountryCode}
              onValueChange={setSelectedCountryCode}
              disabled={isSaving}
            >
              <SelectTrigger id="country">
                <SelectValue placeholder="Selecciona tu país" />
              </SelectTrigger>
              <SelectContent position="popper" className="max-h-60">
                <SelectItem value="">No especificado</SelectItem>
                {COUNTRIES.map((country) => (
                  <SelectItem key={country.code} value={country.code}>
                    <span role="img" aria-label={country.name} className="mr-2">{country.emoji}</span>
                    {country.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Correo Electrónico (no editable)</Label>
            <Input
              id="email"
              value={initialProfile.email || 'No disponible'}
              disabled
              className="bg-muted"
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-end space-x-3">
          <Button type="button" variant="outline" onClick={handleCancel} disabled={isSaving}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {isSaving ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default UserProfileForm;
