
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
import { Loader2, User, LogOut, ShieldCheck, BellRing, Award, Eye, Star, Heart, MessageSquare, Reply, Share2, Edit, Save, BarChart3, Map, VenusAndMars } from 'lucide-react';
import { correctMalformedUrl } from '@/lib/utils';
import Link from 'next/link';
import { ADMIN_UID } from '@/config/admin';
import { Separator } from '@/components/ui/separator';
import type { UserProfile } from '@/lib/types';
import { useAuth } from '@/hooks/useAuth';
import { auth, db } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { CountryCombobox } from '@/components/shared/CountryCombobox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GENDER_OPTIONS } from '@/config/genderOptions';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '@/lib/firebase';

const achievementDetails = {
  first_glance: {
    icon: Eye,
    title: "Primer Vistazo",
    description: "Visitaste tu primer perfil.",
  },
  actitud_definida: {
    icon: Heart,
    title: "Actitud Definida",
    description: "Votaste por primera vez tu Actitud (Fan, Hater, etc).",
  },
  estrella_brillante: {
    icon: Star,
    title: "Estrella Brillante",
    description: "Emitiste tu primera calificación de estrellas.",
  },
  emocion_descubierta: {
    icon: Heart,
    title: "Emoción al Descubierto",
    description: "Votaste por primera vez una Emoción.",
  },
  compartiendo_verdad: {
    icon: Share2,
    title: "Compartiendo la Verdad",
    description: "Compartiste un perfil por primera vez.",
  },
  primera_contribucion: {
    icon: MessageSquare,
    title: "Mi Primera Contribución",
    description: "Dejaste tu primer comentario.",
  },
  dialogo_abierto: {
    icon: Reply,
    title: "Diálogo Abierto",
    description: "Respondiste a un comentario por primera vez.",
  },
};

type AchievementId = keyof typeof achievementDetails;

const profileFormSchema = z.object({
  username: z.string().min(3, "El nombre de usuario debe tener al menos 3 caracteres.").max(30, "El nombre de usuario no puede exceder los 30 caracteres."),
  countryCode: z.string().optional(),
  gender: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

interface UserStats {
  comments: number;
  ratings: number;
  attitudes: number;
}

const updateUserProfileCallable = httpsCallable(getFunctions(app), 'updateUserProfile');
const getUserStatsCallable = httpsCallable(getFunctions(app), 'getUserStats');

export default function ProfilePage() {
  const { user: currentUser, isLoading, firebaseUser } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [notificationPermission, setNotificationPermission] = useState('default');
  const [isEditing, setIsEditing] = useState(false);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  const { control, handleSubmit, reset, formState: { isSubmitting, errors } } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      username: '',
      countryCode: '',
      gender: '',
    },
  });

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  useEffect(() => {
    if (!isLoading && !currentUser) {
        toast({
          title: "Acceso Requerido",
          description: "Debes iniciar sesión para ver tu perfil.",
          variant: "destructive"
        });
        router.replace('/login?redirect=/profile');
    }
    
    if (currentUser) {
      reset({
        username: currentUser.username,
        countryCode: currentUser.countryCode || '',
        gender: currentUser.gender || '',
      });
      fetchUserStats();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, currentUser, router, toast, reset]);

  const fetchUserStats = async () => {
    if (!firebaseUser) return;
    setIsLoadingStats(true);
    try {
      const result = await getUserStatsCallable();
      const data = result.data as { success: boolean, stats?: UserStats, error?: string };
      if (data.success && data.stats) {
        setUserStats(data.stats);
      } else {
        console.error("Error fetching stats:", data.error);
      }
    } catch (error) {
      console.error("Failed to call getUserStats function:", error);
    } finally {
      setIsLoadingStats(false);
    }
  };
  
  const onSubmit = async (data: ProfileFormValues) => {
    try {
      await updateUserProfileCallable(data);
      toast({ title: "Perfil Actualizado", description: "Tus cambios han sido guardados." });
      setIsEditing(false);
      // The onSnapshot listener in useAuth will automatically update the UI.
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast({ title: "Error", description: error.message || "No se pudo actualizar tu perfil.", variant: "destructive" });
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({ title: "Sesión Cerrada", description: "Has cerrado sesión exitosamente." });
      router.push('/');
      router.refresh();
    } catch (error) {
      console.error("Error logging out from profile:", error);
      toast({ title: "Error", description: "No se pudo cerrar la sesión.", variant: "destructive" });
    }
  };

  const handleRequestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      toast({
        title: "No Soportado",
        description: "Tu navegador no soporta notificaciones push.",
        variant: "destructive",
      });
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);

      if (permission === 'granted') {
        toast({
          title: "¡Permiso Concedido!",
          description: "Todo listo para recibir notificaciones. El sistema registrará tu dispositivo.",
        });
      } else {
        toast({
          title: "Permiso Denegado",
          description: "Has bloqueado las notificaciones. Puedes cambiarlas en la configuración de tu navegador.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error durante la solicitud de permiso:', error);
      toast({
        title: "Error Inesperado",
        description: "Ocurrió un error al intentar activar las notificaciones.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentUser) {
    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
            <p>Redirigiendo a la página de inicio de sesión...</p>
        </div>
    );
  }

  const isAdmin = currentUser.uid === ADMIN_UID || currentUser.role === 'admin';
  const displayName = currentUser.username || currentUser.email?.split('@')[0] || "Usuario";
  
  return (
    <div className="flex justify-center items-start pt-10">
      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader className="items-center text-center">
          <Avatar className="h-24 w-24 mb-4">
            <AvatarImage src={correctMalformedUrl(currentUser.photoURL) || undefined} alt={displayName} />
            <AvatarFallback className="text-3xl">
              {displayName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <CardTitle className="text-3xl font-headline flex items-center gap-2">
            {displayName}
            {isAdmin && (
              <Link href="/admin" title="Ir al Panel de Administración">
                <ShieldCheck className="h-6 w-6 text-primary cursor-pointer"/>
              </Link>
            )}
          </CardTitle>
          <CardDescription>{currentUser.email}</CardDescription>
        </CardHeader>
        <CardContent className="p-6 border-t space-y-8">
        
          {/* User Stats Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2"><BarChart3 className="h-5 w-5"/>Tus Estadísticas</h3>
             {isLoadingStats ? (
                <div className="flex justify-center items-center h-24"><Loader2 className="h-6 w-6 animate-spin"/></div>
            ) : userStats ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 bg-muted/50 rounded-lg text-center">
                        <MessageSquare className="mx-auto h-6 w-6 mb-2 text-primary"/>
                        <p className="text-2xl font-bold">{userStats.comments}</p>
                        <p className="text-xs text-muted-foreground">Comentarios</p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg text-center">
                        <Star className="mx-auto h-6 w-6 mb-2 text-primary"/>
                        <p className="text-2xl font-bold">{userStats.ratings}</p>
                        <p className="text-xs text-muted-foreground">Calificaciones</p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg text-center">
                        <Heart className="mx-auto h-6 w-6 mb-2 text-primary"/>
                        <p className="text-2xl font-bold">{userStats.attitudes}</p>
                        <p className="text-xs text-muted-foreground">Votos de Actitud</p>
                    </div>
                </div>
            ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No se pudieron cargar tus estadísticas.</p>
            )}
          </div>

          <Separator />
        
          {/* Profile Edit Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold flex items-center gap-2"><User className="h-5 w-5"/>Tu Perfil</h3>
              {!isEditing && (
                <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                  <Edit className="mr-2 h-4 w-4"/>Editar
                </Button>
              )}
            </div>
            {isEditing ? (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 animate-in fade-in-50">
                <div>
                  <Label htmlFor="username">Nombre de Usuario</Label>
                  <Controller name="username" control={control} render={({ field }) => <Input id="username" {...field} />} />
                  {errors.username && <p className="text-xs text-destructive mt-1">{errors.username.message}</p>}
                </div>
                <div>
                  <Label htmlFor="countryCode">País</Label>
                  <Controller name="countryCode" control={control} render={({ field }) => <CountryCombobox value={field.value || ''} onChange={field.onChange} />} />
                </div>
                <div>
                  <Label htmlFor="gender">Sexo</Label>
                  <Controller name="gender" control={control} render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger id="gender"><SelectValue placeholder="Selecciona tu sexo" /></SelectTrigger>
                        <SelectContent>
                          {GENDER_OPTIONS.map((opt) => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                        </SelectContent>
                    </Select>
                  )} />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="ghost" onClick={() => { setIsEditing(false); reset({ username: currentUser.username, countryCode: currentUser.countryCode, gender: currentUser.gender }); }}>Cancelar</Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>}
                    Guardar Cambios
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2"><Map className="h-4 w-4"/>País: <span className="font-medium text-foreground">{currentUser.country || 'No especificado'}</span></div>
                <div className="flex items-center gap-2"><VenusAndMars className="h-4 w-4"/>Sexo: <span className="font-medium text-foreground">{GENDER_OPTIONS.find(g => g.value === currentUser.gender)?.label || 'No especificado'}</span></div>
              </div>
            )}
          </div>

          <Separator />
          
          <div className="space-y-4">
            <h3 className="text-base font-medium">Logros Desbloqueados</h3>
            {currentUser.achievements && currentUser.achievements.length > 0 ? (
              <div className="space-y-3">
                {currentUser.achievements.map((achId) => {
                  const details = achievementDetails[achId as AchievementId];
                  if (!details) return null;
                  const Icon = details.icon;
                  return (
                    <div key={achId} className="flex items-center gap-4 p-3 bg-muted/50 rounded-md">
                      <Icon className="h-8 w-8 text-primary flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-foreground">{details.title}</p>
                        <p className="text-sm text-muted-foreground">{details.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground text-center p-4 border-dashed border-2 rounded-md">
                <Award className="mx-auto h-8 w-8 mb-2" />
                <p>Aún no has desbloqueado ningún logro. ¡Empieza a explorar para ganar el primero!</p>
              </div>
            )}
          </div>

          <Separator />

          <Button onClick={handleLogout} className="w-full">
            <LogOut className="mr-2 h-4 w-4" />
            Cerrar Sesión
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
