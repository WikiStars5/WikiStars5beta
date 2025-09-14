
"use client";

import { useState, useEffect } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, Save, UserCircle, ShieldAlert } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { CountryCombobox } from '@/components/shared/CountryCombobox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GENDER_OPTIONS } from '@/config/genderOptions';
import { useRouter } from 'next/navigation';
import { useLocalProfile } from '@/hooks/use-local-profile';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';

const profileSchema = z.object({
  username: z.string().min(3, 'El nombre debe tener al menos 3 caracteres.').max(30, 'El nombre no puede tener más de 30 caracteres.'),
  countryCode: z.string().optional(),
  gender: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { currentUser, firebaseUser, isAnonymous, isLoading, updateUserProfile } = useAuth();
  const { localProfile, saveLocalProfile } = useLocalProfile(firebaseUser?.uid);
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
    if (isLoading) return;
    
    if (isAnonymous) {
      if (localProfile) {
        reset({
          username: localProfile.username,
          countryCode: localProfile.countryCode,
          gender: localProfile.gender,
        });
      }
    } else if (currentUser) {
      reset({
        username: currentUser.username || '',
        countryCode: currentUser.countryCode || '',
        gender: currentUser.gender || '',
      });
    }
  }, [currentUser, localProfile, isAnonymous, isLoading, reset]);


  const onSubmit: SubmitHandler<ProfileFormValues> = async (data) => {
    if (!firebaseUser) {
        toast({ title: "Error", description: "No se ha podido identificar al usuario.", variant: "destructive" });
        return;
    }
    
    try {
        if (isAnonymous) {
            saveLocalProfile(data.username, data.countryCode || '', data.gender || '');
        } else {
            await updateUserProfile(data.username, data.countryCode || '', data.gender || '');
        }
        
        toast({
          title: "Perfil Guardado",
          description: "Tus cambios han sido guardados.",
        });
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error al Guardar",
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

  return (
    <div className="flex items-center justify-center">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl font-headline">
            <UserCircle className="h-7 w-7" />
            Mi Perfil
          </CardTitle>
          <CardDescription>
            {isAnonymous ? "Edita tu perfil de invitado. Tus datos se guardan localmente." : "Edita la información de tu perfil público."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isAnonymous && (
            <Alert className="mb-6 bg-blue-900/20 border-blue-500/50">
                <ShieldAlert className="h-4 w-4 text-blue-400" />
                <AlertTitle className="text-blue-300">Estás navegando como invitado</AlertTitle>
                <AlertDescription className="text-blue-400/80">
                   Tu progreso (votos, rachas) se guardará. Para mantenerlo permanentemente, <Link href="/signup" className="font-bold underline hover:text-blue-300">crea una cuenta</Link> para vincular tus datos.
                </AlertDescription>
            </Alert>
          )}

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
