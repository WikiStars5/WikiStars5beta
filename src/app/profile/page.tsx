

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
import { Loader2, User, LogOut, ShieldCheck, Flame, Heart, Edit, Save, BarChart3, MapPin, Venus, Smile, UserPlus, Link2, X } from 'lucide-react';
import { correctMalformedUrl } from '@/lib/utils';
import Link from 'next/link';
import { ADMIN_UID } from '@/config/admin';
import { Separator } from '@/components/ui/separator';
import type { UserProfile, LocalUserStreak, Attitude, Figure, EmotionVote, Streak } from '@/lib/types';
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
import Image from 'next/image';
import { StreakAnimation } from '@/components/shared/StreakAnimation';
import { getFiguresByIds } from '@/lib/placeholder-data';
import { countryCodeToNameMap } from '@/config/countries';
import { differenceInHours } from 'date-fns';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';

const profileFormSchema = z.object({
  username: z.string().min(3, "El nombre de usuario debe tener al menos 3 caracteres.").max(30, "El nombre de usuario no puede exceder los 30 caracteres."),
  countryCode: z.string().optional(),
  gender: z.string().optional(),
});
type ProfileFormValues = z.infer<typeof profileFormSchema>;

const updateUserProfileCallable = httpsCallable(getFunctions(app, 'us-central1'), 'updateUserProfile');

const EMOTION_IMAGES: Record<string, {label: string, imageUrl: string}> = {
  alegria: { label: 'Alegría', imageUrl: 'https://firebasestorage.googleapis.com/v0/b/wikistars5-2yctr.firebasestorage.app/o/emociones%2Falegria.png?alt=media&token=0638fdc0-d367-4fec-b8d6-8b32c0c83414' },
  envidia: { label: 'Envidia', imageUrl: 'https://firebasestorage.googleapis.com/v0/b/wikistars5-2yctr.firebasestorage.app/o/emociones%2Fenvidia.png?alt=media&token=940aa136-2235-48db-84d6-2c461730fde5' },
  tristeza: { label: 'Tristeza', imageUrl: 'https://firebasestorage.googleapis.com/v0/b/wikistars5-2yctr.firebasestorage.app/o/emociones%2Ftrizteza.png?alt=media&token=0115df4b-55e4-4281-9cff-a8a560c38903' },
  miedo: { label: 'Miedo', imageUrl: 'https://firebasestorage.googleapis.com/v0/b/wikistars5-2yctr.firebasestorage.app/o/emociones%2Fmiedo.png?alt=media&token=bef3711f-7f06-4a9c-8d24-dc0f32f1d985' },
  desagrado: { label: 'Desagrado', imageUrl: 'https://firebasestorage.googleapis.com/v0/b/wikistars5-2yctr.firebasestorage.app/o/emociones%2Fdesagrado.png?alt=media&token=3477f36d-357f-4982-b1d2-c735a8e1f4bb' },
  furia: { label: 'Furia', imageUrl: 'https://firebasestorage.googleapis.com/v0/b/wikistars5-2yctr.firebasestorage.app/o/emociones%2Ffuria.png?alt=media&token=e596fcc4-3ef2-4b32-8529-ce42d4758f2f' },
};

const FIRE_GIF_URL = "https://firebasestorage.googleapis.com/v0/b/wikistars5-2yctr.firebasestorage.app/o/image%2Ffire.gif?alt=media&token=fd18d32d-c443-4da6-a369-e55ae241f7c5";

interface StreakWithFigure extends LocalUserStreak {
    figure?: Figure;
}

export default function ProfilePage() {
  const { user: firestoreUser, firebaseUser, isLoading, isAnonymous } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  // States for data
  const [streaks, setStreaks] = useState<StreakWithFigure[]>([]);
  const [attitudes, setAttitudes] = useState<Attitude[]>([]);
  const [emotions, setEmotions] = useState<EmotionVote[]>([]);
  
  // States for figures related to votes
  const [attitudeFigures, setAttitudeFigures] = useState<Figure[]>([]);
  const [emotionFigures, setEmotionFigures] = useState<Figure[]>([]);

  const [isDataLoading, setIsDataLoading] = useState(true);
  const [animationStreak, setAnimationStreak] = useState<number | null>(null);

  const { control, handleSubmit, reset, formState: { isSubmitting, errors } } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: { username: '', countryCode: '', gender: '' },
  });
  
  const loadLocalData = useCallback(async () => {
    if (!firebaseUser) return;
    setIsDataLoading(true);
    try {
        // Fetch local streaks
        const streaksJSON = localStorage.getItem('wikistars5-userStreaks');
        const localStreaks: LocalUserStreak[] = streaksJSON ? JSON.parse(streaksJSON) : [];
        
        // Filter out expired streaks
        const now = new Date();
        const activeStreaks = localStreaks.filter(streak => {
            const lastCommentDate = new Date(streak.lastCommentDate);
            return differenceInHours(now, lastCommentDate) < 24;
        });

        // Update localStorage with only active streaks
        localStorage.setItem('wikistars5-userStreaks', JSON.stringify(activeStreaks));
        
        const figureIdsForStreaks = activeStreaks.map(s => s.figureId);
        if (figureIdsForStreaks.length > 0) {
            const figures = await getFiguresByIds(figureIdsForStreaks);
            const figuresMap = new Map(figures.map(f => [f.id, f]));
            const streaksWithFigures = activeStreaks
              .map(s => ({ ...s, figure: figuresMap.get(s.figureId) }))
              .filter(s => s.figure); // Ensure figure exists
            setStreaks(streaksWithFigures);
        } else {
            setStreaks([]);
        }

        // Fetch local attitudes & emotions
        const attitudesJSON = localStorage.getItem('wikistars5-userAttitudes');
        const localAttitudes: Attitude[] = attitudesJSON ? JSON.parse(attitudesJSON) : [];
        setAttitudes(localAttitudes);
        const attitudeFigureIds = localAttitudes.map(a => a.figureId);
        if (attitudeFigureIds.length > 0) {
            const figures = await getFiguresByIds(attitudeFigureIds);
            setAttitudeFigures(figures);
        }

        const emotionsJSON = localStorage.getItem('wikistars5-userEmotions');
        const localEmotions: EmotionVote[] = emotionsJSON ? JSON.parse(emotionsJSON) : [];
        setEmotions(localEmotions);
        const emotionFigureIds = localEmotions.map(e => e.figureId);
        if (emotionFigureIds.length > 0) {
            const figures = await getFiguresByIds(emotionFigureIds);
            setEmotionFigures(figures);
        }

    } catch (error) {
        console.error("Error loading profile data from localStorage:", error);
        toast({ title: "Error", description: "No se pudieron cargar los datos de tu actividad local.", variant: "destructive" });
    } finally {
        setIsDataLoading(false);
    }
  }, [firebaseUser, toast]);


  useEffect(() => {
    if (!isLoading) {
      if (firestoreUser) {
        reset({
          username: firestoreUser.username ?? '',
          countryCode: firestoreUser.countryCode ?? '',
          gender: firestoreUser.gender ?? '',
        });
      }
      loadLocalData();
    }
  }, [isLoading, firestoreUser, reset, loadLocalData]);

  const onProfileSubmit = async (data: ProfileFormValues) => {
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

  if (!firestoreUser) {
     return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center p-4">
             <Card className="max-w-md">
                <CardHeader>
                    <CardTitle>Perfil de Invitado</CardTitle>
                    <CardDescription>
                        Para ver tu perfil, rachas y actividad, necesitas crear una cuenta.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button asChild>
                        <Link href="/login">Iniciar Sesión o Registrarse</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
  }

  const isAdmin = firestoreUser.role === 'admin';
  const displayName = firestoreUser.username || "Usuario";

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
                  <CardDescription>Edita los datos públicos de tu perfil.</CardDescription>
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
              <Button onClick={handleLogout} variant="destructive" className="w-full sm:w-auto"><LogOut className="mr-2 h-4 w-4" />Cerrar Sesión</Button>
            </CardContent>
          </Card>
      </div>

    </div>
  );
}
