

"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, User, LogOut, ShieldCheck, Save, UserPlus } from 'lucide-react';
import { correctMalformedUrl } from '@/lib/utils';
import Link from 'next/link';
import type { UserProfile } from '@/lib/types';
import { useAuth } from '@/hooks/useAuth';
import { app } from '@/lib/firebase';
import { updateProfile } from 'firebase/auth';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { CountryCombobox } from '@/components/shared/CountryCombobox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GENDER_OPTIONS } from '@/config/genderOptions';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const profileFormSchema = z.object({
  username: z.string().min(3, "El nombre de usuario debe tener al menos 3 caracteres.").max(30, "El nombre de usuario no puede exceder los 30 caracteres."),
  countryCode: z.string().optional(),
  gender: z.string().optional(),
});
type ProfileFormValues = z.infer<typeof profileFormSchema>;

const updateUserProfileCallable = httpsCallable(getFunctions(app, 'us-central1'), 'updateUserProfile');


export default function ProfilePage() {
  const { user: firestoreUser, isLoading, isAnonymous, logout, firebaseUser } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const { control, handleSubmit, reset, formState: { isSubmitting, errors } } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: { username: '', countryCode: '', gender: '' },
  });

  useEffect(() => {
    if (!isLoading && firestoreUser) {
      reset({
        username: firestoreUser.username ?? '',
        countryCode: firestoreUser.countryCode ?? '',
        gender: firestoreUser.gender ?? '',
      });
    }
  }, [isLoading, firestoreUser, reset]);


  const onProfileSubmit = async (data: ProfileFormValues) => {
    if (isAnonymous || !firestoreUser || !firebaseUser) return;
    try {
      await updateUserProfileCallable(data);
      if (firebaseUser) {
        await updateProfile(firebaseUser, { displayName: data.username });
      }
      toast({ title: "Perfil Actualizado", description: "Tus cambios han sido guardados." });
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast({ title: "Error", description: error.message || "No se pudo actualizar tu perfil.", variant: "destructive" });
    }
  };

  const handleGuestProfileSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isAnonymous) return;
    const formData = new FormData(e.currentTarget);
    const username = formData.get('username') as string;
    const countryCode = formData.get('countryCode') as string;
    const gender = formData.get('gender') as string;
    
    if (username.length < 3) {
      toast({ title: "Nombre muy corto", description: "El nombre de usuario debe tener al menos 3 caracteres.", variant: "destructive" });
      return;
    }
    
    localStorage.setItem('wikistars5-guestUsername', username);
    localStorage.setItem('wikistars5-guestCountryCode', countryCode);
    localStorage.setItem('wikistars5-guestGender', gender);
    toast({ title: "Perfil de Invitado Guardado", description: "Tus preferencias se han guardado en este navegador."});
    router.refresh();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (isAnonymous) {
     return (
        <div className="space-y-8">
            <Card className="max-w-lg mx-auto">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-headline">Perfil de Invitado</CardTitle>
                    <CardDescription>
                        Estás navegando como invitado. Tus datos se guardan solo en este navegador. Para un perfil permanente, crea una cuenta.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleGuestProfileSave} className="space-y-4">
                        <div>
                            <Label htmlFor="username">Nombre de Invitado</Label>
                            <Input id="username" name="username" defaultValue={typeof window !== 'undefined' ? localStorage.getItem('wikistars5-guestUsername') || '' : ''} required />
                        </div>
                        <div>
                            <Label htmlFor="countryCode">País</Label>
                            <Controller
                                name="countryCode"
                                control={control}
                                render={({ field }) => (
                                    <CountryCombobox
                                        value={typeof window !== 'undefined' ? localStorage.getItem('wikistars5-guestCountryCode') || field.value || '' : ''}
                                        onChange={field.onChange}
                                    />
                                )}
                            />
                        </div>
                         <div>
                            <Label htmlFor="gender">Sexo</Label>
                            <Select name="gender" defaultValue={typeof window !== 'undefined' ? localStorage.getItem('wikistars5-guestGender') || '' : ''}>
                                <SelectTrigger id="gender"><SelectValue placeholder="Selecciona tu sexo" /></SelectTrigger>
                                <SelectContent>{GENDER_OPTIONS.map((opt) => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                           <Button type="submit" className="w-full"><Save className="mr-2 h-4 w-4"/> Guardar Perfil</Button>
                           <Button asChild variant="secondary" className="w-full">
                            <Link href="/signup"><UserPlus className="mr-2 h-4 w-4"/> Crear Cuenta</Link>
                           </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
  }

  if (!firestoreUser) {
     return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center p-4">
             <Card className="max-w-md">
                <CardHeader>
                    <AlertTitle>Error al Cargar Perfil</AlertTitle>
                    <AlertDescription>
                        No pudimos cargar los datos de tu perfil. Por favor, intenta refrescar la página. Si el problema persiste, contacta a soporte.
                    </AlertDescription>
                </CardHeader>
                <CardContent>
                    <Button onClick={() => window.location.reload()}>Refrescar Página</Button>
                </CardContent>
            </Card>
        </div>
    );
  }

  const isAdmin = firestoreUser.role === 'admin';
  const displayName = firestoreUser.username || "Usuario";

  return (
    <div className="space-y-8">
      <Card className="w-full shadow-xl overflow-hidden border border-white/20 bg-black">
        <CardHeader className="items-center text-center p-6">
          <Avatar className="h-24 w-24 mb-4 border-2 border-primary">
            <AvatarImage src={correctMalformedUrl(firestoreUser.photoURL) || undefined} alt={displayName} />
            <AvatarFallback className="text-3xl">
              {displayName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <CardTitle className="text-3xl font-headline flex items-center gap-2">
            {displayName}
            {isAdmin && (
              <Link href="/admin" title="Ir al Panel de Administración">
                <ShieldCheck className="h-6 w-6 text-primary cursor-pointer hover:text-primary/80 transition-colors"/>
              </Link>
            )}
          </CardTitle>
          <CardDescription>{firestoreUser.email}</CardDescription>
        </CardHeader>
      </Card>
      
      <div className="w-full mt-6">
          <Card className="border border-white/20 bg-black">
            <CardHeader className="flex flex-row justify-between items-start">
              <div>
                  <CardTitle>Tu Información</CardTitle>
                  <CardDescription>Edita los datos de tu perfil. Se guardarán en tu cuenta de forma permanente.</CardDescription>
              </div>
              <form onSubmit={handleSubmit(onProfileSubmit)}>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>}
                  Guardar Cambios
                </Button>
              </form>
            </CardHeader>
            <CardContent className="space-y-8">
                <form onSubmit={handleSubmit(onProfileSubmit)} className="space-y-4 animate-in fade-in-50">
                  <div>
                    <Label htmlFor="username">Nombre de Usuario</Label>
                    <Controller name="username" control={control} render={({ field }) => <Input id="username" {...field} />} />
                    {errors.username && <p className="text-xs text-destructive mt-1">{errors.username.message}</p>}
                  </div>
                  <div>
                    <Label htmlFor="countryCode">País</Label>
                    <Controller name="countryCode" control={control} render={({ field }) => <CountryCombobox value={field.value ?? ''} onChange={field.onChange} />} />
                  </div>
                  <div>
                    <Label htmlFor="gender">Sexo</Label>
                    <Controller name="gender" control={control} render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value ?? ''}>
                        <SelectTrigger id="gender"><SelectValue placeholder="Selecciona tu sexo" /></SelectTrigger>
                        <SelectContent>{GENDER_OPTIONS.map((opt) => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
                      </Select>
                    )} />
                  </div>
                </form>
              <Separator />
              <Button onClick={logout} variant="destructive" className="w-full sm:w-auto"><LogOut className="mr-2 h-4 w-4" />Cerrar Sesión</Button>
            </CardContent>
          </Card>
      </div>
    </div>
  );
}
