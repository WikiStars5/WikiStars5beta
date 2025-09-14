
"use client";

import { useState, useEffect } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Save, Terminal, UserCircle } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { CountryCombobox } from '@/components/shared/CountryCombobox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GENDER_OPTIONS } from '@/config/genderOptions';
import { callFirebaseFunction } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

const profileSchema = z.object({
  username: z.string().min(3, 'El nombre debe tener al menos 3 caracteres.').max(30, 'El nombre no puede tener más de 30 caracteres.'),
  countryCode: z.string().optional(),
  gender: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { currentUser, firebaseUser, isLoading, isAdmin } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: '',
      countryCode: '',
      gender: '',
    },
  });

  const { handleSubmit, control, reset, formState: { isSubmitting } } = form;

  // Effect to populate form when user data is available
  useEffect(() => {
    if (!isLoading && (currentUser || firebaseUser?.isAnonymous)) {
      if (firebaseUser?.isAnonymous) {
        // Handle guest user from localStorage
        const guestUsername = localStorage.getItem('wikistars5-guestUsername') || 'Invitado';
        const guestCountryCode = localStorage.getItem('wikistars5-guestCountryCode') || '';
        const guestGender = localStorage.getItem('wikistars5-guestGender') || '';
        reset({
          username: guestUsername,
          countryCode: guestCountryCode,
          gender: guestGender,
        });
      } else if (currentUser) {
        // Handle registered user
        reset({
          username: currentUser.username || '',
          countryCode: currentUser.countryCode || '',
          gender: currentUser.gender || '',
        });
      }
    }
  }, [currentUser, firebaseUser, isLoading, reset]);


  const onSubmit: SubmitHandler<ProfileFormValues> = async (data) => {
    try {
      if (firebaseUser?.isAnonymous) {
        // Save guest data to localStorage
        localStorage.setItem('wikistars5-guestUsername', data.username);
        localStorage.setItem('wikistars5-guestCountryCode', data.countryCode || '');
        localStorage.setItem('wikistars5-guestGender', data.gender || '');
        toast({
          title: "Perfil de Invitado Actualizado",
          description: "Tus cambios han sido guardados en este navegador.",
        });
      } else if (firebaseUser) {
        // Save registered user data to Firestore via Cloud Function
        await callFirebaseFunction('updateUserProfile', {
          username: data.username,
          countryCode: data.countryCode || '',
          gender: data.gender || '',
        });
        toast({
          title: "Perfil Actualizado",
          description: "Tus cambios han sido guardados.",
        });
      }
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error al Actualizar",
        description: error.message || 'No se pudieron guardar los cambios.',
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-4 text-muted-foreground">Cargando perfil...</p>
      </div>
    );
  }

  if (!firebaseUser) {
    // Should not happen if page is protected, but as a fallback
    router.push('/login');
    return null;
  }

  return (
    <div className="flex items-center justify-center">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl font-headline">
            <UserCircle className="h-7 w-7" />
            Mi Perfil
          </CardTitle>
          <CardDescription>
            {firebaseUser.isAnonymous 
              ? "Edita tu información de invitado. Estos datos se guardan solo en tu navegador."
              : "Edita la información de tu perfil público."
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre de Usuario</FormLabel>
                    <FormControl>
                      <Input placeholder="Tu nombre público" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="countryCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>País</FormLabel>
                    <CountryCombobox
                      value={field.value || ''}
                      onChange={field.onChange}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sexo</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                       <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona tu sexo..." />
                          </SelectTrigger>
                       </FormControl>
                      <SelectContent>
                        {GENDER_OPTIONS.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
