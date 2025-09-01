
"use client";

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GENDER_OPTIONS } from '@/config/genderOptions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserPlus, Save, Loader2, Edit, X } from 'lucide-react';
import { CountryCombobox } from '../shared/CountryCombobox';
import { signInAnonymously } from 'firebase/auth';
import { auth } from '@/lib/firebase';

const guestProfileFormSchema = z.object({
  username: z.string().min(3, "Tu nombre debe tener al menos 3 caracteres.").max(30, "Tu nombre no puede exceder los 30 caracteres."),
  gender: z.string().optional(),
  countryCode: z.string().optional(),
});
type GuestProfileFormValues = z.infer<typeof guestProfileFormSchema>;

interface GuestProfileSetupProps {
    onProfileSave: () => void;
    isEditingContext?: boolean; // To adapt the UI if used on the profile page
    onCancelEdit?: () => void; // To handle canceling the edit mode
}

export function GuestProfileSetup({ onProfileSave, isEditingContext = false, onCancelEdit }: GuestProfileSetupProps) {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isCountrySet, setIsCountrySet] = useState(false);

    const { control, handleSubmit, reset, formState: { errors } } = useForm<GuestProfileFormValues>({
        resolver: zodResolver(guestProfileFormSchema),
        defaultValues: {
            username: '',
            gender: '',
            countryCode: ''
        },
    });

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const guestUsername = localStorage.getItem('wikistars5-guestUsername') || '';
            const guestGenderValue = GENDER_OPTIONS.find(opt => opt.label === localStorage.getItem('wikistars5-guestGender'))?.value || '';
            const guestCountryCode = localStorage.getItem('wikistars5-guestCountryCode') || '';
            
            reset({
                username: guestUsername,
                gender: guestGenderValue,
                countryCode: guestCountryCode,
            });

            if (guestCountryCode) {
              setIsCountrySet(true);
            }
        }
    }, [reset]);


    const onSubmit = async (data: GuestProfileFormValues) => {
        setIsSubmitting(true);
        try {
          // The core change: only sign in anonymously when the user commits by saving their profile.
          if (!auth.currentUser) {
            await signInAnonymously(auth);
          }
          
          if (typeof window !== 'undefined') {
            const genderLabel = GENDER_OPTIONS.find(opt => opt.value === data.gender)?.label || '';
            localStorage.setItem('wikistars5-guestUsername', data.username);
            localStorage.setItem('wikistars5-guestGender', genderLabel);
            
            // Allow setting country only once for consistency
            if (!isCountrySet && data.countryCode) {
                localStorage.setItem('wikistars5-guestCountryCode', data.countryCode);
            }
      
            toast({
              title: "¡Perfil de Invitado Guardado!",
              description: `Tu información local ha sido guardada.`,
            });
            
            // This custom event is crucial for other components to react to the profile update.
            window.dispatchEvent(new CustomEvent('guestProfileUpdated'));
            onProfileSave();
          }
        } catch (error: any) {
            console.error("Error creating guest profile:", error);
            toast({ title: "Error", description: "No se pudo crear tu perfil de invitado.", variant: "destructive"});
        } finally {
            setIsSubmitting(false);
        }
      };

    return (
        <Card className={isEditingContext ? "border-0 shadow-none p-0 bg-transparent" : "bg-muted/50"}>
            {!isEditingContext && (
                 <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-base"><UserPlus /> Configura tu Perfil de Invitado</CardTitle>
                    <CardDescription className="text-xs">
                        Elige un nombre y género para poder comentar. Esta información se guardará solo en este dispositivo.
                    </CardDescription>
                </CardHeader>
            )}
            <CardContent className="p-4 pt-0">
                 <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                        <Label htmlFor="guest-username">Tu Nombre</Label>
                        <Controller
                            name="username"
                            control={control}
                            render={({ field }) => (
                                <Input 
                                    id="guest-username" 
                                    placeholder="Elige un nombre" 
                                    {...field} 
                                />
                            )}
                        />
                        {errors.username && (
                            <p className="text-sm text-destructive mt-1">{errors.username.message}</p>
                        )}
                    </div>
                    <div>
                        <Label htmlFor="guest-gender">Sexo</Label>
                            <Controller
                            name="gender"
                            control={control}
                            render={({ field }) => {
                                return (
                                    <Select onValueChange={field.onChange} value={field.value ?? ''}>
                                        <SelectTrigger id="guest-gender">
                                        <SelectValue placeholder="Selecciona tu sexo" />
                                        </SelectTrigger>
                                        <SelectContent>
                                        {GENDER_OPTIONS.map((opt) => (
                                            (opt.value === 'male' || opt.value === 'female') && (
                                            <SelectItem key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </SelectItem>
                                            )
                                        ))}
                                        </SelectContent>
                                    </Select>
                                )
                            }}
                        />
                    </div>
                     <div>
                        <Label htmlFor="guest-country">País</Label>
                        <Controller
                            name="countryCode"
                            control={control}
                            render={({ field }) => (
                                <CountryCombobox
                                    value={field.value ?? ''}
                                    onChange={field.onChange}
                                    disabled={isCountrySet}
                                />
                            )}
                        />
                        {isCountrySet && <p className="text-xs text-muted-foreground mt-1">La nacionalidad no se puede cambiar una vez establecida.</p>}
                    </div>
                    
                    <div className="flex justify-end gap-2 pt-2">
                        {isEditingContext && onCancelEdit && (
                             <Button type="button" variant="ghost" onClick={onCancelEdit} disabled={isSubmitting}>
                                <X className="mr-2 h-4 w-4"/> Cancelar
                            </Button>
                        )}
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>}
                            Guardar
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}
