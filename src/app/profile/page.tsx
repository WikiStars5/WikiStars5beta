
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, Save, UserCircle, ShieldAlert, Edit, X, Bell, BellOff } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { CountryCombobox } from '@/components/shared/CountryCombobox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GENDER_OPTIONS } from '@/config/genderOptions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ProfileActivity } from '@/components/profile/ProfileActivity';

const profileSchema = z.object({
  username: z.string().min(3, 'El nombre debe tener al menos 3 caracteres.').max(30, 'El nombre no puede tener más de 30 caracteres.'),
  countryCode: z.string().optional(),
  gender: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { 
    currentUser, 
    isAnonymous, 
    isLoading, 
    updateUserProfile, 
    localProfile,
    isNotificationsEnabled,
    requestNotificationPermission,
  } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: '',
      countryCode: '',
      gender: '',
    },
  });

  const { handleSubmit, control, reset, formState: { isSubmitting } } = form;

  const populateForm = useCallback(() => {
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
  }, [isAnonymous, localProfile, currentUser, reset]);

  // Effect to populate form when user data is available
  useEffect(() => {
    if (isLoading) return;
    populateForm();
  }, [currentUser, localProfile, isAnonymous, isLoading, populateForm]);


  const onSubmit: SubmitHandler<ProfileFormValues> = async (data) => {
    try {
        await updateUserProfile(data.username, data.countryCode || '', data.gender || '');
        
        toast({
          title: "Perfil Guardado",
          description: "Tus cambios han sido guardados.",
        });
        setIsEditing(false);
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error al Guardar",
        description: error.message || 'No se pudieron guardar los cambios.',
        variant: "destructive",
      });
    }
  };
  
  const handleCancel = () => {
      populateForm(); // Revert changes to original values
      setIsEditing(false);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-4 text-muted-foreground">Cargando perfil...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
        <CardHeader className="px-0">
          <CardTitle className="flex items-center gap-2 text-3xl font-headline">
            <UserCircle className="h-8 w-8" />
            Mi Perfil
          </CardTitle>
          <CardDescription>
            {isAnonymous ? "Gestiona tu perfil de invitado y tu actividad en la plataforma." : "Gestiona tu perfil público y tu actividad en la plataforma."}
          </CardDescription>
        </CardHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-8">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-xl">Mi Información</CardTitle>
                        {!isEditing && (
                            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                            </Button>
                        )}
                    </CardHeader>
                    <CardContent>
                      {isAnonymous && (
                        <Alert className="mb-6 bg-blue-900/20 border-blue-500/50">
                            <ShieldAlert className="h-4 w-4 text-blue-400" />
                            <AlertTitle className="text-blue-300">Estás navegando como invitado</AlertTitle>
                            <AlertDescription className="text-blue-400/80">
                               Tu progreso (votos, rachas, etc.) se guarda únicamente en este dispositivo.
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
                                  <Input placeholder="Tu nombre público" {...field} disabled={!isEditing || isSubmitting} />
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
                                  disabled={!isEditing || isSubmitting}
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
                                <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value} disabled={!isEditing || isSubmitting}>
                                   <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Selecciona tu sexo..." />
                                      </SelectTrigger>
                                   </FormControl>
                                  <SelectContent>
                                    {GENDER_OPTIONS.filter(option => option.value === 'male' || option.value === 'female').map(option => (
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
                          {isEditing && (
                            <div className="flex justify-end gap-2">
                                <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
                                    <X className="mr-2 h-4 w-4" />
                                    Cancelar
                                </Button>
                                <Button type="submit" disabled={isSubmitting}>
                                  {isSubmitting ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  ) : (
                                    <Save className="mr-2 h-4 w-4" />
                                  )}
                                  {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
                                </Button>
                            </div>
                          )}
                        </form>
                      </Form>
                    </CardContent>
                </Card>

                 {!isAnonymous && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-xl">Notificaciones</CardTitle>
                        </CardHeader>
                        <CardContent>
                             <Button
                                onClick={requestNotificationPermission}
                                disabled={isLoading}
                                className="w-full"
                                variant={isNotificationsEnabled ? "secondary" : "default"}
                            >
                                {isNotificationsEnabled ? (
                                    <>
                                        <BellOff className="mr-2 h-4 w-4" />
                                        Desactivar Notificaciones Push
                                    </>
                                ) : (
                                    <>
                                        <Bell className="mr-2 h-4 w-4" />
                                        Activar Notificaciones Push
                                    </>
                                )}
                            </Button>
                            <p className="text-xs text-muted-foreground mt-2">
                                Recibe un aviso si estás a punto de perder tu racha.
                            </p>
                        </CardContent>
                    </Card>
                )}

            </div>
            
            <div className="lg:col-span-2">
                <ProfileActivity />
            </div>
        </div>
    </div>
  );
}
