
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
import { CountryCombobox } from '@/components/shared/CountryCombobox';
import { GENDER_OPTIONS } from '@/config/genderOptions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserPlus, Save, Loader2, Edit, X, Venus, MapPin } from 'lucide-react';
import { countryCodeToNameMap } from '@/config/countries';

const guestProfileFormSchema = z.object({
  username: z.string().min(3, "Tu nombre debe tener al menos 3 caracteres.").max(30, "Tu nombre no puede exceder los 30 caracteres."),
  gender: z.string().optional(),
  countryCode: z.string().optional(),
});
type GuestProfileFormValues = z.infer<typeof guestProfileFormSchema>;

interface GuestProfileSetupProps {
    onProfileSave: () => void;
    isEditingContext?: boolean; // To adapt the UI if used on the profile page
}

export function GuestProfileSetup({ onProfileSave, isEditingContext = false }: GuestProfileSetupProps) {
    const { toast } = useToast();
    const [isEditing, setIsEditing] = useState(isEditingContext); // Start in edit mode if on profile page

    const { control, handleSubmit, reset, formState: { isSubmitting, errors } } = useForm<GuestProfileFormValues>({
        resolver: zodResolver(guestProfileFormSchema),
        defaultValues: {
            username: '',
            gender: '',
            countryCode: ''
        },
    });

    useEffect(() => {
        if (typeof window !== 'undefined') {
            reset({
                username: localStorage.getItem('wikistars5-guestUsername') || '',
                gender: localStorage.getItem('wikistars5-guestGender') || '',
                countryCode: localStorage.getItem('wikistars5-guestCountryCode') || '',
            });
        }
    }, [reset]);

    const onSubmit = (data: GuestProfileFormValues) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('wikistars5-guestUsername', data.username);
          localStorage.setItem('wikistars5-guestGender', data.gender || '');
          localStorage.setItem('wikistars5-guestCountryCode', data.countryCode || '');
    
          toast({
            title: "¡Perfil de Invitado Guardado!",
            description: `Tu información local ha sido actualizada.`,
          });
          onProfileSave();
          if (isEditingContext) {
            setIsEditing(false); // Exit edit mode on profile page
          }
        }
      };

    if (isEditingContext && !isEditing) {
        const guestData = {
            username: localStorage.getItem('wikistars5-guestUsername'),
            gender: GENDER_OPTIONS.find(g => g.value === localStorage.getItem('wikistars5-guestGender'))?.label,
            countryCode: localStorage.getItem('wikistars5-guestCountryCode'),
        };

        return (
            <div className="space-y-4">
                <div className="flex items-center gap-4"><UserPlus className="h-5 w-5 text-muted-foreground"/><p>{guestData.username}</p></div>
                <div className="flex items-center gap-4"><Venus className="h-5 w-5 text-muted-foreground"/><p>{guestData.gender || 'No especificado'}</p></div>
                <div className="flex items-center gap-4"><MapPin className="h-5 w-5 text-muted-foreground"/><p>{countryCodeToNameMap.get(guestData.countryCode || '') || 'No especificado'}</p></div>
                 <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                    <Edit className="mr-2 h-4 w-4" /> Editar
                </Button>
            </div>
        )
    }

    return (
        <Card className={isEditingContext ? "border-0 shadow-none" : "bg-muted/50"}>
            {!isEditingContext && (
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><UserPlus /> Configura tu Perfil de Invitado</CardTitle>
                    <CardDescription>
                        Elige un nombre, género y país para poder comentar. Esta información se guardará solo en este dispositivo.
                    </CardDescription>
                </CardHeader>
            )}
            <CardContent className={isEditingContext ? "p-0" : ""}>
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
                            render={({ field }) => (
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
                            )}
                        />
                    </div>
                    <div>
                        <Label htmlFor="guest-countryCode">País</Label>
                        <Controller
                            name="countryCode"
                            control={control}
                            render={({ field }) => (
                                <CountryCombobox
                                    value={field.value ?? ''}
                                    onChange={field.onChange}
                                />
                            )}
                        />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        {isEditingContext && (
                             <Button variant="ghost" type="button" onClick={() => setIsEditing(false)} disabled={isSubmitting}>Cancelar</Button>
                        )}
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>}
                            {isEditingContext ? 'Guardar Cambios' : 'Guardar y Comentar'}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}
