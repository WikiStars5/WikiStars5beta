
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, User, LogOut, ShieldCheck, Award, Flame, Heart, Edit, Save, BarChart3, MapIcon, VenusAndMars, Smile, UserPlus, Link2, ThumbsDown, SmilePlus, Frown, Angry, Hand, MehIcon } from 'lucide-react';
import { correctMalformedUrl } from '@/lib/utils';
import Link from 'next/link';
import { ADMIN_UID } from '@/config/admin';
import { Separator } from '@/components/ui/separator';
import type { UserProfile, LocalUserStreak, Attitude, Figure, EmotionVote } from '@/lib/types';
import { useAuth } from '@/hooks/useAuth';
import { auth, app, db } from '@/lib/firebase';
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
import { getFiguresByIds } from '@/lib/placeholder-data';

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

const EMOTION_IMAGES: Record<string, {label: string, imageUrl: string}> = {
  alegria: { label: 'Alegría', imageUrl: 'https://firebasestorage.googleapis.com/v0/b/wikistars5-2yctr.firebasestorage.app/o/emociones%2Falegria.png?alt=media&token=0638fdc0-d367-4fec-b8d6-8b32c0c83414' },
  envidia: { label: 'Envidia', imageUrl: 'https://firebasestorage.googleapis.com/v0/b/wikistars5-2yctr.firebasestorage.app/o/emociones%2Fenvidia.png?alt=media&token=940aa136-2235-48db-84d6-2c461730fde5' },
  tristeza: { label: 'Tristeza', imageUrl: 'https://firebasestorage.googleapis.com/v0/b/wikistars5-2yctr.firebasestorage.app/o/emociones%2Ftrizteza.png?alt=media&token=0115df4b-55e4-4281-9cff-a8a560c38903' },
  miedo: { label: 'Miedo', imageUrl: 'https://firebasestorage.googleapis.com/v0/b/wikistars5-2yctr.firebasestorage.app/o/emociones%2Fmiedo.png?alt=media&token=bef3711f-7f06-4a9c-8d24-dc0f32f1d985' },
  desagrado: { label: 'Desagrado', imageUrl: 'https://firebasestorage.googleapis.com/v0/b/wikistars5-2yctr.firebasestorage.app/o/emociones%2Fdesagrado.png?alt=media&token=3477f36d-357f-4982-b1d2-c735a8e1f4bb' },
  furia: { label: 'Furia', imageUrl: 'https://firebasestorage.googleapis.com/v0/b/wikistars5-2yctr.firebasestorage.app/o/emociones%2Ffuria.png?alt=media&token=e596fcc4-3ef2-4b32-8529-ce42d4758f2f' },
};

export default function ProfilePage() {
  const { user: currentUser, firebaseUser, isLoading, isAnonymous } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [streaks, setStreaks] = useState<LocalUserStreak[]>([]);
  
  // States for Attitude and Emotion Lists
  const [attitudeFigures, setAttitudeFigures] = useState<Figure[]>([]);
  const [attitudes, setAttitudes] = useState<Attitude[]>([]);

  const [alegriaList, setAlegriaList] = useState<Figure[]>([]);
  const [envidiaList, setEnvidiaList] = useState<Figure[]>([]);
  const [tristezaList, setTristezaList] = useState<Figure[]>([]);
  const [miedoList, setMiedoList] = useState<Figure[]>([]);
  const [desagradoList, setDesagradoList] = useState<Figure[]>([]);
  const [furiaList, setFuriaList] = useState<Figure[]>([]);
  const [emotions, setEmotions] = useState<EmotionVote[]>([]);

  const [isDataLoading, setIsDataLoading] = useState(true);
  const [isLinking, setIsLinking] = useState(false);
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [animationStreak, setAnimationStreak] = useState<number | null>(null);
  
  const { control, handleSubmit, reset, formState: { isSubmitting, errors } } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: { username: '', countryCode: '', gender: '' },
  });

  const { control: linkControl, handleSubmit: handleLinkSubmit, formState: { errors: linkErrors }, reset: resetLink } = useForm<LinkAccountFormValues>({
    resolver: zodResolver(linkAccountFormSchema),
    defaultValues: { email: '', password: '', username: ''}
  });
  
  const loadProfileData = useCallback(async (tabToLoad: 'attitude' | 'emotion' | 'all') => {
    // This is the key change: only load from localStorage if the user is anonymous.
    if (!isAnonymous) {
      setStreaks([]);
      setAttitudes([]);
      setEmotions([]);
      setAttitudeFigures([]);
      setAlegriaList([]);
      setEnvidiaList([]);
      setTristezaList([]);
      setMiedoList([]);
      setDesagradoList([]);
      setFuriaList([]);
      setIsDataLoading(false);
      return;
    }

    setIsDataLoading(true);

    try {
      // Always load streaks and filter for active ones
      const streaksJSON = localStorage.getItem('wikistars5-userStreaks');
      if (streaksJSON) {
        let localStreaks: LocalUserStreak[] = JSON.parse(streaksJSON);
        
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        
        // Filter to only show streaks from today or yesterday
        const activeStreaks = localStreaks.filter(streak => {
            const lastDate = new Date(streak.lastCommentDate);
            return lastDate.toDateString() === today.toDateString() || lastDate.toDateString() === yesterday.toDateString();
        });
        
        activeStreaks.sort((a, b) => b.currentStreak - a.currentStreak);
        setStreaks(activeStreaks);
      } else {
        setStreaks([]);
      }


      // Load attitude data if requested
      if (tabToLoad === 'attitude' || tabToLoad === 'all') {
        const attitudesJSON = localStorage.getItem('wikistars5-attitudes');
        const localAttitudes: Attitude[] = attitudesJSON ? JSON.parse(attitudesJSON) : [];
        setAttitudes(localAttitudes.sort((a, b) => {
          // Sort by date, but handle cases where addedAt might be missing
          const dateA = a.addedAt ? new Date(a.addedAt).getTime() : 0;
          const dateB = b.addedAt ? new Date(b.addedAt).getTime() : 0;
          return dateB - dateA;
        }));
        
        const figureIds = localAttitudes.map(a => a.figureId);
        if (figureIds.length > 0) {
            const figures = await getFiguresByIds(figureIds);
            setAttitudeFigures(figures);
        } else {
            setAttitudeFigures([]);
        }
      }

      // Load emotion data if requested
      if (tabToLoad === 'emotion' || tabToLoad === 'all') {
        const emotionsJSON = localStorage.getItem('wikistars5-emotions');
        const localEmotions: EmotionVote[] = emotionsJSON ? JSON.parse(emotionsJSON) : [];
        setEmotions(localEmotions.sort((a, b) => {
          const dateA = a.addedAt ? new Date(a.addedAt).getTime() : 0;
          const dateB = b.addedAt ? new Date(b.addedAt).getTime() : 0;
          return dateB - dateA;
        }));

        const figureIdsByEmotion = {
            alegria: localEmotions.filter(e => e.emotion === 'alegria').map(e => e.figureId),
            envidia: localEmotions.filter(e => e.emotion === 'envidia').map(e => e.figureId),
            tristeza: localEmotions.filter(e => e.emotion === 'tristeza').map(e => e.figureId),
            miedo: localEmotions.filter(e => e.emotion === 'miedo').map(e => e.figureId),
            desagrado: localEmotions.filter(e => e.emotion === 'desagrado').map(e => e.figureId),
            furia: localEmotions.filter(e => e.emotion === 'furia').map(e => e.figureId),
        };

        const [alegriaFigures, envidiaFigures, tristezaFigures, miedoFigures, desagradoFigures, furiaFigures] = await Promise.all([
            getFiguresByIds(figureIdsByEmotion.alegria), getFiguresByIds(figureIdsByEmotion.envidia),
            getFiguresByIds(figureIdsByEmotion.tristeza), getFiguresByIds(figureIdsByEmotion.miedo),
            getFiguresByIds(figureIdsByEmotion.desagrado), getFiguresByIds(figureIdsByEmotion.furia),
        ]);

        setAlegriaList(alegriaFigures); setEnvidiaList(envidiaFigures);
        setTristezaList(tristezaFigures); setMiedoList(miedoFigures);
        setDesagradoList(desagradoFigures); setFuriaList(furiaFigures);
      }
        
    } catch (error) {
        console.error("Error loading data from localStorage", error);
        toast({ title: "Error", description: "No se pudieron cargar los datos del perfil.", variant: "destructive" });
    } finally {
        setIsDataLoading(false);
    }
  }, [isAnonymous, toast]);


  useEffect(() => {
    if (!isLoading && currentUser) {
      reset({
        username: currentUser.username ?? '',
        countryCode: currentUser.countryCode ?? '',
        gender: currentUser.gender ?? '',
      });
      loadProfileData('all');
    }
  }, [isLoading, currentUser, reset, loadProfileData]);


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
      toast({ title: "Error", description: "No hay una cuenta de invitado para vincular.", variant: "destructive" });
      return;
    }
    setIsLinking(true);
    try {
      // Create the credential
      const credential = EmailAuthProvider.credential(data.email, data.password);
      
      // Link the credential to the anonymous user
      await linkWithCredential(firebaseUser, credential);

      // Now that the account is permanent, update the profile with the chosen username
      await updateUserProfileCallable({
        username: data.username,
        countryCode: currentUser?.countryCode,
        gender: currentUser?.gender,
      });

      toast({
        title: "¡Cuenta Vinculada!",
        description: "Tu progreso ha sido guardado en tu nueva cuenta.",
      });
      setIsLinkDialogOpen(false);
      resetLink();
      router.refresh(); // Refresh the page to reflect the new state

    } catch (error: any) {
      console.error("Error linking account:", error);
      let message = "No se pudo crear la cuenta.";
      if (error.code === 'auth/email-already-in-use') {
        message = 'Este correo ya está en uso por otra cuenta.';
      } else if (error.code === 'auth/credential-already-in-use') {
        message = 'Estas credenciales ya están asociadas con otro usuario.';
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

  const AttitudeList = ({ figures, attitudeKey, emptyMessage }: { figures: Figure[], attitudeKey: string, emptyMessage: string }) => {
    const attitudeMap = new Map(attitudes.map(a => [a.figureId, a]));
    const filteredFigures = figures.filter(f => attitudeMap.get(f.id)?.attitude === attitudeKey);

    return (
      <div className="space-y-4">
        {isDataLoading ? (
           <div className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : filteredFigures.length > 0 ? (
          filteredFigures.map(figure => {
            const attitude = attitudeMap.get(figure.id);
            let dateString = '';
            if (attitude && attitude.addedAt && !isNaN(new Date(attitude.addedAt).getTime())) {
              dateString = new Date(attitude.addedAt).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
            }

            return (
              <Link key={figure.id} href={`/figures/${figure.id}`} className="flex items-center gap-4 p-3 bg-muted/50 rounded-md hover:bg-muted transition-colors">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={correctMalformedUrl(figure.photoUrl) || undefined} alt={figure.name} />
                  <AvatarFallback>{figure.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-grow">
                  <p className="font-semibold">{figure.name}</p>
                  {dateString && <p className="text-xs text-muted-foreground">Marcado el {dateString}</p>}
                </div>
              </Link>
            )
          })
        ) : (
          <div className="text-sm text-muted-foreground text-center p-8 border-dashed border-2 rounded-md">
            <p>{emptyMessage}</p>
          </div>
        )}
      </div>
    )
  };
  
  const EmotionList = ({ figures, emptyMessage }: { figures: Figure[], emptyMessage: string }) => {
    const emotionMap = new Map(emotions.map(e => [e.figureId, e]));
    return (
      <div className="space-y-4">
        {isDataLoading ? (
           <div className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : figures.length > 0 ? (
          figures.map(figure => {
            const emotion = emotionMap.get(figure.id);
            let dateString = '';
            if (emotion && emotion.addedAt && !isNaN(new Date(emotion.addedAt).getTime())) {
                dateString = new Date(emotion.addedAt).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
            }
            return (
              <Link key={figure.id} href={`/figures/${figure.id}`} className="flex items-center gap-4 p-3 bg-muted/50 rounded-md hover:bg-muted transition-colors">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={correctMalformedUrl(figure.photoUrl) || undefined} alt={figure.name} />
                  <AvatarFallback>{figure.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-grow">
                  <p className="font-semibold">{figure.name}</p>
                   {dateString && <p className="text-xs text-muted-foreground">Votado el {dateString}</p>}
                </div>
              </Link>
            )
          })
        ) : (
          <div className="text-sm text-muted-foreground text-center p-8 border-dashed border-2 rounded-md">
            <p>{emptyMessage}</p>
          </div>
        )}
      </div>
    );
  };
  
  const renderProfileForAnonymousUser = () => (
    <>
        <div className="w-full mt-6">
          <Tabs defaultValue="rachas" className="w-full">
              <TabsList className="flex w-full overflow-x-auto whitespace-nowrap no-scrollbar mb-6 p-1 h-auto rounded-lg bg-black border border-white/20">
                  <TabsTrigger value="rachas"><Flame className="mr-2" />Rachas</TabsTrigger>
                  <TabsTrigger value="actitud" onClick={() => loadProfileData('attitude')}><Heart className="mr-2" />Mi Actitud</TabsTrigger>
                  <TabsTrigger value="emociones" onClick={() => loadProfileData('emotion')}><Smile className="mr-2" />Mis Emociones</TabsTrigger>
              </TabsList>
              
              <TabsContent value="rachas" className="mt-6">
                  <Card className="border border-white/20 bg-black">
                      <CardHeader>
                          <CardTitle>Rachas de Actividad</CardTitle>
                          <CardDescription>Tu historial de participación y rachas. ¡Gana una racha comentando o respondiendo en el perfil de un personaje por días consecutivos!</CardDescription>
                      </CardHeader>
                      <CardContent>
                          {isDataLoading ? (
                              <div className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                          ) : streaks.length > 0 ? (
                              <div className="space-y-4">
                                  {streaks.map(streak => (
                                      <Link key={streak.figureId} href={`/figures/${streak.figureId}`} className="flex items-center gap-4 p-3 bg-muted/50 rounded-md hover:bg-muted transition-colors">
                                          <Avatar className="h-12 w-12"><AvatarImage src={correctMalformedUrl(streak.figurePhotoUrl) || undefined} alt={streak.figureName} /><AvatarFallback>{streak.figureName.charAt(0)}</AvatarFallback></Avatar>
                                          <div className="flex-grow"><p className="font-semibold">{streak.figureName}</p><p className="text-sm text-muted-foreground">Último comentario: {new Date(streak.lastCommentDate).toLocaleDateString()}</p></div>
                                          <div className="flex items-center gap-2 text-orange-500 font-bold"><Flame className="h-5 w-5"/><span>{streak.currentStreak}</span></div>
                                      </Link>
                                  ))}
                              </div>
                          ) : (
                            <div className="text-sm text-muted-foreground text-center p-8 border-dashed border-2 rounded-md"><Flame className="mx-auto h-8 w-8 mb-2" /><p>Aún no tienes ninguna racha. ¡Comenta en el perfil de un personaje para empezar una!</p></div>
                          )}
                      </CardContent>
                  </Card>
              </TabsContent>
              
              <TabsContent value="actitud" className="mt-6">
                  <Card className="border border-white/20 bg-black">
                      <CardHeader>
                          <CardTitle>Mi Actitud</CardTitle>
                          <CardDescription>Aquí se muestran los personajes según la actitud que has votado por ellos.</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Tabs defaultValue="neutral" className="w-full">
                            <TabsList className="grid w-full grid-cols-4 h-auto">
                                <TabsTrigger value="neutral" className="flex-col p-4 text-sm gap-2 h-auto"><span className="text-4xl" role="img" aria-label="Neutral">😐</span>Neutral</TabsTrigger>
                                <TabsTrigger value="fan" className="flex-col p-4 text-sm gap-2 h-auto"><span className="text-4xl" role="img" aria-label="Fan">😍</span>Fans</TabsTrigger>
                                <TabsTrigger value="simp" className="flex-col p-4 text-sm gap-2 h-auto"><span className="text-4xl" role="img" aria-label="Simp">🥰</span>Simps</TabsTrigger>
                                <TabsTrigger value="hater" className="flex-col p-4 text-sm gap-2 h-auto"><span className="text-4xl" role="img" aria-label="Hater">😡</span>Haters</TabsTrigger>
                            </TabsList>
                            <div className="mt-4">
                              <TabsContent value="neutral"><AttitudeList figures={attitudeFigures} attitudeKey="neutral" emptyMessage="No has votado 'Neutral' por nadie."/></TabsContent>
                              <TabsContent value="fan"><AttitudeList figures={attitudeFigures} attitudeKey="fan" emptyMessage="Aún no has marcado a nadie como 'Fan'."/></TabsContent>
                              <TabsContent value="simp"><AttitudeList figures={attitudeFigures} attitudeKey="simp" emptyMessage="No has marcado a nadie como 'Simp'."/></TabsContent>
                              <TabsContent value="hater"><AttitudeList figures={attitudeFigures} attitudeKey="hater" emptyMessage="No has marcado a nadie como 'Hater'."/></TabsContent>
                            </div>
                        </Tabs>
                      </CardContent>
                  </Card>
              </TabsContent>

              <TabsContent value="emociones" className="mt-6">
                  <Card className="border border-white/20 bg-black">
                    <CardHeader>
                      <CardTitle>Mis Emociones</CardTitle>
                      <CardDescription>Aquí verás los personajes según la emoción que te provocan.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Tabs defaultValue="alegria" className="w-full">
                            <TabsList className="flex w-full overflow-x-auto whitespace-nowrap no-scrollbar p-1 h-auto bg-muted rounded-md text-muted-foreground">
                                {Object.entries(EMOTION_IMAGES).map(([key, {label, imageUrl}]) => (
                                    <TabsTrigger key={key} value={key} className="text-sm p-3 flex-col h-auto flex-shrink-0 gap-2">
                                        <Image src={imageUrl} alt={label} width={40} height={40} className="mb-1" />
                                        {label}
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                            <div className="mt-4">
                              <TabsContent value="alegria"><EmotionList figures={alegriaList} emptyMessage="No has votado 'Alegría' por nadie."/></TabsContent>
                              <TabsContent value="envidia"><EmotionList figures={envidiaList} emptyMessage="No has votado 'Envidia' por nadie."/></TabsContent>
                              <TabsContent value="tristeza"><EmotionList figures={tristezaList} emptyMessage="No has votado 'Tristeza' por nadie."/></TabsContent>
                              <TabsContent value="miedo"><EmotionList figures={miedoList} emptyMessage="No has votado 'Miedo' por nadie."/></TabsContent>
                              <TabsContent value="desagrado"><EmotionList figures={desagradoList} emptyMessage="No has votado 'Desagrado' por nadie."/></TabsContent>
                              <TabsContent value="furia"><EmotionList figures={furiaList} emptyMessage="No has votado 'Furia' por nadie."/></TabsContent>
                            </div>
                        </Tabs>
                      </CardContent>
                  </Card>
              </TabsContent>
          </Tabs>
      </div>
    </>
  );

  const renderProfileForRegisteredUser = () => (
    <>
      <div className="w-full mt-6">
          <Card className="border border-white/20 bg-black">
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
                      <div className="flex items-center gap-4"><MapIcon className="h-5 w-5 text-muted-foreground"/><p>{currentUser.country || 'No especificado'}</p></div>
                      <div className="flex items-center gap-4"><VenusAndMars className="h-5 w-5 text-muted-foreground"/><p>{GENDER_OPTIONS.find(g => g.value === currentUser.gender)?.label || 'No especificado'}</p></div>
                  </div>
              )}
              <Separator />
              <Button onClick={handleLogout} variant="destructive" className="w-full sm:w-auto"><LogOut className="mr-2 h-4 w-4" />Cerrar Sesión</Button>
            </CardContent>
          </Card>
      </div>
    </>
);

  return (
    <div className="space-y-8">
       <StreakAnimation 
        streakCount={animationStreak}
        isOpen={animationStreak !== null}
        onClose={() => setAnimationStreak(null)}
      />
      <Card className="w-full shadow-xl overflow-hidden border border-white/20 bg-black">
        <CardHeader className="items-center text-center p-6">
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
      </Card>
      
      {isAnonymous ? renderProfileForAnonymousUser() : renderProfileForRegisteredUser()}

    </div>
  );
}
