
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
import { Loader2, User, LogOut, ShieldCheck, Award, Flame, Heart, MessageSquare, Edit, Save, BarChart3, Map, VenusAndMars, Smile, UserPlus, Link2 } from 'lucide-react';
import { correctMalformedUrl } from '@/lib/utils';
import Link from 'next/link';
import { ADMIN_UID } from '@/config/admin';
import { Separator } from '@/components/ui/separator';
import type { UserProfile, LocalUserStreak } from '@/lib/types';
import { useAuth } from '@/hooks/useAuth';
import { auth, app } from '@/lib/firebase';
import { signOut, linkWithCredential, EmailAuthProvider, updateProfile } from 'firebase/auth';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { CountryCombobox } from '@/components/shared/CountryCombobox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GENDER_OPTIONS } from '@/config/genderOptions';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import Image from 'next/image';
import { StreakAnimation } from '@/components/shared/StreakAnimation';

const achievementDetails = {
  first_glance: { icon: User, title: "Primer Vistazo", description: "Visitaste tu primer perfil." },
  actitud_definida: { icon: Heart, title: "Actitud Definida", description: "Votaste por primera vez tu Actitud." },
  estrella_brillante: { icon: BarChart3, title: "Estrella Brillante", description: "Emitiste tu primera calificación." },
  emocion_descubierta: { icon: Smile, title: "Emoción al Descubierto", description: "Votaste por primera vez una Emoción." },
  compartiendo_verdad: { icon: BarChart3, title: "Compartiendo la Verdad", description: "Compartiste un perfil." },
  primera_contribucion: { icon: MessageSquare, title: "Mi Primera Contribución", description: "Dejaste tu primer comentario." },
  dialogo_abierto: { icon: BarChart3, title: "Diálogo Abierto", description: "Respondiste a un comentario." },
};

type AchievementId = keyof typeof achievementDetails;

const profileFormSchema = z.object({
  username: z.string().min(3, "El nombre de usuario debe tener al menos 3 caracteres.").max(30, "El nombre de usuario no puede exceder los 30 caracteres."),
  countryCode: z.string().optional(),
  gender: z.string().optional(),
});
type ProfileFormValues = z.infer<typeof profileFormSchema>;

const linkAccountFormSchema = z.object({
  email: z.string().email("Correo electrónico no válido."),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres."),
  username: z.string().min(3, "El nombre de usuario debe tener al menos 3 caracteres.").max(30, "No puede exceder los 30 caracteres."),
});
type LinkAccountFormValues = z.infer<typeof linkAccountFormSchema>;

const updateUserProfileCallable = httpsCallable(getFunctions(app, 'us-central1'), 'updateUserProfile');
const getUserStatsCallable = httpsCallable(getFunctions(app, 'us-central1'), 'getUserStats');

export default function ProfilePage() {
  const { user: currentUser, firebaseUser, isLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [userStats, setUserStats] = useState<{ comments: number; ratings: number; attitudes: number } | null>(null);
  const [streaks, setStreaks] = useState<LocalUserStreak[]>([]);
  const [isStreaksLoading, setIsStreaksLoading] = useState(true);
  const [isLinking, setIsLinking] = useState(false);
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [animationStreak, setAnimationStreak] = useState<number | null>(null);
  const isAnonymous = currentUser?.isAnonymous ?? false;
  
  const { control, handleSubmit, reset, formState: { isSubmitting, errors } } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: { username: '', countryCode: '', gender: '' },
  });

  const { control: linkControl, handleSubmit: handleLinkSubmit, formState: { errors: linkErrors }, reset: resetLink } = useForm<LinkAccountFormValues>({
    resolver: zodResolver(linkAccountFormSchema),
    defaultValues: { email: '', password: '', username: ''}
  });
  
  useEffect(() => {
    if (!isLoading && currentUser) {
      reset({
        username: currentUser.username ?? '',
        countryCode: currentUser.countryCode ?? '',
        gender: currentUser.gender ?? '',
      });
      
      if (!isAnonymous) {
          getUserStatsCallable().then(result => {
            const data = result.data as { success: boolean; stats?: any };
            if (data.success) {
              setUserStats(data.stats);
            }
          }).catch(err => console.error("Error fetching user stats:", err));
      } else {
          setUserStats(null);
      }
      
      setIsStreaksLoading(true);
      try {
          const streaksJSON = localStorage.getItem('wikistars5-userStreaks');
          if(streaksJSON) {
              const localStreaks: LocalUserStreak[] = JSON.parse(streaksJSON);
              localStreaks.sort((a, b) => b.currentStreak - a.currentStreak);
              setStreaks(localStreaks);
          } else {
              setStreaks([]);
          }
      } catch (error) {
          console.error("Error loading streaks from localStorage", error);
          setStreaks([]);
      } finally {
          setIsStreaksLoading(false);
      }

    }
  }, [isLoading, currentUser, reset, isAnonymous]);

  useEffect(() => {
    if (isLinkDialogOpen && currentUser?.username) {
        resetLink({ username: currentUser.username });
    }
  }, [isLinkDialogOpen, currentUser, resetLink]);

  const onProfileSubmit = async (data: ProfileFormValues) => {
    try {
      await updateUserProfileCallable(data);
      if (firebaseUser) {
        await updateProfile(firebaseUser, { displayName: data.username });
      }
      toast({ title: "Perfil Actualizado", description: "Tus cambios han sido guardados." });
      setIsEditing(false);
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast({ title: "Error", description: error.message || "No se pudo actualizar tu perfil.", variant: "destructive" });
    }
  };
  
  const onLinkAccountSubmit = async (data: LinkAccountFormValues) => {
    if (!firebaseUser || !isAnonymous) {
      toast({ title: "Error", description: "Solo las cuentas de invitado pueden ser vinculadas.", variant: "destructive" });
      return;
    }
    setIsLinking(true);
    try {
      const credential = EmailAuthProvider.credential(data.email, data.password);
      await linkWithCredential(firebaseUser, credential);
      await updateUserProfileCallable({ username: data.username });
      await updateProfile(firebaseUser, { displayName: data.username });

      toast({
        title: "¡Cuenta Vinculada!",
        description: "Tu progreso ha sido guardado de forma segura.",
      });
      setIsLinkDialogOpen(false);
      resetLink();
    } catch (error: any) {
      console.error("Error linking account:", error);
      let message = "No se pudo vincular la cuenta.";
      if (error.code === 'auth/email-already-in-use') {
        message = 'Este correo electrónico ya está en uso por otra cuenta.';
      } else if (error.code === 'auth/credential-already-in-use') {
         message = 'Esta cuenta ya está vinculada a otro usuario. Intenta iniciar sesión.';
      } else if (error.code === 'auth/weak-password') {
         message = 'La contraseña es demasiado débil. Debe tener al menos 6 caracteres.';
      }
      toast({ title: "Error al Vincular", description: message, variant: "destructive" });
    } finally {
      setIsLinking(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({ title: "Sesión Cerrada", description: "Has cerrado sesión exitosamente." });
      router.push('/');
    } catch (error) {
      console.error("Error logging out from profile:", error);
      toast({ title: "Error", description: "No se pudo cerrar la sesión.", variant: "destructive" });
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
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center p-4">
            <Alert variant="destructive">
                <ShieldCheck className="h-4 w-4" />
                <AlertTitle>Error al Cargar Perfil</AlertTitle>
                <AlertDescription>
                    No se pudo cargar la información del perfil. Por favor, intenta recargar la página.
                </AlertDescription>
            </Alert>
        </div>
    );
  }

  const isAdmin = !isAnonymous && (currentUser.uid === ADMIN_UID || currentUser.role === 'admin');
  const displayName = currentUser.username || (isAnonymous ? "Invitado" : "Usuario");
  
  const StatCard = ({ icon, value, label }: { icon: React.ElementType; value: number | undefined; label: string; }) => {
    const Icon = icon;
    return (
      <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
        <Icon className="h-8 w-8 text-primary" />
        <div>
          <p className="text-2xl font-bold">{typeof value === 'number' ? value : <Loader2 className="h-5 w-5 animate-spin"/>}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </div>
    );
  };
  
  const renderProfileForGuest = () => (
    <Tabs defaultValue="estadisticas" className="w-full mt-6">
        <TabsList className="items-center justify-center rounded-md bg-muted p-1 text-muted-foreground grid w-full grid-cols-4 h-auto">
            <TabsTrigger value="estadisticas"><BarChart3 className="mr-2" />Estadísticas</TabsTrigger>
            <TabsTrigger value="logros"><Award className="mr-2" />Logros</TabsTrigger>
            <TabsTrigger value="rachas"><Flame className="mr-2" />Rachas</TabsTrigger>
            <TabsTrigger value="actitud"><Heart className="mr-2" />Mi actitud</TabsTrigger>
        </TabsList>
        <TabsContent value="estadisticas" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Estadísticas de Invitado</CardTitle>
              </CardHeader>
              <CardContent>
                <Alert>
                  <BarChart3 className="h-4 w-4" />
                  <AlertTitle>Estadísticas en Desarrollo</AlertTitle>
                  <AlertDescription>
                    Las estadísticas de comentarios y votos para invitados estarán disponibles pronto.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="logros" className="mt-6">
             <Card>
                <CardHeader>
                    <CardTitle>Logros Desbloqueados</CardTitle>
                    <CardDescription>Tus medallas ganadas por participar como invitado.</CardDescription>
                </CardHeader>
                <CardContent>
                {(currentUser.achievements && currentUser.achievements.length > 0) ? (
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
                    <div className="text-sm text-muted-foreground text-center p-8 border-dashed border-2 rounded-md">
                        <Award className="mx-auto h-8 w-8 mb-2" />
                        <p>Aún no has desbloqueado ningún logro. ¡Empieza a explorar para ganar el primero!</p>
                    </div>
                  )}
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="rachas" className="mt-6">
            <Card>
                <CardHeader>
                    <CardTitle>Rachas de Actividad</CardTitle>
                    <CardDescription>Tu historial de participación y rachas. ¡Gana una racha comentando o respondiendo en el perfil de un personaje por días consecutivos!</CardDescription>
                </CardHeader>
                <CardContent>
                  {isStreaksLoading ? (
                      <div className="flex justify-center items-center py-10">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                  ) : streaks.length > 0 ? (
                      <div className="space-y-4">
                          {streaks.map(streak => (
                              <Link key={streak.figureId} href={`/figures/${streak.figureId}`} className="flex items-center gap-4 p-3 bg-muted/50 rounded-md hover:bg-muted transition-colors">
                                  <Avatar className="h-12 w-12">
                                      <AvatarImage src={correctMalformedUrl(streak.figurePhotoUrl) || undefined} alt={streak.figureName} />
                                      <AvatarFallback>{streak.figureName.charAt(0)}</AvatarFallback>
                                  </Avatar>
                                  <div className="flex-grow">
                                      <p className="font-semibold">{streak.figureName}</p>
                                      <p className="text-sm text-muted-foreground">Último comentario: {new Date(streak.lastCommentDate).toLocaleDateString()}</p>
                                  </div>
                                  <div className="flex items-center gap-2 text-orange-500 font-bold">
                                      <Flame className="h-5 w-5"/>
                                      <span>{streak.currentStreak}</span>
                                  </div>
                              </Link>
                          ))}
                      </div>
                  ) : (
                     <div className="text-sm text-muted-foreground text-center p-8 border-dashed border-2 rounded-md">
                          <Flame className="mx-auto h-8 w-8 mb-2" />
                          <p>Aún no tienes ninguna racha. ¡Comenta en el perfil de un personaje para empezar una!</p>
                      </div>
                  )}
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="actitud" className="mt-6">
             <Card>
                <CardHeader>
                  <CardTitle>Mis Actitudes</CardTitle>
                  <CardDescription>
                    Aquí podrás ver un resumen de todas tus actitudes hacia los diferentes personajes.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-4 gap-2">
                        <Card className="p-4 text-center">
                            <CardTitle className="text-base">Neutral</CardTitle>
                        </Card>
                        <Card className="p-4 text-center">
                            <CardTitle className="text-base">Fan</CardTitle>
                        </Card>
                        <Card className="p-4 text-center">
                             <CardTitle className="text-base">Simp</CardTitle>
                        </Card>
                        <Card className="p-4 text-center">
                             <CardTitle className="text-base">Hater</CardTitle>
                        </Card>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
    </Tabs>
  );

  const renderProfileForRegisteredUser = () => (
       <Tabs defaultValue="stats" className="w-full mt-6">
            <TabsList className="grid w-full grid-cols-4 h-auto">
                <TabsTrigger value="stats"><BarChart3 className="mr-2" />Estadísticas</TabsTrigger>
                <TabsTrigger value="logros"><Award className="mr-2" />Logros</TabsTrigger>
                <TabsTrigger value="rachas"><Flame className="mr-2" />Rachas</TabsTrigger>
                <TabsTrigger value="informacion"><User className="mr-2" />Información</TabsTrigger>
            </TabsList>
            
            <TabsContent value="stats" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Tus Estadísticas</CardTitle>
                    <CardDescription>Resumen de tu actividad en la plataforma.</CardDescription>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <StatCard icon={MessageSquare} value={userStats?.comments} label="Comentarios" />
                      <StatCard icon={BarChart3} value={userStats?.ratings} label="Calificaciones" />
                      <StatCard icon={Heart} value={userStats?.attitudes} label="Votos de Actitud" />
                  </CardContent>
                </Card>
            </TabsContent>
            
            <TabsContent value="logros" className="mt-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Logros Desbloqueados</CardTitle>
                        <CardDescription>Tus medallas e insignias ganadas por participar.</CardDescription>
                    </CardHeader>
                    <CardContent>
                    {(currentUser.achievements && currentUser.achievements.length > 0) ? (
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
                        <div className="text-sm text-muted-foreground text-center p-8 border-dashed border-2 rounded-md">
                            <Award className="mx-auto h-8 w-8 mb-2" />
                            <p>Aún no has desbloqueado ningún logro. ¡Empieza a explorar para ganar el primero!</p>
                        </div>
                      )}
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="rachas" className="mt-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Rachas de Actividad</CardTitle>
                        <CardDescription>Tu historial de participación y rachas. ¡Gana una racha comentando o respondiendo en el perfil de un personaje por días consecutivos!</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isStreaksLoading ? (
                            <div className="flex justify-center items-center py-10">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : streaks.length > 0 ? (
                            <div className="space-y-4">
                                {streaks.map(streak => (
                                    <Link key={streak.figureId} href={`/figures/${streak.figureId}`} className="flex items-center gap-4 p-3 bg-muted/50 rounded-md hover:bg-muted transition-colors">
                                        <Avatar className="h-12 w-12">
                                            <AvatarImage src={correctMalformedUrl(streak.figurePhotoUrl) || undefined} alt={streak.figureName} />
                                            <AvatarFallback>{streak.figureName.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-grow">
                                            <p className="font-semibold">{streak.figureName}</p>
                                            <p className="text-sm text-muted-foreground">Último comentario: {new Date(streak.lastCommentDate).toLocaleDateString()}</p>
                                        </div>
                                        <div className="flex items-center gap-2 text-orange-500 font-bold">
                                            <Flame className="h-5 w-5"/>
                                            <span>{streak.currentStreak}</span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                           <div className="text-sm text-muted-foreground text-center p-8 border-dashed border-2 rounded-md">
                                <Flame className="mx-auto h-8 w-8 mb-2" />
                                <p>Aún no tienes ninguna racha. ¡Comenta en el perfil de un personaje para empezar una!</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="informacion" className="mt-6">
                <Card>
                  <CardHeader className="flex flex-row justify-between items-start">
                    <div>
                        <CardTitle>Tu Información</CardTitle>
                        <CardDescription>Edita los datos públicos de tu perfil.</CardDescription>
                    </div>
                    {!isEditing && <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}><Edit className="mr-2 h-4 w-4"/>Editar</Button>}
                  </CardHeader>
                  <CardContent className="space-y-8">
                    {isEditing ? (
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
                        <div className="flex justify-end gap-2 pt-2">
                          <Button variant="ghost" onClick={() => setIsEditing(false)} disabled={isSubmitting}>Cancelar</Button>
                          <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>}
                            Guardar Cambios
                          </Button>
                        </div>
                      </form>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center gap-4"><User className="h-5 w-5 text-muted-foreground"/><p>{currentUser.username}</p></div>
                            <div className="flex items-center gap-4"><Map className="h-5 w-5 text-muted-foreground"/><p>{currentUser.country || 'No especificado'}</p></div>
                            <div className="flex items-center gap-4"><VenusAndMars className="h-5 w-5 text-muted-foreground"/><p>{GENDER_OPTIONS.find(g => g.value === currentUser.gender)?.label || 'No especificado'}</p></div>
                        </div>
                    )}
                    <Separator />
                    <Button onClick={handleLogout} variant="destructive" className="w-full sm:w-auto"><LogOut className="mr-2 h-4 w-4" />Cerrar Sesión</Button>
                  </CardContent>
                </Card>
            </TabsContent>

        </Tabs>
  );

  return (
    <div className="space-y-8">
       <StreakAnimation 
        streakCount={animationStreak}
        isOpen={animationStreak !== null}
        onClose={() => setAnimationStreak(null)}
      />
      <Card className="w-full shadow-xl overflow-hidden">
        <CardHeader className="items-center text-center p-6 bg-muted/30">
          <Avatar className="h-24 w-24 mb-4 border-2 border-primary">
            <AvatarImage src={correctMalformedUrl(currentUser.photoURL) || undefined} alt={displayName} />
            <AvatarFallback className="text-3xl">
              {isAnonymous ? <User className="h-10 w-10"/> : displayName.charAt(0).toUpperCase()}
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
          <CardDescription>{isAnonymous ? 'Perfil de Invitado' : currentUser.email}</CardDescription>
        </CardHeader>
        {isAnonymous && (
            <CardContent className="p-4 bg-primary/10 text-center">
                 <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
                    <DialogTrigger asChild>
                         <Button>
                           <Link2 className="mr-2 h-4 w-4" />
                           Vincular Cuenta y Guardar Progreso
                         </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Vincular Cuenta</DialogTitle>
                          <DialogDescription>
                            Crea una cuenta permanente para guardar tu progreso y acceder desde cualquier dispositivo.
                          </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleLinkSubmit(onLinkAccountSubmit)} className="space-y-4">
                           <div>
                               <Label htmlFor="link-username">Nombre de Usuario</Label>
                               <Controller name="username" control={linkControl} render={({ field }) => <Input id="link-username" {...field} />} />
                               {linkErrors.username && <p className="text-xs text-destructive mt-1">{linkErrors.username.message}</p>}
                           </div>
                           <div>
                               <Label htmlFor="link-email">Correo Electrónico</Label>
                               <Controller name="email" control={linkControl} render={({ field }) => <Input id="link-email" type="email" {...field} />} />
                               {linkErrors.email && <p className="text-xs text-destructive mt-1">{linkErrors.email.message}</p>}
                           </div>
                           <div>
                               <Label htmlFor="link-password">Contraseña</Label>
                               <Controller name="password" control={linkControl} render={({ field }) => <Input id="link-password" type="password" {...field} />} />
                               {linkErrors.password && <p className="text-xs text-destructive mt-1">{linkErrors.password.message}</p>}
                           </div>
                           <Button type="submit" className="w-full" disabled={isLinking}>
                                {isLinking ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Link2 className="mr-2 h-4 w-4"/>}
                                {isLinking ? 'Vinculando...' : 'Vincular Cuenta'}
                           </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </CardContent>
        )}
      </Card>
      
      {isAnonymous ? renderProfileForGuest() : renderProfileForRegisteredUser()}

    </div>
  );
}
