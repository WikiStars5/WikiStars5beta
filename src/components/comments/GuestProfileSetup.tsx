
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
import { UserPlus, Save, Loader2, Edit } from 'lucide-react';
import { CountryCombobox } from '../shared/CountryCombobox';

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
            const guestUsername = localStorage.getItem('wikistars5-guestUsername') || '';
            const guestGender = localStorage.getItem('wikistars5-guestGender') || '';
            const guestCountryCode = localStorage.getItem('wikistars5-guestCountryCode') || '';
            reset({
                username: guestUsername,
                gender: guestGender,
                countryCode: guestCountryCode,
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
          
          window.dispatchEvent(new CustomEvent('guestProfileUpdated'));
          onProfileSave();
        }
      };

    return (
        <Card className={isEditingContext ? "border-0 shadow-none p-0" : "bg-muted/50"}>
            {!isEditingContext && (
                 <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-base"><UserPlus /> Configura tu Perfil de Invitado</CardTitle>
                    <CardDescription className="text-xs">
                        Elige un nombre y género para poder comentar. Esta información se guardará solo en este dispositivo.
                    </CardDescription>
                </CardHeader>
            )}
            <CardContent className="p-0">
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
                        <Label htmlFor="guest-country">País</Label>
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
